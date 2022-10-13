import { validateMnemonic, mnemonicToSeed, generateMnemonic } from "@scure/bip39"
import { wordlist } from '@scure/bip39/wordlists/english.js';

import { Address, HDNode, TransactionBuilder } from "./utils/bitbox.js"
import { createSimpleSendTransaction } from "./utils/create-transaction.js"
import { feesFor, getAddressScriptHash, MIN_SATOSHIS } from "./utils.js";
import { signContributionData } from "./flipstarter-common.js";
import type { Utxo, Recipient, Commitment } from "./types.js";
import type { 
  HDNode as HDNodeType,
  ECPair as ECPairType,
  Transaction as TransactionType
} from "@psf/bitcoincashjs-lib";

const maxOpReturnBytes = 220;
const notificationFee = feesFor(1, 1) + maxOpReturnBytes + MIN_SATOSHIS;

const defaultHdPath = "m/44'/0'/0'/0/0"
const BITCOIN_NETWORK = "mainnet"
const WALLET_HD_PATH = defaultHdPath

interface Checkout {
  ready: boolean,
  fee: number,
  availableBalance: number,
  checkoutBalance: number,
  utxos: Utxo[]
}

export { notificationFee };

/**
 * @typedef {CommitmentPending}
 * @param {string} txHash
 * @param {number} txIndex
 * @param {number} seqNum
 * @param {string} unlockingScript
 * @param {Uint8Array} cid
 */

/**
 * @typedef {CommitmentFullfilled}
 * @param {string} txHash
 * @param {number} txIndex
 * @param {number} seqNum
 * @param {string} unlockingScript
 * @param {string} lockingScript
 * @param {string} scriptHash
 * @param {string} address
 */

export class FlipstarterWallet {
  
  public hdNode: HDNodeType
  public address: string
  public scriptHash: string
  public wif: string

  constructor(hdNode: HDNodeType) {
    this.hdNode = hdNode;
    const legacyAddr = hdNode.keyPair.getAddress();
    this.address = Address.toCashAddress(legacyAddr);
    this.scriptHash = getAddressScriptHash(this.address);
    this.wif = hdNode.keyPair.toWIF();
  }

  static async createSeedPhrase() {
    return generateMnemonic(wordlist, 128);
  }

  static async create(seedPhrase:string) {
    if (!seedPhrase) seedPhrase = await FlipstarterWallet.createSeedPhrase();
    if (!validateMnemonic(seedPhrase, wordlist)) throw new Error("invalid seed phrase");
  
    const seedBuffer = Buffer.from(await mnemonicToSeed(seedPhrase));
    const rootHdNode = HDNode.fromSeed(seedBuffer, BITCOIN_NETWORK);
    const hdNode = HDNode.derivePath(rootHdNode, WALLET_HD_PATH);
  
    return new FlipstarterWallet(hdNode);
  }

  async createNotificationTransaction({ commitmentData, commitmentCid, notificationOutpoint, notificationAddress }: {
    commitmentData: any,
    commitmentCid: string,
    notificationOutpoint: Utxo,
    notificationAddress: string
  }) {
    //Create notification with commitment data and IPFS hash.
    const notificationData = await createNotificationData({ 
      ...commitmentData, 
      cid: commitmentCid 
    });

    //Send notification to first recipients address
    const notificationTransaction = createNotificationTransaction(
      this.hdNode, 
      notificationAddress, 
      [notificationOutpoint], 
      notificationData
    );

    return notificationTransaction;
  }

  async createRefundTransaction(
    refundOutpoint:Utxo, 
    refundAddress:string, 
    refundTimestamp:string = null
  ) {
    return await createRefundTransaction(
      this.hdNode, 
      refundAddress, 
      refundOutpoint, 
      refundTimestamp
    );
  }
  
  async createCommitmentApplicationData(
    recipients:Recipient[], 
    commitmentOutpoint:Utxo, 
    applicationData:any, 
    refundAddress:string, 
    refundTimestamp:number
  ) {
    const unlockingScript = createCommitmentSignature(commitmentOutpoint, recipients, this.hdNode.keyPair);
    const commitmentData = { ...commitmentOutpoint, unlockingScript };
    
    applicationData = applicationData || {};

    if (refundAddress) {
      const timelockedRefundTransaction = await createRefundTransaction(this.hdNode, refundAddress, commitmentData, refundTimestamp);
      applicationData.refundTx = timelockedRefundTransaction.toHex();
    }
    
    //Sign application data and add to IPFS hash
    const applicationDataSignature = signContributionData(this.hdNode.keyPair, applicationData)

    return { commitmentData, applicationData, applicationDataSignature }
  }

  async createSetupTransaction(donationAmount:number, utxos:Utxo[]): Promise<TransactionType> {
    const { ready, utxos: useUtxos } = this.getCheckoutStatus(donationAmount, utxos);
    
    if (!ready) throw new Error("Wallet is not ready to make a donation with this amount.");

    const setupOutputs = [
      { satoshis: donationAmount, address: this.address },
      { satoshis: notificationFee, address: this.address }
    ];

    const { tx: setupTransaction } = createSimpleSendTransaction(this.hdNode, useUtxos, setupOutputs);
    return setupTransaction;  
  }

  getCheckoutStatus(donationAmount:number, utxos:Utxo[]): Checkout {
    const totalAmountDue = donationAmount + notificationFee;
    const availableUtxos = utxos.sort((a,b) => b.satoshis - a.satoshis);
    const availableBalance = availableUtxos.reduce((s, u) => s + u.satoshis, 0);
  
    if (donationAmount < MIN_SATOSHIS) {
      return {
        ready: false,
        fee: 0,
        availableBalance,
        checkoutBalance: 0,
        utxos: []
      }
    }

    /**
     * Consolidation fee = fee to move utxos to 2 (setup + notification), 3 (setup, notification, tip/change), or 4 (setup, notification, tip, change) outputs
     *  If no utxos at the moment or not enough sats to cover costs, then consolidationFee is cost of moving 1 more utxo to some outputs
     */
    let consolidationFee = 0;
    let usingUtxos = [];
    let totalSatoshis = 0;
  
    for (const utxo of availableUtxos) {
      usingUtxos.push(utxo);
      totalSatoshis += utxo.satoshis;
      consolidationFee = feesFor(usingUtxos.length, 2);
  
      if (totalSatoshis >= totalAmountDue + consolidationFee) {
        return { 
          ready: true,
          fee: consolidationFee + notificationFee, 
          availableBalance: availableBalance,
          checkoutBalance: 0,
          utxos: usingUtxos
        }
      }
    }
    
    const nextConsolidationFee = feesFor(availableUtxos.length + 1, 2);
    let checkoutBalance = (totalAmountDue + nextConsolidationFee) - availableBalance;

    if (checkoutBalance < 0) checkoutBalance = 0;
    if (checkoutBalance > 0 && checkoutBalance < MIN_SATOSHIS) checkoutBalance = MIN_SATOSHIS

    //This should increase each time user sends in less than requested.
    const fee = nextConsolidationFee + notificationFee;

    return { 
      ready: false, 
      fee, 
      availableBalance,
      checkoutBalance,
      utxos: []
    }
  }
}

async function createNotificationData(commitmentData:Commitment) {
  //Serializes commitment and posts to blockchain using walletService.makeNotification (op_return)
  const txHash = Buffer.from(commitmentData.txHash, "hex");
  
  const outputIndex = Buffer.alloc(4);
  outputIndex.writeUInt32LE(commitmentData.txIndex);
  
  const sequenceNumber = Buffer.alloc(4);
  sequenceNumber.writeUInt32LE(commitmentData.seqNum);

  const unlockingScript = Buffer.from(commitmentData.unlockingScript, "hex");
  const cidBytes = Buffer.from(
    (<import('multiformats').CID>commitmentData.cid)?.bytes || 
    (<string|Buffer> commitmentData?.cid) || 
    Buffer.alloc(34).fill(0)
  );
  
  //32 bytes, 32 bytes, 4 bytes, 4 bytes, 34 bytes, rest is unlocking.
  const outputData = Buffer.concat([txHash, outputIndex, sequenceNumber, cidBytes, unlockingScript]);

  if (outputData.byteLength > 220) {
    throw new Error("Unable to fit in one transaction");
  } 

  return outputData;
}

function createNotificationTransaction(hdNode:HDNodeType, address:string, utxos:Utxo[], data:string|Buffer) {
  
  const notificationOutputs = [
    { satoshis: MIN_SATOSHIS, address: address },
    { satoshis: 0, data: Buffer.from(data) }
  ]

  const { tx: notificationTransaction } = createSimpleSendTransaction(hdNode, utxos, notificationOutputs, null, true);
  return notificationTransaction;
}

/**
 * 
 * @param {{txHash:string, txIndex:number, satoshis:number, data:any}} outpoint 
 * @param {Array<{address:string,satoshis:number}>} recipients 
 * @param {import('bitbox-sdk').ECPair} keyPair 
 * @returns 
 */
function createCommitmentSignature(
  outpoint:Utxo, 
  recipients:Recipient[], 
  keyPair:ECPairType
) {
  //Create and sign a pledge tx moving coins from frozen addr to recipients of campaign.
  /** @type {import('bitbox-sdk').TransactionBuilder} */

  // @ts-ignore: _address hidden
  const commitTx:TransactionBuilderType = new TransactionBuilder(BITCOIN_NETWORK);

  commitTx.addInput(outpoint.txHash, outpoint.txIndex);

  recipients.forEach(recipient => {
    commitTx.addOutput(recipient.address, recipient.satoshis)
  });

  const vin = 0
  const redeemScript:undefined = undefined;
  const hashType = commitTx.hashTypes.SIGHASH_ALL | commitTx.hashTypes.SIGHASH_ANYONECANPAY
  const signatureAlgorithm = commitTx.signatureAlgorithms.ECDSA

  commitTx.sign(
    vin, 
    // @ts-ignore: ECPair.getPublicKeyBuffer, ECPair.getAddress
    keyPair, 
    redeemScript, 
    hashType,
    outpoint.satoshis,
    signatureAlgorithm
  )

  const txin = commitTx.build().ins[0]
  const commitmentSignature = txin.script.toString('hex');
  
  return commitmentSignature;
}


async function createRefundTransaction(hdNode:HDNodeType, address:string, utxo:Utxo, refundTimestamp:number|any) {
  const fee = feesFor(1, 1);
  const { tx: refundTransaction } = createSimpleSendTransaction(hdNode, [utxo], [{ address, satoshis: utxo.satoshis - fee }], refundTimestamp);
  return refundTransaction;
}
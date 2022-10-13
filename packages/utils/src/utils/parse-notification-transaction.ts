import { ECPair, Script } from "./bitbox.js"

import { CID } from 'multiformats/cid';
import { Buffer } from "buffer";
import { getP2PKHOutputScript, getScriptHash } from "../utils.js"

import type { Recipient } from "../types";
import type { Transaction, TransactionPoint } from "@psf/bitcoincashjs-lib"

interface Vout {
  script: string,
  value:number
}

/** 
 * @typedef FullfillmentContribution
 * @property {string} txHash
 * @property {number} txIndex
 * @property {string} unlockingScript 
 * @property {boolean} fullfillment 
 * @property {string} scriptHash 
 * @property {string} address 
 * @property {string} lockingScript */

/** 
 * @typedef NonfullfillmentContribution
 * @property {string} txHash
 * @property {number} txIndex
 * @property {string} unlockingScript  
 * @property {string} seqNum 
 * @property {string} cid */

/**
 * 
 * @param {Transaction} transaction 
 * @param {Array<{address:string, satoshis:number}>} recipients recipients
 * @returns {FullfillmentContribution|NonfullfillmentContribution}
 */
export default function parseNotificationTransaction(transaction:Transaction, recipients:Recipient[]) {
  /** @type {Array<{value:number, script:Uint8Array}>} */
  const vouts = transaction.outs;

  /** @type {Array<{hash:Uint8Array,index:number,script:Uint8Array}>} */
  const vins = transaction.ins;

  if (isFullfillment(vouts, recipients)) {
    //Can't have an op return and be a fullfillment, unless op_return declared from get go and then, not necessary to fetch
    const commitments = vins.map((vin) => { 

      //Following isn't useful since missing satoshis anyways
      const publicKey = Buffer.from(vin.script).slice(-33);
      const ecPair = ECPair.fromPublicKey(publicKey);
      const address = ECPair.toCashAddress(ecPair);
      const outputScript = getP2PKHOutputScript(address);
      const scriptHash = getScriptHash(outputScript)

      return {
        txHash: Buffer.from(vin.hash).reverse().toString('hex'),
        txIndex: vin.index,
        unlockingScript: Buffer.from(vin.script).toString('hex'),
        fullfillment: true,
        scriptHash,
        address,
        lockingScript: Buffer.from(outputScript).toString('hex')
      }
    });

    //Also return fee (actual fee rate) or values
    return { isFullfillment: true, commitments }

  } else {

    /** @type {import('multiformats').CID} */
    const commitment = parseCommitmentOutput(vouts);

    if (commitment && commitment.txHash && typeof commitment.txIndex !== 'undefined' && commitment.unlockingScript) {
      return { isFullfillment: false, commitments: [commitment] }
    }
  }

  return {isFullfillment: false, commitments: [] }
}

/** 
 * @param {Array<{value:number, script:Uint8Array}>} vouts
 * @param {Array<{address:string, satoshis:number}>} recipients
 */
 function isFullfillment(vouts:TransactionPoint[], recipients:Recipient[]) {

  if (vouts.length !== recipients.length) {
    return false;
  }

  return vouts.every((vout, index) => {
    const recipient = recipients[index];
    
    if (recipient) {
      const actualValueInSatoshis = vout.value;
      const actualOutputScript = Buffer.from(vout.script).toString('hex');
      const expectedOutputScript = getP2PKHOutputScript(recipient.address).toString('hex');

      return actualValueInSatoshis === recipient.satoshis && actualOutputScript === expectedOutputScript;
    }

    return false;
  });
}

/** 
 * @param {Array<{value:number, script:Uint8Array}>} vouts
 */
 function parseCommitmentOutput(vouts:Vout[]) {
  try {
    const opReturnVout = vouts.find(vout => Script.nullData.output.check(Buffer.from(vout.script)));
    if (opReturnVout) {
      return parseOpReturn(opReturnVout.script);
    }

    return null;
  } catch (err) {
    return null;
  }
}

function parseOpReturn(script:string) {
  const [opReturn, opReturnData] = Script.decode(script);

  var offset = 0
  function readSlice (n:number) {
    offset += n
    return opReturnData.slice(offset - n, offset)
  }

  function readUInt32 () {
    var i = opReturnData.readUInt32LE(offset)
    offset += 4
    return i
  }

  //Ordering important here
  const txHash = readSlice(32).toString("hex");
  const txIndex = readUInt32();
  const seqNum = readUInt32();
  const cid = parseCid(readSlice(34))?.toString?.();
  const unlockingScript = opReturnData.slice(offset).toString("hex");

  return { txHash, txIndex, seqNum, unlockingScript, cid };
}

function parseCid(data:string|Uint8Array):CID {
  try {
    const cid = CID.asCID(data);
    if (cid) return cid;
  } catch (err) { }

  try { 
    return CID.parse((<string>data)); 
  } catch (err) { }

  try { 
    return CID.decode((<Uint8Array>data)) 
  } catch (err) { }
}
import { ECPair } from "@psf/bitcoincashjs-lib";
import { Script, Crypto, Address, BitcoinCash } from "./utils/bitbox.js"
const SATS_PER_BCH = 100000000;

/**
 * Helper function that provides the dust limit standardness parameter.
 *
 * @returns the dustlimit in satoshis.
 */
const MIN_SATOSHIS = 546;

/**
 * Helper function that provides the max satoshis that is spendable.
 *
 * @returns the dustlimit in satoshis.
 */
const MAX_SATOSHIS = 2099999997690000;

const COMMITMENTS_PER_TRANSACTION = 650

// Define byte weights for different transaction parts.
const AVERAGE_BYTE_PER_CONTRIBUTION = 296;

const TRANSACTION_METADATA_BYTES = 10;

const AVERAGE_BYTE_PER_RECIPIENT = 69;

//Notification is sent
const MAX_OP_RETURN_BYTES = 220;
const P2PKH_IN_OUT_BYTES = 192;
const NOTIFICATION_TRANSACTION_BYTES =  P2PKH_IN_OUT_BYTES + MAX_OP_RETURN_BYTES


export { 
  SATS_PER_BCH,
  MIN_SATOSHIS,
  MAX_SATOSHIS,
  COMMITMENTS_PER_TRANSACTION,
  AVERAGE_BYTE_PER_CONTRIBUTION,
  TRANSACTION_METADATA_BYTES,
  AVERAGE_BYTE_PER_RECIPIENT,
  NOTIFICATION_TRANSACTION_BYTES,
}

export function parseAddressFromOutputScript(script:string) {
  const { pubKey } = Script.pubKeyHash.input.decode(script) || [];
  return Address.hash160ToCash(Crypto.ripemd160(Crypto.sha256(pubKey)));
}

export function getAddressScriptHash(cashAddr:string) {
  const hash160 = Address.toHash160(cashAddr);
  const outputScript = Script.fromASM("OP_DUP OP_HASH160 " + hash160 + " OP_EQUALVERIFY OP_CHECKSIG");
  const scriptHash = Crypto.sha256(outputScript).reverse().toString('hex');
  return scriptHash
}

export function signMessage(wif:string, message:string) {
  return BitcoinCash.signMessageWithPrivKey(wif, message);
}

export function verifyMessage(address:string, signature:string, message:string) {
  return BitcoinCash.verifyMessage(address, signature, message)
}

export function feesFor(inputNum:number, outputNum:number) {
  return BitcoinCash.getByteCount(
    { P2PKH: inputNum },
    { P2PKH: outputNum }
  );
}

export function getAddressFromLockscript(lockScript:string) {
  return Address.fromOutputScript(Buffer.from(lockScript, "hex"));
}

export function keyPairToAddress(keyPair:ECPair) {
  const legacyAddr = keyPair.getAddress();
  return Address.toCashAddress(legacyAddr);
}

export function getScriptHash(script:string) {
  const hash = Crypto.sha256(Buffer.from(script));
  return hash.reverse().toString("hex")
}

export function getP2PKHOutputScript(cashAddr:string) {
  const hash160 = Address.toHash160(cashAddr);
  return Script.fromASM("OP_DUP OP_HASH160 " + hash160 + " OP_EQUALVERIFY OP_CHECKSIG");
}

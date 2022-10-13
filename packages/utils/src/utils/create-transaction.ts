import { Script, HDNode, TransactionBuilder } from "./bitbox.js"
import type { Utxo, TransactionRecipient } from "../types";
import type { HDNode as HDNodeType } from "@psf/bitcoincashjs-lib"

const BITCOIN_NETWORK = "mainnet"
/**
 * 
 * @param {import('bitbox-sdk').HDNode} hdNode 
 * @param {Array<{ amount: number, satoshis: number, txHash: string, txIndex: number }>} utxos 
 * @param {Array<{ amount: number, satoshis: number, address: string|Buffer }} recipients 
 * @param {Object} sendData 
 * @returns 
 */

export function createSimpleSendTransaction(
  hdNode:HDNodeType,
  utxos:Utxo[],
  recipients:TransactionRecipient[],
  locktime = 0,
  sendData = false
) {

  const keyPair = HDNode.toKeyPair(hdNode);

  const tx = new TransactionBuilder(BITCOIN_NETWORK);
  
  locktime = locktime || 0;

  let totalSatoshisIn = 0;
  utxos.forEach((utxo) => {
    tx.addInput(utxo.txHash, utxo.txIndex, locktime ? 0xFFFFFFFE : 0xFFFFFFFF);
    totalSatoshisIn += utxo.satoshis;
  });

  let totalSatoshisOut = 0;
  let dataOutputs = 0;
  recipients.forEach((recipient) => {
    if (recipient.data && sendData) {
      dataOutputs++
      const data = Script.nullData.output.encode(recipient.data);
      tx.addOutput(data, 0);
    } else {
      tx.addOutput(recipient.address, recipient.satoshis);
    }
    totalSatoshisOut += recipient.satoshis;
  });

  //Last check if inputs don't make up for amount + fees
  if (totalSatoshisIn < totalSatoshisOut) {
    throw new Error("UTXO amount is less than requested amount")
  }

  tx.setLockTime(locktime);
  utxos.forEach((utxo, idx) => {
    tx.sign(
      idx,
      keyPair,
      undefined,
      tx.hashTypes.SIGHASH_ALL,
      utxo.satoshis,
      tx.signatureAlgorithms.SCHNORR
    );
  });

  return { tx: tx.build(), spent: totalSatoshisIn }
}
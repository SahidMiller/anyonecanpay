import type { ElectrumCluster } from "electrum-cash";
import type { TransactionHistoryResponse, UtxosResponse, TransactionHeaderResponse } from "./types";

export async function getTransactionHistory(electrum:ElectrumCluster, txHash:string) {
  await electrum.ready();
  const transactions = await electrum.request("blockchain.scripthash.get_history", txHash);
  if (transactions instanceof Error) {
    throw transactions
  }
  
  return (<TransactionHistoryResponse>transactions).map((tx) => ({
    txHash: tx.tx_hash,
    height: tx.height
  }))
  //Sort from newest to oldest
  .sort((a, b) => b.height - a.height);
}

export async function getBlockHeader(electrum:ElectrumCluster, height:number) {
  await electrum.ready();
  const header = await electrum.request('blockchain.block.header', height);
  if (header instanceof Error) {
    throw header
  }
  
  return (<TransactionHeaderResponse>header);
}

export async function getTransaction(electrum:ElectrumCluster, txHash:string) {
  await electrum.ready();
  const transactionHex = await electrum.request("blockchain.transaction.get", txHash, false);

  if (transactionHex instanceof Error) {
    throw transactionHex
  }

  return (<string>transactionHex);
}

export async function getUtxos(electrum:ElectrumCluster, scriptHash:string) {
  await electrum.ready();
  const unspentUTXOs = await electrum.request("blockchain.scripthash.listunspent", scriptHash);

  if (unspentUTXOs instanceof Error) {
    throw unspentUTXOs;
  }

  return (<UtxosResponse>unspentUTXOs).map((utxo) => ({
    txHash: utxo.tx_hash,
    txIndex: utxo.tx_pos,
    satoshis: utxo.value,
    height: utxo.height,
  }));
}

export async function broadcastTransaction(electrum:ElectrumCluster, txHex:string|Buffer|Uint8Array) {
  await electrum.ready();
  const rawTxHex = typeof txHex === 'string' ? txHex : txHex.toString('hex');

  const broadcastResult = await electrum.request(
    "blockchain.transaction.broadcast",
    rawTxHex
  );

  if (broadcastResult instanceof Error) {
    throw broadcastResult
  }

  return broadcastResult;
}
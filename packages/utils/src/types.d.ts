export interface Commitment {
  txHash: string,
  txIndex: number,
  satoshis: number,
  seqNum: number,
  unlockingScript: string,
  cid: string|Buffer|import('multiformats/cid').CID,
}

export interface ValidatedCommitment extends Commitment {
  satoshis: number,
  lockingScript: string
}

interface ApplicationCommitment extends ValidatedCommitment {
  applicationData: any,
  applicationDataSignature: string
}

export interface Utxo {
  txHash: string,
  txIndex: number,
  satoshis: number
}

export interface Recipient {
  address: string,
  satoshis: number
}

/**
 * Transaction/wallet specific interface that includes a data field for OP_RETURN (no address) 
 */
export interface TransactionRecipient {
  address?: string,
  data?: string|Buffer,
  satoshis: number
}

export interface TransactionHistoryResponseItem {
  tx_hash: string,
  height: number
}

export interface TransactionHeaderResponse {
  header: string
}

export interface TransactionHistoryResponse extends Array<TransactionHistoryResponseItem>{

}

export interface UtxosResponseItem {
  tx_hash: string,
  tx_pos: number,
  value: number,
  height: number,
}

export interface UtxosResponse extends Array<UtxosResponseItem> {

}
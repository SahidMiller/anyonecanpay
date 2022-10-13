import { Buffer } from "buffer";
import type { Commitment, Recipient } from "./types"

function getDefaultExpiration() {
  //return todays date + 30 days
}

/**
 * Create payload to be signed b Electron cash flipstarter plugin
 * 
 * @param {*} satoshis 
 * @param {*} recipients 
 * @param {*} expires 
 * @returns 
 */
export function createExternalWalletPayload(satoshis:number, recipients:Recipient[], expires:number) {

  const alias = "";
  const comment = "";

  const outputs = recipients.map((recipient) => {
    const outputValue = recipient.satoshis;
    const outputAddress = recipient.address;

    // Add the recipients outputs to the request.
    return { value: outputValue, address: outputAddress };
  });

  const expiresUnixTimestamp = expires || getDefaultExpiration();

  // Assemble an assurance request template.
  const template = JSON.stringify({
    outputs,
    data: {
      alias,
      comment,
    },
    donation: {
      amount: Number(satoshis),
    },
    expires: expiresUnixTimestamp
  });

  return Buffer.from(template, "utf8").toString('base64');
}

/**
 * Parse a commitment from Electron Cash Flipstarter plugin
 * 
 * @param {*} base64text 
 * @returns 
 */
export function parseCommitmentFromElectronCash(base64text:string) {
    
  try {
    // Attempt to decode the base64 contribution.
    const commitmentObject = JSON.parse(Buffer.from(base64text, 'base64').toString('utf8'));

    const { 
      previous_output_transaction_hash:txHash, 
      previous_output_index:txIndex,
      sequence_number:seqNum,
      unlocking_script:unlockingScript
    } = commitmentObject.inputs[0];

    return { txHash, txIndex, seqNum, unlockingScript };

  } catch (err) {
    
    return null;
  }
}

/**
 * Broadcast the notification transaction from Electron Cash
 * 
 * @param {*} commitment 
 * @param {*} recipients 
 * @returns 
 */
export function createOpReturnTransaction(commitment:Commitment, recipients:Recipient[]) {  
  
  //Serializes commitment and posts to blockchain using walletService.makeNotification (op_return)
  const txHashBuffer = Buffer.from(commitment.txHash, "hex");
  
  const outputIndex = Buffer.alloc(4);
  outputIndex.writeUInt32LE(commitment.txIndex);
  
  const sequenceNumber = Buffer.alloc(4);
  sequenceNumber.writeUInt32LE(commitment.seqNum);

  const unlockingScriptBuffer = Buffer.from(commitment.unlockingScript, "hex");
  
  //V0 is 34 bytes
  const cidBytes = Buffer.from(
    (<import('multiformats').CID>commitment.cid)?.bytes || 
    (<string|Buffer> commitment?.cid) || 
    Buffer.alloc(34).fill(0)
  );

  //32 bytes, 32 bytes, 4 bytes, 4 bytes, 34 bytes, rest is unlocking.
  const outputData = Buffer.concat([
    txHashBuffer, 
    outputIndex, 
    sequenceNumber, 
    cidBytes, 
    unlockingScriptBuffer
  ]);
  
  if (outputData.byteLength > 220) {
    throw new Error("Unable to fit in one transaction");
  } 
  
  const opReturn = "4c" + //OP_PUSHDATA1
    outputData.byteLength.toString(16) + //Byte length
    outputData.toString("hex");

  return opReturn;
}
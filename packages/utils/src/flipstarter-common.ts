import { encode as cborgencode } from "cborg"
import { getScriptHash, getAddressFromLockscript, feesFor, verifyMessage, signMessage } from "./utils.js";

import FlipstarterAssuranceContract from "./utils/FlipstarterAssuranceContract.js";
import validCommitmentSignature from "./utils/validate-commitment-signature.js";
export { default as parseNotificationTransaction } from "./utils/parse-notification-transaction.js";

import type { ECPair, Transaction } from "@psf/bitcoincashjs-lib";
import type { Recipient, Commitment, ValidatedCommitment, ApplicationCommitment } from "./types";

export function validateContribution(commitment:ValidatedCommitment, recipients:Recipient[]) {
  if (!recipients || !recipients.length) {
    throw "Cannot validate contribution without recipients!"
  }
  
  const isValid = validCommitmentSignature(recipients, commitment);  
  return isValid;
}

export function contributionFromTransaction(transaction:Transaction, txIndex:number) {
  const vout = transaction.outs[txIndex];

  const lockingScript = Buffer.from(vout.script).toString('hex');
  
  return {
    lockingScript,
    address: getAddressFromLockscript(lockingScript),
    scriptHash: getScriptHash(vout.script),
    satoshis: vout.value,
    seqNum: 0xffffffff,
  }
}

export function verifyContributionData(address:string, commitmentData:ApplicationCommitment) {
  try {
    const dataMessage = JSON.stringify(commitmentData.applicationData);
    const encodedMessage = cborgencode(dataMessage);
    const serializedMessage = Buffer.from(encodedMessage).toString("base64");

    return verifyMessage(address, commitmentData.applicationDataSignature, serializedMessage);
  } catch (err) {

    return false;
  }
}

export function signContributionData(keyPair:ECPair, applicationData:any) {
  try {
    const dataMessage = JSON.stringify(applicationData);
    const encodedMessage = cborgencode(dataMessage);
    const serializedMessage = Buffer.from(encodedMessage).toString("base64");

    return signMessage(keyPair.toWIF(), serializedMessage);
  } catch (err) {

    return false;
  }
}

export const createFlipstarterFullfillmentTransaction = async (recipients:Recipient[], contributions:Commitment[]) => {

  const contract = new FlipstarterAssuranceContract();
  
  // Add each recipient as outputs.
  recipients.forEach(recipient => {
    contract.addOutput(recipient)
  });

  //Order contributions from largest to smallest donations
  // Add relevant contributions to the contract..
  contributions.sort((a, b) => b.satoshis - a.satoshis).forEach(contribution => 
    contract.addCommitment(contribution)
  );

  // Fullfill contract if possible.
  if (contract.remainingCommitmentValue !== 0) throw new Error("Insufficient funds");

  // Assemble commitments into transaction
  const rawTransaction = contract.assembleTransaction();  
  return rawTransaction;
}

export function calculateFullfillmentFees(inputs:number, outputs:number) {
  return feesFor(inputs, outputs);
}
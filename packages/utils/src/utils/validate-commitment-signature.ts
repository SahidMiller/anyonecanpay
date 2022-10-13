import { Crypto, ECPair, ECSignature } from "./bitbox.js";
import { varBuf, reverseBuf } from './buffer.js';
import TransactionHelper from './TransactionHelper.js';
import type { ValidatedCommitment, Recipient } from "../types.js";

const  { 
  addOutput, 
  encodeOutputIndex, 
  encodeOutputValue, 
  parseKeyHashUnlockScript 
} = TransactionHelper

interface Outpoint {
  value: Uint8Array,
  locking_script: Uint8Array
}

function assembleSighashDigest(
  outputs:Outpoint[], 
  previousTransactionHash: Uint8Array, 
  previousTransactionOutputIndex: Uint8Array, 
  previousTransactionOutputValue: Uint8Array, 
  inputLockScript: Uint8Array
) {
  // Initialize an empty array of outpoints.
  let transactionOutpoints = [];

  // For each output in the current contract..
  for (const currentOutput in outputs) {
    // Add the output value.
    transactionOutpoints.push(outputs[currentOutput].value);

    // Add the output lockscript.
    transactionOutpoints.push(
      varBuf(outputs[currentOutput].locking_script)
    );
  }

  const emptyHash = "0000000000000000000000000000000000000000000000000000000000000000"
  const nVersion = Buffer.from("02000000", "hex");
  const hashPrevouts = Buffer.from(emptyHash, "hex");
  const hashSequence = Buffer.from(emptyHash, "hex");
  const outpoint = Buffer.concat([
    reverseBuf(previousTransactionHash),
    previousTransactionOutputIndex,
  ]);
  const scriptCode = Buffer.concat([
    Buffer.from("19", "hex"),
    inputLockScript,
  ]);
  const value = previousTransactionOutputValue;
  const nSequence = Buffer.from("FFFFFFFF", "hex");
  const hashOutputs = Crypto.hash256(
    Buffer.concat(transactionOutpoints)
  );
  const nLocktime = Buffer.from("00000000", "hex");
  const sighashType = Buffer.from("c1000000", "hex");

  // Debug output.
  // console.log([ nVersion, hashPrevouts, hashSequence, outpoint, scriptCode, value, nSequence, hashOutputs, nLocktime, sighashType ]);

  // TODO: Verify sighash type.
  const sighashMessage = Buffer.concat([
    nVersion,
    hashPrevouts,
    hashSequence,
    outpoint,
    scriptCode,
    value,
    nSequence,
    hashOutputs,
    nLocktime,
    sighashType,
  ]);
  const sighashDigest = Crypto.hash256(sighashMessage);

  //
  return sighashDigest;
}

export default function validCommitmentSignature(recipients:Recipient[], { txHash, lockingScript, unlockingScript, txIndex, satoshis }: ValidatedCommitment) {
  try {
    const outputs = recipients.map(({ address, satoshis }) => {
      return addOutput(satoshis, address)
    })

    const previousTransactionHash = Buffer.from(txHash, "hex");
    const previousLockScript = Buffer.from(lockingScript, "hex")
    const previousTransactionUnlockScript = Buffer.from(unlockingScript, "hex");
    const previousTransactionOutputIndex = encodeOutputIndex(txIndex);
    const previousTransactionOutputValue = encodeOutputValue(satoshis);
    const verificationParts = parseKeyHashUnlockScript(previousTransactionUnlockScript);

    // Validate commitment signature
    const verificationMessage = assembleSighashDigest(
      outputs,
      previousTransactionHash,
      previousTransactionOutputIndex,
      previousTransactionOutputValue,
      previousLockScript
    );
    
    const verificationKey = ECPair.fromPublicKey(verificationParts.publicKey);
    const verificationSignature = ECSignature.parseScriptSignature(verificationParts.signature).signature;
    const verificationStatus = ECPair.verify(verificationKey, verificationMessage, verificationSignature);

    return !!verificationStatus
  } catch (err) {
    return false;
  }
}
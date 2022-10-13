const { validateContribution } = require('@ipfs-flipstarter/utils/common');
const { getScriptHash } = require('@ipfs-flipstarter/utils/helpers');

/** @type {import('joi')} */
const Joi = require('../utils/joi');

const v1 = Joi.object({
  txHash: Joi.string().required(),
  txIndex: Joi.number().required(),
  unlockingScript: Joi.string().required(),
  seqNum: Joi.number().required(),
  recipients: Joi.array().items(
    Joi.object({
      address: Joi.string().required(),
      satoshis: Joi.number().required(),
    }).unknown(true)
  ).required(),

  alias: Joi.string().allow("").required(),
  comment: Joi.string().allow("").required(),
}).unknown(true);

const v2 = Joi.object({
  txHash: Joi.string().required(),
  txIndex: Joi.number().required(),
  unlockingScript: Joi.string().required(),
  seqNum: Joi.number().required(),
  recipients: Joi.array().items(
    Joi.object({
      address: Joi.string().required(),
      satoshis: Joi.number().required(),
    }).unknown(true)
  ).required(),

  applicationData: Joi.object().required().unknown(true),
  applicationDataSignature: Joi.string().required()
}).unknown(true);

const commitmentSchema = Joi.alternatives([v1, v2])

async function validateCommitment(blockchain, commitmentData) {
  const validation = commitmentSchema.validate(commitmentData);
  
  if (validation.error) {
    return { error: new Error("Invalid pledge data: " + validation.error) };
  }

  const transaction = await blockchain.getTransaction(commitmentData.txHash);

  /** @type {{value:number, script:Uint8Array}} */
  const vout = transaction.outs[commitmentData.txIndex];
  
  const commitment = {
    txHash: commitmentData.txHash,
    txIndex: commitmentData.txIndex,
    unlockingScript: commitmentData.unlockingScript,

    lockingScript: Buffer.from(vout.script).toString('hex'),
    scriptHash: getScriptHash(vout.script),
    satoshis: vout.value,
    seqNum: 0xffffffff,
  }

  const unspentUtxos = await blockchain.getUnspent(commitment.scriptHash);
  
  if (!unspentUtxos.find(utxo => utxo.txHash === commitment.txHash && utxo.txIndex === commitment.txIndex)) {
    return { error: new Error("Invalid pledge utxo") }
  }

  let recipients = commitmentData.recipients;

  if (!recipients && commitmentData.campaignId) {
    const [address, satoshis] = commitmentData.campaignId.split(/:/).filter(v => v !== "bitcoincash");
    recipients = [{ address, satoshis: Number(satoshis) }];
  }

  if (!recipients || ! await validateContribution(commitment, recipients)) {
    return { error: new Error("Invalid pledge signature") }
  }

  return { success: true }
}

module.exports = { commitmentSchema, validateCommitment }
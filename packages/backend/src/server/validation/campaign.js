const { validate:validateFlipstarterCampaignSite } = require('@ipfs-flipstarter/utils/ipfs');

const { CID } = require('multiformats/cid')
const { base32 } = require('multiformats/bases/base32');
const { base36 } = require('multiformats/bases/base36');
const { base58btc } = require('multiformats/bases/base58');
const bases = base32.decoder.or(base36.decoder).or(base58btc.decoder);

const all = require('it-all');
const {toString:uint8ArrayToString} = require("uint8arrays/to-string")

/** @type {import('joi')} */
const Joi = require('../utils/joi');

const campaignSchemaV1 = Joi.object({
  title: Joi.string().required(),
  image: Joi.string().optional(),
  starts: Joi.number().optional(),
  expires: Joi.number().optional(),
  recipients: Joi.array().items(
    Joi.object({
      address: Joi.string().required(),
      name: Joi.string().required(),
      satoshis: Joi.number().required(),
      url: Joi.string().allow("").optional(),
      image: Joi.string().allow("").optional(),
    }).unknown(true)
  ).required(),
  descriptions: Joi.object({
    en: Joi.object({
      abstract: Joi.string().allow(""),
      proposal: Joi.string().allow("")
    }),
    es: Joi.object({
      abstract: Joi.string().allow(""),
      proposal: Joi.string().allow("")
    }),
    zh: Joi.object({
      abstract: Joi.string().allow(""),
      proposal: Joi.string().allow("")
    }),
    ja: Joi.object({
      abstract: Joi.string().allow(""),
      proposal: Joi.string().allow("")
    })
  }).optional(),
  description: Joi.string().optional(),
  clientConfig: Joi.object({
    cid: Joi.cidAndPath().required(),
    //V1
    ipns: Joi.string().optional(),
    record: Joi.string().optional(),
    
    //V2
    dag: Joi.string().optional(),
    address: Joi.string().optional(),
    signature: Joi.string().optional(),
  }).required().unknown(true)
}).unknown(true)

/**
 * 
 * @param {import('ipfs').IPFS} ipfs 
 * @param {import('ipfs').CID} cid 
 * @returns 
 */
async function validateCampaign(ipfs, supportedClients, cid) {


  const campaignJsonRaw = await all(ipfs.cat(cid.toString() + "/campaign.json"));
  const campaignJsonString = uint8ArrayToString(Buffer.concat(campaignJsonRaw));
  const campaignData = await JSON.parse(campaignJsonString);
  const validationResult = campaignSchemaV1.validate(campaignData);

  if (validationResult.error) {
    return { error: validationResult.error }
  }

  if (supportedClients.indexOf(campaignData.clientConfig.ipns) === -1) {
    return { error: "Unsupported client in clientConfig" }
  }
  
  const ipnsValidationResult = await validateIpns(campaignData);

  if (ipnsValidationResult.error) {
    return { error: ipnsValidationResult.error }
  }

  //Fetch client used as template to compare this against
  /** @type {import('@ipld/dag-pb').PBNode} */
  const baseClientDag = (await ipfs.dag.get(CID.parse(campaignData.clientConfig.cid))).value;
  const dagValidationResult = await validateFlipstarterCampaignSite(ipfs, baseClientDag, campaignData, cid);
  
  if (dagValidationResult.error) {
    return { error: dagValidationResult.error }
  }

  return { success: !!dagValidationResult.success }
}

async function validateIpns(campaignData) {

  //Validate the record to the ipns id passed in (or matching supportedClient)
  try { 
    const { unmarshal:ipnsRecordToEntry } = await import('ipns');
    const { ipnsEntryDataForV2Sig } = await import('../../../node_modules/ipns/dist/src/utils.js');
    const { unmarshalPublicKey } = await import('@libp2p/crypto/keys');

    const { peerIdFromString } = await import('@libp2p/peer-id');
  
    const ipnsKey = CID.parse(campaignData.clientConfig.ipns, bases);
    const peerId = peerIdFromString(ipnsKey.toString(base36));
    const record = Buffer.from(campaignData.clientConfig.record, "base64");
    const entry = ipnsRecordToEntry(record);
    
    entry.validityType = null;
    const pubKey = unmarshalPublicKey(entry.pubKey || peerId.publicKey);
    const dataForSignature = ipnsEntryDataForV2Sig(entry.data);

    let isValid
    try {
      isValid = await pubKey.verify(dataForSignature, entry.signatureV2)
    } catch (err) {
      isValid = false
    }

    if (!isValid) return { error: "Invalid record signature" }

    let recordValue = uint8ArrayToString(entry.value).replace(/\/ipfs\//, '');
    
    if (CID.parse(recordValue, bases).toString(base58btc) !== CID.parse(campaignData.clientConfig.cid).toString(base58btc)) {
      return { error: `Invalid record in clientConfig. Record value does not match clientConfig client. Expected ${campaignData.clientConfig.cid}, Got ${recordValue}`}
    }
    
    return true;
    
  } catch (error) { 
    
    return { error }
  }
  
}

module.exports = { campaignSchema: campaignSchemaV1, validateCampaign }

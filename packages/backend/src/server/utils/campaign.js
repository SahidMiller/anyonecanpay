/** @type {import('joi')} */
const Joi = require('../utils/joi');

const schema = Joi.object({
  title: Joi.string(),
  starts: Joi.number(),
  expires: Joi.number(),
  peerAddresses: Joi.array().items(Joi.string()),
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
  }).required(),
}).unknown(true)

module.exports = { schema }
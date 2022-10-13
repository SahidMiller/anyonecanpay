const Boom = require('@hapi/boom');
const map = require('it-map');
const { pipe } = require('it-pipe');

/** @type {import('joi')} */
const Joi = require('../utils/joi');
const streamResponse = require('../utils/stream-response');
const { validateCampaign } = require('../validation/campaign');
const { validateCommitment } = require('../validation/commitment');

const { toString:uint8ArrayToString } = require('uint8arrays/to-string');
const { UnixFS } = require('ipfs-unixfs')

module.exports = {
  options: {
    validate: {
      failAction: (req, h, err) => {
        //Show validation error to user
        throw err;
      },
      options: {
        allowUnknown: true,
        stripUnknown: true
      },
      query: Joi.object({
        arg: Joi.cidAndPath().required(),
        timeout: Joi.timeout()
      }),
    },
    cors: true
  },
  method: 'POST',
  path: '/api/v0/refs',
  handler: async function (request, h, response) {

    const signal = request.app.signal;
    
    /** @type {import('ipfs').IPFS} */
    const ipfs = request.server.app.ipfs;
    
    /** @type {import('ipfs').CID} */
    const cid = request.query.arg && request.query.arg.cid;
    const blockchain = request.server.app.blockchain

    const supportedClients = request.server.app.supportedClients;

    try {
      const dagNode = await ipfs.dag.get(cid);
      
      /** @type {import('@ipld/dag-pb').PBNode} */
      const dagPbNode = dagNode?.value;

      if (!dagPbNode) throw new Error("CID not found");

      let result;
      if (dagPbNode.Links?.length === 0) {
        const commitmentFile = UnixFS.unmarshal(dagPbNode.Data);
        const commitmentData = commitmentFile?.data && JSON.parse(uint8ArrayToString(commitmentFile.data));
        result = await validateCommitment(blockchain, commitmentData);

      } else {
        result = await validateCampaign(ipfs, supportedClients, cid);
      }

      if (result.error) throw result.error

    } catch (err) {
      const message = typeof err === 'string' ? err : err.message;
      throw Boom.badRequest("Error valiating cid: " + message);
    }

    try {
      
      const result = await streamResponse(response, h, () => pipe(
        ipfs.refs(cid, {
          recursive: true,
          signal
        }), 
        async function * (source) {
          yield * map(source, ({ ref, err }) => ({ Ref: ref, Err: err || "" }))
        }
      ));
      
      return result;

    } catch (err) {

      throw Boom.badRequest("Error fetching cid: " + message);
    }
  }
}
const multipartRequestParser = require('../utils/multipart-request-parser.js');
const Joi = require('../utils/joi');
const Boom = require('@hapi/boom');
const streamResponse = require('../utils/stream-response');
const merge = require('it-merge');
const map = require('it-map');
const { PassThrough } = require('stream');
const { commitmentSchema } = require('../validation/commitment');
const { campaignSchema } = require('../validation/campaign');
const allowSchemas = Joi.alternatives([commitmentSchema, campaignSchema])
const { decode:decodeDagPb } = require("@ipld/dag-pb");

const { verifyMessage } = require("@ipfs-flipstarter/utils/helpers")
const { create } = require("@ipfs-flipstarter/utils/ipfs")
const { concat:uint8ArrayConcat } = require('uint8arrays/concat')
const { toString:uint8ArrayToString } = require('uint8arrays/to-string');

/**
 * @param {AsyncIterable<Uint8Array>} stream
 */
 const collect = async (stream) => {
  const buffers = []
  let size = 0

  for await (const buf of stream) {
    size += buf.length
    buffers.push(buf)
  }

  return uint8ArrayConcat(buffers, size)
}

module.exports = {
  method: 'POST',
  path: '/api/v0/add',
  options: {
    payload: {
      parse: false,
      output: 'stream',
      maxBytes: Number.MAX_SAFE_INTEGER
    },
    validate: {
      failAction: (req, h, err) => {
        //Show validation error to user
        throw err;
      },
      options: {
        allowUnknown: true,
        stripUnknown: false
      },
      query: Joi.object()
        .keys({
          cidVersion: Joi.number().integer().min(0).max(1),
          hashAlg: Joi.string(),
          cidBase: Joi.string().default('base58btc'),
          rawLeaves: Joi.boolean(),
          onlyHash: Joi.boolean(),
          pin: Joi.boolean(),
          wrapWithDirectory: Joi.boolean(),
          fileImportConcurrency: Joi.number().integer().min(0),
          blockWriteConcurrency: Joi.number().integer().min(0),
          shardSplitThreshold: Joi.number().integer().min(0),
          chunker: Joi.string(),
          trickle: Joi.boolean(),
          preload: Joi.boolean(),
          progress: Joi.boolean()
        })
        .rename('cid-version', 'cidVersion', {
          override: true,
          ignoreUndefined: true
        })
        .rename('cid-base', 'cidBase', {
          override: true,
          ignoreUndefined: true
        })
        .rename('hash', 'hashAlg', {
          override: true,
          ignoreUndefined: true
        })
        .rename('raw-leaves', 'rawLeaves', {
          override: true,
          ignoreUndefined: true
        })
        .rename('only-hash', 'onlyHash', {
          override: true,
          ignoreUndefined: true
        })
        .rename('wrap-with-directory', 'wrapWithDirectory', {
          override: true,
          ignoreUndefined: true
        })
        .rename('file-import-concurrency', 'fileImportConcurrency', {
          override: true,
          ignoreUndefined: true
        })
        .rename('block-write-concurrency', 'blockWriteConcurrency', {
          override: true,
          ignoreUndefined: true
        })
        .rename('shard-split-threshold', 'shardSplitThreshold', {
          override: true,
          ignoreUndefined: true
        })
    },
    cors: true
  },
  /**
   * @param {import('../../types').Request} request
   * @param {import('@hapi/hapi').ResponseToolkit} h
   */
  async handler (request, h) {
    if (!request.payload) {
      throw Boom.badRequest('Array, Buffer, or String is required.')
    }
    
    const {
      app: {
        signal
      },
      server: {
        app: {
          ipfs,
          supportedClients
        }
      },
      query: {
        cidVersion,
        cidBase,
        rawLeaves,
        progress,
        onlyHash,
        hashAlg,
        wrapWithDirectory,
        pin,
        chunker,
        trickle,
        preload,
        shardSplitThreshold,
        blockWriteConcurrency,
        timeout
      }
    } = request

    let filesParsed = false

    const { pipe } = (await import('it-pipe'));

    return streamResponse(request, h, () => pipe(
      multipartRequestParser(request.raw.req),
      /**
       * @param {AsyncIterable<import('../../types').MultipartEntry>} source
       */
      async function * (source) {

        for await (const entry of source) {

          let contentBytes
          let type

          try {

            contentBytes = await collect(entry.content);
            
            const data = JSON.parse(uint8ArrayToString(contentBytes));
            const dataSchemaValidation = allowSchemas.validate(data);

            if (dataSchemaValidation.error) {
              throw dataSchemaValidation.error;
            }
            
            if (!campaignSchema.validate(data).error) {
              //Validate campaign appropriately
              const { cid, dag, signature, address, ipns, record } = data.clientConfig;
              if (dag && signature && address) {
                //Validate v2 campaign
                if (!verifyMessage(address, signature, dag)) {
                  throw new Error("Invalid campaign signature");
                }

                if (supportedClients.indexOf(address) === -1) {
                  throw new Error("Unsupported campaign address", address);
                }

                const decodedDag = decodeDagPb(Buffer.from(dag, "hex"));
                const finalCid = await create(ipfs, decodedDag, data);
                console.log(finalCid);
                type = "campaignV2"
              } else if (cid && ipns && record) {
                debugger;
                type = "campaignV1";
              } else {

                throw new Error("Invalid campaign data");
              }
              
            }

            if (!commitmentSchema.validate(data).error) {
              //Validate commitment appropriately
              debugger;
              type = "commitmentV2"
            }

          } catch (err) {
            throw Boom.badRequest(err);
          }

          //Allow adding the file (we can do this ourselves generally)
          if (entry.type === 'file') {
            filesParsed = true

            yield {
              path: entry.name,
              content: contentBytes,
              mode: entry.mode,
              mtime: entry.mtime,
              type
            }
          }
        }
      },
      /**
       * @param {import('ipfs-core-types/src/utils').ImportCandidateStream} source
       */
      async function * (source) {
        const progressStream = new PassThrough({
          objectMode: true
        })

        yield * merge(
          progressStream,
          pipe(
            ipfs.addAll(source, {
              cidVersion,
              rawLeaves,
              progress: progress
                ? (bytes, path) => {
                    progressStream.write({
                      Name: path,
                      Bytes: bytes
                    })
                  }
                : () => {},
              onlyHash,
              hashAlg,
              wrapWithDirectory,
              pin,
              chunker,
              trickle,
              preload,
              shardSplitThreshold,

              // this has to be hardcoded to 1 because we can only read one file
              // at a time from a http request and we have to consume it completely
              // before we can read the next file
              fileImportConcurrency: 1,
              blockWriteConcurrency,
              signal,
              timeout
            }),
            async function * (source) {
              const base = await ipfs.bases.getBase(cidBase)

              yield * map(source, file => {
                return {
                  Name: file.path,
                  Hash: file.cid.toString(base.encoder),
                  Size: file.size,
                  Mode: file.mode === undefined ? undefined : file.mode.toString(8).padStart(4, '0'),
                  Mtime: file.mtime ? file.mtime.secs : undefined,
                  MtimeNsecs: file.mtime ? file.mtime.nsecs : undefined
                }
              })

              // no more files, end the progress stream
              progressStream.end()
            }
          )
        )
      }
    ), {
      onEnd () {
        if (!filesParsed) {
          throw Boom.badRequest("File argument 'data' is required.")
        }
      }
    })
  }
}
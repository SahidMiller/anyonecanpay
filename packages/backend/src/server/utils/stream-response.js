
const { PassThrough } = require('stream')
const debug = require('debug')
// @ts-expect-error no types
const toIterable = require('stream-to-it')

const log = debug('ipfs:http-api:utils:stream-response')
const ERROR_TRAILER = 'X-Stream-Error'

/**
 *
 * @param {import('../types').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @param {() => AsyncIterable<any>} getSource
 * @param {{ onError?: (error: Error) => void, onEnd?: () => void }} [options]
 */
module.exports = async function streamResponse (request, h, getSource, options = {}) {
  // eslint-disable-next-line no-async-promise-executor
  const stream = await new Promise(async (resolve, reject) => {
    let started = false
    const stream = new PassThrough()
    const { pipe } = (await import('it-pipe'));

    try {
      await pipe(
        (async function * () {
          try {
            for await (const chunk of getSource()) {
              if (!started) {
                started = true
                resolve(stream)
              }

              if (chunk instanceof Uint8Array || typeof chunk === 'string') {
                yield chunk
              } else {
                yield JSON.stringify(chunk) + '\n'
              }
            }

            if (options.onEnd) {
              options.onEnd()
            }

            if (!started) { // Maybe it was an empty source?
              started = true
              resolve(stream)
            }
          } catch (/** @type {any} */ err) {
            log(err)

            if (options.onError) {
              options.onError(err)
            }

            if (request.raw.res.headersSent) {
              request.raw.res.addTrailers({
                [ERROR_TRAILER]: JSON.stringify({
                  Message: err.message,
                  Code: 0
                })
              })
            }

            throw err
          }
        })(),
        toIterable.sink(stream)
      )
    } catch (/** @type {any} */ err) {
      reject(err)
    }
  })

  return h.response(stream)
    .header('X-Chunked-Output', '1')
    .header('Content-Type', 'application/json')
    .header('Trailer', ERROR_TRAILER)
}
const parser = require('./parser');
const errCode = require('err-code');

/**
 * @param {string[]} command
 * @param {import('yargs').MiddlewareFunction} ctxMiddleware
 */
module.exports = function cli (command, ctxMiddleware) {
  // Apply command aliasing (eg `refs local` -> `refs-local`)
  
  return new Promise(async (resolve, reject) => {
    try {
      const argv = await parser
        .middleware(ctxMiddleware)
        .fail((msg, err, yargs) => {
          // Handle yargs errors
          if (msg) {
            // if the error was caused by an unknown command, the use of `.parse(command)`
            // below causes printing help to fail: https://github.com/yargs/yargs/issues/1419#issuecomment-527234789
            // so pass the unadulterated parser in as `yargs` in order to print help successfully
            if (msg.includes('Unknown argument') || msg.includes('Please specify a command')) {
              yargs = parser
            }

            return reject(errCode(new Error(msg), 'ERR_YARGS', { yargs }))
          }

          reject(err)
        }).parse(command)

      resolve(argv);
    } catch (/** @type {any} */ err) {
      return reject(err)
    }
  })
}
#! /usr/bin/env node
const { debug } = require('debug');
const { print, getBackend, getRepoPath } = require( './src/cli/utils');
const cli = require('./src/cli/index.js');

/**
* @param {any} err
* @param {string} origin
*/
const onUncaughtException = (err, origin) => {
  if (!origin || origin === 'uncaughtException') {
    console.error(err)
    process.exit(1)
  }
}

/**
* Handle any uncaught errors
*
* @param {any} err
*/
const onUnhandledRejection = (err) => {
  console.error(err)
  process.exit(1)
}

process.once('uncaughtException', onUncaughtException)
process.once('unhandledRejection', onUnhandledRejection)

if (process.env.DEBUG) {
  process.on('warning', err => {
    console.error(err.stack)
  })
}

const log = debug('@ipfs-flipstarter/backend:cli');

process.title = "@ipfs-flipstarter/backend"

/**
* @param {string[]} argv
*/
async function main (argv) {

  let exitCode = 0
  let ctx = {
    print,
    getStdin: () => process.stdin,
    repoPath: getRepoPath(),
    cleanup: () => {},
    isDaemon: false,
    backend: undefined
  }

  const command = argv.slice(2)

  try {
    
    const ctxMiddleware = async (argv) => {
      
      if (!['daemon', 'init'].includes(command[0])) {
        // @ts-ignore argv as no properties in common
        const { backend, isDaemon, cleanup } = await getBackend(argv)

        ctx = {
          ...ctx,
          backend,
          isDaemon,
          cleanup
        }
      }

      argv.ctx = ctx

      return argv
    }

    await cli(command, ctxMiddleware);

  } catch (/** @type {any} */ err) {
    // TODO: export errors from ipfs-repo to use .code constants
    if (err.code === 'ERR_INVALID_REPO_VERSION') {
      err.message = 'Incompatible repo version. Migration needed. Pass --migrate for automatic migration'
    }

    if (err.code === 'ERR_NOT_ENABLED') {
      err.message = `no IPFS repo found in ${ctx.repoPath}.\nplease run: 'ipfs init'`
    }

    // Handle yargs errors
    if (err.code === 'ERR_YARGS') {
      err.yargs.showHelp()
      ctx.print.error('\n')
      ctx.print.error(`Error: ${err.message}`)
    } else if (log.enabled) {
      // Handle commands handler errors
      log(err)
    } else {
      !err.yargs || argv.verbose ? console.log(err) : ctx.print.error(err.message);
    }

    exitCode = 1
  } finally {
    await ctx.cleanup()
  }

  if (command[0] === 'daemon') {
    // don't shut down the daemon process
    return
  }

  process.exit(exitCode)
}

main(process.argv)
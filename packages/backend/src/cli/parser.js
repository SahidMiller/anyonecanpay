const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const commands = require('./commands');

module.exports = yargs(hideBin(process.argv))
.option('verbose', {
  alias: 'v',
  type: 'boolean',
  description: 'Run with verbose logging'
})
.option('pass', {
  desc: 'Pass phrase for the keys',
  type: 'string',
  default: ''
})
.option('migrate', {
  desc: 'Enable/disable automatic repo migrations',
  type: 'boolean',
  default: false
})
.options('api', {
  desc: 'Remote API multiaddr to use',
  type: 'string'
})
.demandCommand(1, 'Please specify a command')
.showHelpOnFail(false)
.command(commands)
.help()
.strict()
.completion()
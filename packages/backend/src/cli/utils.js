const fs = require('fs');
const os = require('os');
const path = require('path');
const CID = require('ipfs').CID;

const { debug } = require('debug');
const log = debug('@ipfs-flipstarter/backend:cli-utils');

const getRepoPath = () => {
  return process.env.FLIPSTARTER_PATH || path.join(os.homedir(), '/.flipstarters');
}

const isDaemonOn = () => {
  try {
    fs.readFileSync(path.join(getRepoPath(), 'api'))
    log('daemon is on')
    return true
  } catch (/** @type {any} */ err) {
    log('daemon is off')
    return false
  }
}


let visible = true
function disablePrinting() { visible = false }

/**
 * @type {import('./types').Print}
 */
function print(msg, includeNewline = true, isError = false) {
  if (visible) {
    if (msg === undefined) {
      msg = ''
    }
    msg = msg.toString()
    msg = includeNewline ? msg + '\n' : msg
    const outStream = isError ? process.stderr : process.stdout

    outStream.write(msg)
  }
}

print.clearLine = () => {
  return process.stdout.clearLine(0)
}

/**
 * @param {number} pos
 */
print.cursorTo = (pos) => {
  process.stdout.cursorTo(pos)
}

/**
 * Write data directly to stdout
 *
 * @param {string|Uint8Array} data
 */
print.write = (data) => {
  process.stdout.write(data)
}

/**
 * Print an error message
 *
 * @param {string} msg
 * @param {boolean} [newline=true]
 */
print.error = (msg, newline = true) => {
  print(msg, newline, true)
}

// used by ipfs.add to interrupt the progress bar
print.isTTY = process.stdout.isTTY
print.columns = process.stdout.columns

function parseCid(data) {
  const cid = CID.asCID(data);
  if (cid) return cid;

  try { return CID.parse(data); } catch (err) { }
  try { return CID.decode(data).asCID } catch (err) {}
}

module.exports = {
  getRepoPath,
  isDaemonOn,
  print,
  disablePrinting,
  parseCid
}
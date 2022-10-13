const { expect } = require('chai')
const { CID } = require('multiformats/cid')
const { base58btc } = require('multiformats/bases/base58')
const sinon = require('sinon')

const tap = require('tap')
const testHttpMethod = require('../../test-utils/test-http-method.js')
const http = require('../../test-utils/http.js')
const matchIterable = require('../../test-utils/match-iterable.js')
const drain = require('it-drain');
const { Blockchain } = require('@ipfs-flipstarter/utils/network/Blockchain')

const ipfs = {
  addAll: sinon.stub(),
  bases: {
    getBase: sinon.stub()
  }
}

const blockchain = {
  getTransaction: sinon.stub(),
  getUnspent: sinon.stub(),
}

const supportedClients = ["QmUBdnXXPyoDFXj3Hj39dNJ5VkN3QFRskXxcGaYFBB8CNR"];

tap.afterEach(() => {
  sinon.restore();
});

tap.test('only accepts POST', async () => {
  await testHttpMethod('/api/v0/add', { ipfs, blockchain, supportedClients });
});

tap.test('should show query validation error', async () => {
  const cid = CID.parse('QmUBdnXXPyoDFXj3Hj39dNJ5VkN3QFRskXxcGaYFBB8CNR')
  const txHash = "01f22a281c07fd31146b45e200375bed7997d53efe582693d01e10a9a2f031e0";
  
  //const address = "bitcoincash:qrj780mrzrp77kl5xz4xudd4xtee95kvnggfkexdwd"
  const inputScript = "76a914e5e3bf6310c3ef5bf430aa6e35b532f392d2cc9a88ac"

  const expectedResult = {
    path: cid.toString(),
    cid,
    size: 1024,
    mode: 0o420,
    mtime: {
      secs: 100,
      nsecs: 0
    }
  }

  ipfs.addAll.withArgs(matchIterable(), sinon.match.object).callsFake(async function * (source) {
    await drain(source);
    yield expectedResult
  });

  ipfs.bases.getBase.withArgs('base58btc').returns(base58btc)

  blockchain.getTransaction.withArgs(txHash).resolves({
    outs: [{
      script: Buffer.from(inputScript, "hex"),
      value: 2000
    }]
  });
  
  blockchain.getUnspent.withArgs(Blockchain.getScriptHash(Buffer.from(inputScript, "hex"))).resolves([
    { txHash: txHash, txIndex: 0 }
  ]);

  const res = await http({
    method: 'POST',
    url: `/api/v0/add`,
    headers: {
      'Content-Type': 'multipart/form-data; boundary=----------287032381131322'
    },
    payload: Buffer.from([
      '',
      '------------287032381131322',
      'Content-Disposition: form-data; name="test"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      Buffer.from(JSON.stringify({
        txHash: txHash,
        txIndex: 0,
        unlockingScript: "483045022100ac7b1261801a1102c1e4d84e04c909ea85a9759ef0cb59d15cacb73ac3bde39a022004c94700ff381525ce39bf60db4aad21c9152cc9f1d765f1d0ecbecfefa6990fc12103d251032d6c0aa25ceb6420f04233e450b55904d7837b45291a02e86d4b997f91",
        seqNum: 0xffffffff,
        alias: "",
        comment: "",

        recipients: [{ address: "bitcoincash:qz9fchn29yqw077ndyz37ghwc6v82vy44qf5wyulaz", satoshis: 1000 }]
      })),
      '------------287032381131322--'
    ].join('\r\n'))

  }, { ipfs, blockchain, supportedClients })

  expect(res).to.be.an('object')
  expect(res.result).to.be.equal(JSON.stringify({
    Name: cid.toString(),
    Hash: cid.toString(),
    Size: expectedResult.size,
    Mode: expectedResult.mode.toString(8).padStart(4, '0'),
    Mtime: expectedResult.mtime.secs,
    MtimeNsecs: expectedResult.mtime.nsecs
  }) + "\n");
  expect(res.statusCode).to.be.equal(200);
});
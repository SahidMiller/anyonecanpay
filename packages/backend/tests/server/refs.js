const { expect } = require('chai')
const { CID } = require('multiformats/cid')
const sinon = require('sinon')

const tap = require('tap')
const testHttpMethod = require('../../test-utils/test-http-method.js')
const http = require('../../test-utils/http.js')

const ipfs = {
  add: sinon.stub(),
  cat: sinon.stub(),
  get: sinon.stub(),
  dag: {
    get: sinon.stub(),
    put: sinon.stub(),
  },
  refs: sinon.stub(),
  hashers: {
    getHasher: sinon.stub()
  }
};

const blockchain = {};

const supportedClients = ["k51qzi5uqu5djrim5s9504kowmxmgexhf03sgdgqkefn0afou0kj1gdhz8ncjw"];

tap.afterEach(() => {
  sinon.restore();
});

tap.test('only accepts POST', async (tap) => {
  await testHttpMethod('/api/v0/refs', { ipfs, blockchain, supportedClients });
});

tap.test('should show query validation error', async () => {

  const res = await http({
    method: 'POST',
    url: `/api/v0/refs`
  }, { ipfs, blockchain, supportedClients })
  
  expect(res).to.be.an('object')
  expect(res.result).to.have.property('error', 'Bad Request');
  expect(res.result).to.have.property('message', '"arg" is required');
  expect(res.statusCode).to.be.equal(400);
});

tap.test('should list refs', async () => {
  debugger;

  const defaultOptions = {
    recursive: false,
    edges: false,
    unique: false,
    maxDepth: undefined,
    format: undefined,
    signal: sinon.match.instanceOf(AbortSignal),
    timeout: undefined
  }

  const cid = CID.parse('QmPb95jWqBd7RAsXZQKdY3DxKTHPweAp3q6QDcYpxDi7kF')
  const baseClientCid = "QmSgAd1qJYHJYa7i6dXnt4ebBRznwKKdEQDYaU9hxpUeyr";

  ipfs.refs.withArgs([`${cid}`], defaultOptions).returns([{
    ref: cid.toString()
  }]);

  const campaignJsonHash = "QmUBdnXXPyoDFXj3Hj39dNJ5VkN3QFRskXxcGaYFBB8CNS";

  //Return an iterable/source to collect
  const expectedCampaignJson = JSON.stringify({
    title: "Test",
    starts: 1646197200,
    expires: 1677733200,
    recipients: [{
      address: "bitcoincash:qrm6930uq7ezzymcvz7yvw5e02066d2gryt0nrlz8e",
      name: "Test",
      satoshis: 2000,
      url: "",
      image: "",
    }],
    descriptions: {
      "en": { abstract: "", proposal: "" },
      "es": { abstract: "", proposal: "" },
      "zh": { abstract: "", proposal: "" },
      "ja": { abstract: "", proposal: "" },
    },
    clientConfig: {
      client: baseClientCid,
      ipns: "k51qzi5uqu5djrim5s9504kowmxmgexhf03sgdgqkefn0afou0kj1gdhz8ncjw",
      record: "CjQvaXBmcy9RbVNnQWQxcUpZSEpZYTdpNmRYbnQ0ZWJCUnpud0tLZEVRRFlhVTloeHBVZXlyEkAqdLR1auPWlPK/gPV4OTs6uBLu0Ab3NxV42StZhPnOXNaL4NHWQJ7LuSMtT9bT63kIXWHQSE4/WKzdAOs8B20AGAAiHjIwMjItMDYtMDVUMTI6MTA6MTYuNDM5MDQxMDU3WigAMABCQDb48jZsMLZnYP/QBPu3tlPWGw8FPDtYrIxKwLVZUA8vwtdUVcjdxJYX6huVuaI7BVLZWHM6ei+UJU3KEePD+ANKgwGlY1RUTABlVmFsdWVYNC9pcGZzL1FtU2dBZDFxSllISllhN2k2ZFhudDRlYkJSem53S0tkRVFEWWFVOWh4cFVleXJoU2VxdWVuY2UAaFZhbGlkaXR5WB4yMDIyLTA2LTA1VDEyOjEwOjE2LjQzOTA0MTA1N1psVmFsaWRpdHlUeXBlAA=="
    }
  });

  ipfs.cat.withArgs(cid.toString() + "/campaign.json").returns((async function * () {
    yield Buffer.from(expectedCampaignJson);
  })());

  ipfs.dag.get.withArgs(CID.parse(baseClientCid)).resolves({
    value: {
      Links: [
        {
          Hash: "QmUBdnXXPyoDFXj3Hj39dNJ5VkN3QFRskXxcGaYFBB8CNR",
          Name: "index.html"
        }, {
          Hash: "QmUBdnXXPyoDFXj3Hj39dNJ5VkN3QFRskXxcGaYFBB8CNS",
          Name: "logo.ico"
        }, {
          Hash: "QmUBdnXXPyoDFXj3Hj39dNJ5VkN3QFRskXxcGaYFBB8CNT",
          Name: "static"
        }, 
      ]
    }
  });

  ipfs.add.withArgs(expectedCampaignJson, { onlyHash: true }).resolves({
    cid: campaignJsonHash,
    size: 300
  });
  
  ipfs.refs.withArgs(cid, { recursive: true }).returns(async function * () {
    yield { ref: cid.toString() }
  }());
  
  const { sha256 } = await import('multiformats/hashes/sha2')
  ipfs.hashers.getHasher.withArgs("sha2-256").resolves(sha256)

  const res = await http({
    method: 'POST',
    url: `/api/v0/refs?arg=${cid}`
  }, { ipfs, blockchain, supportedClients })
  
  expect(res).to.be.an('object')
  expect(res.result).not.to.have.property('error');
  expect(res.statusCode).to.be.equal(200);
  expect(JSON.parse(res.result)).to.have.property('Ref', cid.toString())
});
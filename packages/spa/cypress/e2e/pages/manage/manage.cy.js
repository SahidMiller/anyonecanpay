

import moment from "moment";

import { SATS_PER_BCH } from "../../../../src/utils/bitcoinCashUtilities.js"
import { createNode } from '@ipld/dag-pb'
const allContributionsQueryKey =  ['contributions']

import { set } from "idb-keyval"
import { campaignStore } from "../../../../src/utils/campaignStore.js"
import { manageStore } from "../../../../src/utils/manageStore.js"

const v0CampaignSchemaId = "bafybeideujl7mog7rkohqvl24jcmsthk4g5aczyb6cbapgbgolwmp42evm";
const v0CampaignSchema ={
  "campaign": {
    "slug":"test",
    "title":"Test",
    "starts":1652241600,
    "expires":1652328000,
    "recipients":[{
      "name":"Test",
      "url":"",
      "image":"",
      "address":"bitcoincash:qr9f5gflevlvt94etdh2rp078uefegtjkyahxkrpgh",
      "signature":null,
      "satoshis":1000
    }],
    "contributions":[],
    "fullfilled":false,
    "fullfillmentTx":null,
    "fullfillmentTimestamp":null,
    "descriptions":{
      "en":{
        "abstract":"Test",
        "proposal":"Test"
      },
      "es":{
        "abstract":"",
        "proposal":""
      },
      "zh":{
        "abstract":"",
        "proposal":""
      },
      "ja":{
        "abstract":"",
        "proposal":""
      }
    },
    "apiType":"electrum"
  },
  "config":{
    "defaultGatewayUrl":"http://localhost:8080",
    "preloadNodes":[]
  }
};

const campaignJson = { 
  clientConfig:{
    cid: "QmNiTo1swbjxATW4LP1hNfFBWP5UcdBoJgWGVXvU9JZW5q",
    ipns: "k51qzi5uqu5djrim5s9504kowmxmgexhf03sgdgqkefn0afou0kj1gdhz8ncjw",
    record: "CjQvaXBmcy9RbU5pVG8xc3dianhBVFc0TFAxaE5mRkJXUDVVY2RCb0pnV0dWWHZVOUpaVzVxEkCWBIZiYf77L3//1iFgvcjKaRLEurCegDPHltwbCcOPTa4/Qx/xyi0RnS1H4i5T3QFifoR6SbLWqKOcF/WrfhILGAAiHTIwMjItMDgtMTFUMTA6MjY6MjIuNDQ4Njk0NDdaKAUwAEJAhMV3AGmkrJW/Oyjm6E5uDDOJYEd0hg0SVWtAfg5MShR0MRxIJZC0T5nIigj9eHZWoi9UiGfMhX+DfepUmg9nCUqCAaVjVFRMAGVWYWx1ZVg0L2lwZnMvUW1OaVRvMXN3Ymp4QVRXNExQMWhOZkZCV1A1VWNkQm9KZ1dHVlh2VTlKWlc1cWhTZXF1ZW5jZQVoVmFsaWRpdHlYHTIwMjItMDgtMTFUMTA6MjY6MjIuNDQ4Njk0NDdabFZhbGlkaXR5VHlwZQA=",
  },
  defaultGatewayUrl: "https://flipstarter.me",
  description: "Test",
  download: "blob:http://localhost:8081/18a9ab81-1f28-4001-bc37-f0d6c9490cdc",
  expires: 1641167999,
  hash: "bafybeihgo7douuwlt2xrox7z64xl4iyl3u7pwpgdjvgah7bolsaxa3txfy",
  id: "bafybeihgo7douuwlt2xrox7z64xl4iyl3u7pwpgdjvgah7bolsaxa3txfy",
  image: "https://navbar.cloud.bitcoin.com/images/logo_black.png",
  recipients: [{
    address: "bitcoincash:qqflp5r0tr8l29y6h5vknpvhuf6hnyy4uuv43aphgu",
    name: "Test",
    satoshis: 12000000000,
  }],
  successfulPreloadNodeIndexes: undefined,
  title: "Interplanetary Flipstarter",
  url: "https://flipstarter.me/ipfs/bafybeihgo7douuwlt2xrox7z64xl4iyl3u7pwpgdjvgah7bolsaxa3txfy",
}

const goalInBch = campaignJson.recipients[0].satoshis / SATS_PER_BCH;

describe('managing campaigns', () => {
  let ipfs, electrum;
  
  window.ipfs = ipfs = {}
  window.electrum = electrum = {};
  
  beforeEach(() => {
    window.ipfs = ipfs = {};
    window.electrum = electrum = {};
    
    localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE')
    set("random-parent-id", { id: "random-parent-id", versions: [{ id: campaignJson.id, created: moment().unix() }]}, manageStore);
    set(campaignJson.id, campaignJson, campaignStore);
    set(v0CampaignSchemaId, v0CampaignSchema, campaignStore);

    cy.visit("#/manage", {
      async onBeforeLoad(win) {
        win.ipfs = ipfs = {};
        win.electrum = electrum = {};
    
        cy.spy(win.console, "log");

        /** @type {.PBNode} */
        const baseClientDag = createNode();
        
        ipfs.ready = cy.stub().resolves();
        ipfs.dag = {
          get: cy.stub().resolves({ value: baseClientDag }),
          import: cy.stub(),
          export: cy.stub().returns(async function * () {
          }()),
          put: cy.stub().resolves("bafybeihgo7douuwlt2xrox7z64xl4iyl3u7pwpgdjvgah7bolsaxa3txfy"),
        }
        ipfs.add = cy.stub().resolves({ size: 100, cid: "bafybeihgo7douuwlt2xrox7z64xl4iyl3u7pwpgdjvgah7bolsaxa3txfy"});
        ipfs.connectToPreloadNodes = cy.stub();
        ipfs.requestPreloading = cy.stub();

        electrum.ready = cy.stub().resolves();
        electrum.request = cy.stub().resolves();

        electrum.request.withArgs("blockchain.scripthash.get_history").resolves([]);
        electrum.request.withArgs("blockchain.scripthash.get_history", "c425533e4148565c472e574a1437d9790e7818ac0a0793ae4072d6379d044337")
          .resolves([]);
        
        electrum.request.withArgs("blockchain.scripthash.listunspent").resolves([]);
      }
    });
    
    cy.finishedLoading();
  });

  afterEach(() => {
    cy.clearState();
  });

  it('can load and display a campaign from local storage', () => {
    cy.wait(5000);

    cy.get('.campaign-card').should('have.length', 1);
    cy.get('.campaign-card').contains(campaignJson.title);

    cy.get('.campaign-card').contains("0 Pledges").then(() => {

      electrum.request.withArgs("blockchain.scripthash.get_history", "c425533e4148565c472e574a1437d9790e7818ac0a0793ae4072d6379d044337")
        .resolves([{ tx_hash: 'faketxid', height: 1 }]);

      electrum.request.withArgs("blockchain.transaction.get", "faketxid")
        .resolves("02000000019831c98fc98e4bc7a0db2435da93c2ce54c15a97e8c262d73508e55d238e2909010000006441eef4b036e37fa3b99cba4e97b440baac52d8703d404dc1e6629b1e0727b994e1563f4214ec7d34006ee93f37dae6ecaf6b05ec33a37c293901f782f064ad569b412102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31bffffffff0222020000000000001976a91413f0d06f58cff5149abd19698597e275799095e788ac0000000000000000b76a4cb409298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc9319800000000ffffffff0000000000000000000000000000000000000000000000000000000000000000000047304402204006d34e7eed6b020a4067ce667aef82fa06219bce5e2bc3553ed7dffb1eed310220110ee324110a51e5e62b0f48c90fae08de5fd28634184b094005f1884632cb83c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b00000000");
      
      electrum.request.withArgs("blockchain.transaction.get", "09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198")
        .resolves("02000000010000000000000000000000000000000000000000000000000000000000000001000000006441a87e0b7d692986e47c7f19f04bb86a4e4ca95a9e6ae60ca2e2283cab90e9987148cbff6fbaceaf4ee3d0437f9e9162cf6afbb3972846bfd919b350d6d4fb515b412102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31bffffffff0200bca065010000001976a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788acd0070000000000001976a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788ac00000000")

      electrum.request.withArgs("blockchain.scripthash.listunspent", "a86b99eaddb15a85a2595b7c91db3cebdd2dffe5a47e3efe6a4954daa72ede21")
        .resolves([{ tx_hash: "09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198", tx_pos: 0 }])
      
      cy.window().then(win => {  // get the window used by app (window in above code)
        win.queryClient.invalidateQueries(allContributionsQueryKey);
        cy.wait(3000);

        cy.get('.campaign-card').trigger('mouseover');
        cy.get('.campaign-card').contains((goalInBch / 2).toFixed(0) + " BCH of " + goalInBch.toFixed(0) + " BCH");
        cy.get('.campaign-card').contains("50% completed");
        cy.get('.campaign-card').contains(/ongoing/i);
        cy.get('.campaign-card').contains("1 Pledge");
      });
    });
  });

  it('can be deleted from manage page', () => {
    cy.get('.campaign-card').click();

    cy.get('#modal').contains('Delete').click();
    cy.get('#modal').contains('Are you sure');
    cy.get('#modal').contains('Delete').click();

    cy.contains("No campaigns");
    cy.contains("Create one here!");
  });
});


import moment from "moment";
import campaignJson from "../../../fixtures/campaign.json"
const goalInBch = campaignJson.recipients[0].satoshis / SATS_PER_BCH;

import { SATS_PER_BCH } from "../../../../src/utils/bitcoinCashUtilities.js"
import { createNode } from '@ipld/dag-pb'
const allContributionsQueryKey =  ['contributions']

import { DEFAULT_API_URL, DEFAULT_GATEWAY_URL } from "../../../../src/utils/constants.js"
import { CID } from "multiformats/cid"

describe('create a campaign', () => {
  let ipfs, electrum;
  
  window.ipfs = ipfs = {}
  window.electrum = electrum = {};
  
  beforeEach(() => {
    window.ipfs = ipfs = {};
    window.electrum = electrum = {};

    cy.visit("/", {
      onBeforeLoad(win) {
        win.ipfs = ipfs = {};
        win.electrum = electrum = {};
    
        cy.spy(win.console, "log");
      }
    });
    cy.clearState();
    cy.finishedLoading();
  });

  it('has expected fields', () => {
    cy.contains('label', 'Title')
    cy.contains('label', 'Hero')
    cy.contains('label', 'Description')
    cy.contains('label', 'End date')
    cy.contains('label', 'Name')
    cy.contains('label', 'Funding Goal')
    cy.contains('label', 'Bitcoin Cash Address')
    
    cy.contains("Show advanced configuration").click();
    cy.contains('label', 'Default IPFS Gateway')
  });

  it('can load draft after refresh', () => {
    const getTitle = () => getInputByLabel('Title');
    const getHero = () => getInputByLabel('Hero');
    const getHiddenDescription = () => getInputByLabel('Description')
    const getDescription = () => getHiddenDescription().parent().get(".CodeMirror textarea");
    const getVisibleDescription = () => getHiddenDescription().parent().get(".CodeMirror-code");

    const getEnd = () => getInputByLabel('End date');
    const getName = () => getInputByLabel('Name');
    const getFundingGoal = () => getInputByLabel('Funding Goal');
    const getBitcoinCashAddress = () => getInputByLabel('Bitcoin Cash Address');

    getTitle().type(campaignJson.title);
    getHero().type(campaignJson.image);
    getDescription().type(campaignJson.description, {force: true});
    getEnd().type(moment.unix(campaignJson.expires).format('YYYY-MM-DD'));
    getName().type(campaignJson.recipients[0].name);
    getFundingGoal().type(campaignJson.recipients[0].satoshis / SATS_PER_BCH);
    getBitcoinCashAddress().type(campaignJson.recipients[0].address);

    cy.wait(2000);
    cy.reload();

    getTitle().should('have.value', campaignJson.title);
    getHero().should('have.value', campaignJson.image);
    getVisibleDescription().contains(campaignJson.description);
    getEnd().should('have.value', moment.unix(campaignJson.expires).format('YYYY-MM-DD'));
    getName().should('have.value', campaignJson.recipients[0].name);
    getFundingGoal().should('have.value', goalInBch.toFixed(8));
    getBitcoinCashAddress().should('have.value', campaignJson.recipients[0].address);
  })

  context.only('can successfully create a basic campaign', () => {

    beforeEach(() => {
      /** @type {.PBNode} */
      const baseClientDag = createNode();

      ipfs.dag = {
        get: cy.stub().resolves({ value: baseClientDag }),
        import: cy.stub().returns(async function * () {
          yield { root: { cid: CID.parse("QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn") }}
        }()),
        export: cy.stub().returns(async function * () {
        }()),
        put: cy.stub().resolves("bafybeihgo7douuwlt2xrox7z64xl4iyl3u7pwpgdjvgah7bolsaxa3txfy"),
      }
      ipfs.add = cy.stub().resolves({ size: 100, cid: "bafybeihgo7douuwlt2xrox7z64xl4iyl3u7pwpgdjvgah7bolsaxa3txfy"});
      ipfs.connectToPreloadNodes = cy.stub();
      ipfs.requestPreloading = cy.stub();
      ipfs.ready = cy.stub().resolves();
      const manifest = {
        "dag":"12330a221220b69eb5e8a3168978b0f1c1808088423e97102bb687323976fbc5fff277b80a02120a696e6465782e68746d6c18e77712310a2212205c6d24f706004cf91996d30a99d771f28f6d75fc614e1eefd55c9d00ee31da2c120673746174696318c4a9a8030a020801",
        "signature":"ICOeQ2Lu9TPrc6WmvTUGs65CHh40sGQMrfVIdgKWG2gmQdJP4JO058WC/AWovIXLKIH2bxWTloqzF63YeaQveLw=",
        "address":"bitcoincash:qzqsy2t25z96u0cgxhsntrnkqrw6qkfelqcg9hy7kc"
      }

      ipfs.cat = cy.stub().returns((async function* () { 
        yield Buffer.from(JSON.stringify(manifest)) 
      })());

      electrum.ready = cy.stub().resolves();
      electrum.request = cy.stub();

      electrum.request.withArgs("blockchain.scripthash.get_history", "c425533e4148565c472e574a1437d9790e7818ac0a0793ae4072d6379d044337")
        .resolves([]);

      const getTitle = () => getInputByLabel('Title');
      const getHero = () => getInputByLabel('Hero');
      const getHiddenDescription = () => getInputByLabel('Description')
      const getDescription = () => getHiddenDescription().parent().get(".CodeMirror textarea");
      const getVisibleDescription = () => getHiddenDescription().parent().get(".CodeMirror-code");
      const getEnd = () => getInputByLabel('End date');
      const getName = () => getInputByLabel('Name');
      const getFundingGoal = () => getInputByLabel('Funding Goal');
      const getBitcoinCashAddress = () => getInputByLabel('Bitcoin Cash Address');

      getTitle().type(campaignJson.title);
      getHero().type(campaignJson.image);
      getDescription().type(campaignJson.description, {force: true});
      getEnd().type(moment.unix(campaignJson.expires).format('YYYY-MM-DD'));
      getName().type(campaignJson.recipients[0].name);
      getFundingGoal().type(campaignJson.recipients[0].satoshis / SATS_PER_BCH);
      getBitcoinCashAddress().type(campaignJson.recipients[0].address);

      const baseClientCid = "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn";
      const expectedClientCid = "bafybeihgo7douuwlt2xrox7z64xl4iyl3u7pwpgdjvgah7bolsaxa3txfy";
      const preloadNodes = [
        "https://node0.preload.ipfs.io/",
        "https://node1.preload.ipfs.io/",
        "https://node2.preload.ipfs.io/",
        "https://node3.preload.ipfs.io/",
        DEFAULT_API_URL + "/",
      ];

      preloadNodes.forEach((preloadNode) => {
        cy.intercept('POST', preloadNode + "api/v0/refs?r=true&arg=" + baseClientCid, { statusCode: 200 }).as("base:" + preloadNode);
        cy.intercept('POST', preloadNode + "api/v0/refs?r=true&arg=" + expectedClientCid, { statusCode: 200 }).as("client:" + preloadNode);
        //Following only really adds the manifest (but aware nodes can build actual intended dag)
        cy.intercept('POST', preloadNode + "api/v0/add?stream-channels=true&preload=false&progress=false", { statusCode: 200 }).as("manifest:" + preloadNode);
      })

      cy.get("#create").click({ timeout: 10000 });
      
      cy.location().should(newUrl => {
        expect(newUrl.hash).to.contain("/manage/")
      });

      cy.get('#main').should('not.be.visible', { timeout: 5000 });
      
      [
        getTitle,
        getHero,
        getDescription,
        getEnd,
        getName,
        getFundingGoal,
        getBitcoinCashAddress,
      ].forEach((getElem) => {
        getElem().should('have.attr', 'readonly');
      })

      cy.get('#main').should('be.visible', { timeout: 5000 });
    
      getTitle().should('have.value', campaignJson.title);
      getHero().should('have.value', campaignJson.image);
      getVisibleDescription().invoke('text').should('equal', campaignJson.description.replace(/\n\n\n/g, '​​').replace(/\n\n/g, '​'));
      getEnd().should('have.value', moment.unix(campaignJson.expires).format('YYYY-MM-DD'));
      getName().should('have.value', campaignJson.recipients[0].name);
      getFundingGoal().should('have.value', goalInBch.toFixed(8));
      getBitcoinCashAddress().should('have.value', campaignJson.recipients[0].address);
    });

    it('can view contributions in manage page', () => {
      cy.get('a').contains('Manage').click();

      cy.location().should(newUrl => {
        expect(newUrl.hash).to.contain("/manage");
      });
    
      cy.get('.campaign-card').should('have.length', 1);
      cy.get('.campaign-card').contains(campaignJson.title);
      cy.get('.campaign-card').contains("0 SATS of " + goalInBch.toFixed(0) + " BCH");
      cy.get('.campaign-card').contains("0% completed");
      cy.get('.campaign-card').contains(/ongoing/i);
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
          win.queryClient.invalidateQueries(['blockchain']);
          cy.get('.campaign-card').trigger('mouseover');
          cy.get('.campaign-card').contains((goalInBch / 2).toFixed(0) + " BCH of " + goalInBch.toFixed(0) + " BCH");
          cy.get('.campaign-card').contains("50% completed");
          cy.get('.campaign-card').contains(/ongoing/i);
          cy.get('.campaign-card').contains("1 Pledge").then(() => {
            electrum.request.withArgs("blockchain.scripthash.listunspent", "a86b99eaddb15a85a2595b7c91db3cebdd2dffe5a47e3efe6a4954daa72ede21")
            .resolves([])
            
            cy.window().then(win => {  // get the window used by app (window in above code)
              win.queryClient.invalidateQueries(allContributionsQueryKey);
              win.queryClient.invalidateQueries(['blockchain']);
              cy.get('.campaign-card').trigger('mouseover');
              cy.get('.campaign-card').contains("0 SATS of " + goalInBch.toFixed(0) + " BCH");
              cy.get('.campaign-card').contains("0% completed");
              cy.get('.campaign-card').contains(/ongoing/i);
              cy.get('.campaign-card').contains("0 Pledges");
            });
          });
        });
      });
    });
  });
});

function getInputByLabel(label) {
  return cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then((id) => {
      cy.get('#' + id
        .replace(/\[/g, "\\\[")
        .replace(/\]/g, "\\\]"), { timeout: 5000 })
    })
}
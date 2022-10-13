

import moment from "moment";
import campaignJson from "../../../fixtures/campaign.json"
import { set } from "idb-keyval"

describe('create a campaign', () => {
  let ipfs, electrum;
  
  beforeEach(() => {
    localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE')

    set("WALLET", btoa('bicycle demise goddess review true initial field agree oblige combine fame maximum'));
    
    cy.intercept('campaign.json', {
      ...campaignJson,
      expires: moment().add(1, 'day').unix()
    });
    cy.visit("/", {
      onBeforeLoad(win) {
        win.ipfs = ipfs = {};
        win.electrum = electrum = {};

        electrum.ready = cy.stub().resolves();
        electrum.request = cy.stub();
        electrum.subscribe = cy.stub();

        electrum.request.withArgs("blockchain.scripthash.get_history").resolves([]);

        // electrum.request.withArgs("blockchain.scripthash.get_history", "c425533e4148565c472e574a1437d9790e7818ac0a0793ae4072d6379d044337")
        //   .resolves([]);
          
        cy.spy(win.console, "log");
      }
    });
    cy.finishedLoading({ timeout: 10000 });
  });

  it('has expected fields', () => {

    cy.get('.title').contains(campaignJson.title)
    cy.get('.hero-image').should('have.css', 'background-image').and('include', campaignJson.image);
    cy.get('.donate-panel').contains("0 SATS raised of 120 BCH goal")
    cy.get('.donate-panel').contains("0 contributions")
    cy.get('.donate-panel').contains("Ends in a day")
    cy.get('.donate-panel').contains('Share')
    cy.get('.donate-panel').contains('Pledge now')

    cy.contains('Read more').should('exist');
    cy.contains('Read more').should('be.visible');

    cy.wait(1000);

    cy.contains("Should not be visible").should('exist').should('not.be.visible')
    cy.contains('Read more').click();
    cy.contains("Should not be visible").should('exist').should('be.visible')

    cy.get('.recipient-list').contains('1 recipient')
    cy.get('.recipient-list').contains(campaignJson.recipients[0].name);
    cy.get('.recipient-list').contains("120 BCH").then(() => {
        electrum.request.withArgs("blockchain.scripthash.get_history", "c425533e4148565c472e574a1437d9790e7818ac0a0793ae4072d6379d044337")
          .resolves([{ tx_hash: 'faketxid', height: 1 }]);

        electrum.request.withArgs("blockchain.transaction.get", "faketxid")
          .resolves("02000000019831c98fc98e4bc7a0db2435da93c2ce54c15a97e8c262d73508e55d238e2909010000006441eef4b036e37fa3b99cba4e97b440baac52d8703d404dc1e6629b1e0727b994e1563f4214ec7d34006ee93f37dae6ecaf6b05ec33a37c293901f782f064ad569b412102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31bffffffff0222020000000000001976a91413f0d06f58cff5149abd19698597e275799095e788ac0000000000000000b76a4cb409298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc9319800000000ffffffff0000000000000000000000000000000000000000000000000000000000000000000047304402204006d34e7eed6b020a4067ce667aef82fa06219bce5e2bc3553ed7dffb1eed310220110ee324110a51e5e62b0f48c90fae08de5fd28634184b094005f1884632cb83c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b00000000");
        
        electrum.request.withArgs("blockchain.transaction.get", "09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198")
          .resolves("02000000010000000000000000000000000000000000000000000000000000000000000001000000006441a87e0b7d692986e47c7f19f04bb86a4e4ca95a9e6ae60ca2e2283cab90e9987148cbff6fbaceaf4ee3d0437f9e9162cf6afbb3972846bfd919b350d6d4fb515b412102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31bffffffff0200bca065010000001976a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788acd0070000000000001976a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788ac00000000")

        electrum.request.withArgs("blockchain.scripthash.listunspent", "a86b99eaddb15a85a2595b7c91db3cebdd2dffe5a47e3efe6a4954daa72ede21")
          .resolves([{ tx_hash: "09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198", tx_pos: 0, value: 6000000000 }])

        const goalInBch = 120;
        cy.window().then(win => {  // get the window used by app (window in above code)
          win.queryClient.invalidateQueries(['contributions']);
          win.queryClient.invalidateQueries(['blockchain']);
          cy.get('.donate-panel').trigger('mouseover');          
          cy.get('.donate-panel').contains("60 BCH raised of 120 BCH goal")
          cy.get('.donate-panel').contains("1 contribution")
          cy.get('.contribution-list').contains("1 contribution")
          cy.get('.contribution-list').contains("Anonymous")  
          cy.get('.contribution-list').contains("50%")  
          cy.get('.contribution-list').contains("60 BCH")  

          .then(() => {
            electrum.request.withArgs("blockchain.scripthash.listunspent", "a86b99eaddb15a85a2595b7c91db3cebdd2dffe5a47e3efe6a4954daa72ede21")
            .resolves([])
            
            cy.window().then(win => {  // get the window used by app (window in above code)
              win.queryClient.invalidateQueries(['contributions']);
              win.queryClient.invalidateQueries(['blockchain']);
              cy.get('.donate-panel').trigger('mouseover');
              cy.get('.donate-panel').contains("0 SATS raised of 120 BCH goal")
              cy.get('.donate-panel').contains("0 contributions")
            });
          });
        });
    })
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
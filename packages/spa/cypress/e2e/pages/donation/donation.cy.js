

import moment from "moment";
import campaignJson from "../../../fixtures/campaign.json"
import { set, del } from "idb-keyval"
import * as multipart from 'parse-multipart-data';

import bchJsLibrary from "@psf/bitcoincashjs-lib"
const { Transaction } = bchJsLibrary;

import { DEFAULT_API_URL, DEFAULT_GATEWAY_URL } from "../../../../src/utils/constants.js"

describe('making a donation', () => {
  let ipfs, electrum;
  
  window.ipfs = ipfs = {}
  window.electrum = electrum = {};

  beforeEach(() => {
    
    window.ipfs = ipfs = {};
    window.electrum = electrum = {};

    localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE')

    set("WALLET", btoa('bicycle demise goddess review true initial field agree oblige combine fame maximum'));
    del("RETURN_ADDRESS");
    del("LOCKED_UTXOS");

    const now = moment('2022-01-01').startOf('day');
    const expires = moment(now).add(1, 'day').endOf('day').unix();
    
    cy.intercept('campaign.json', { ...campaignJson, expires });

    cy.clock(now.toDate(), ["Date"]).visit("/#/donate", {
      onBeforeLoad(win) {
        win.ipfs = ipfs = {};
        win.electrum = electrum = {};

        electrum.ready = cy.stub().resolves();
        electrum.request = cy.stub();
        electrum.subscribe = cy.stub();

        electrum.request.withArgs("blockchain.scripthash.get_history").resolves([]);
        electrum.request.withArgs("blockchain.scripthash.listunspent").resolves([]);
        electrum.request.withArgs("blockchain.transaction.broadcast").resolves("0000000000000000000000000000000000000000000000000000000000000000");

        // electrum.request.withArgs("blockchain.scripthash.get_history", "c425533e4148565c472e574a1437d9790e7818ac0a0793ae4072d6379d044337")
        //   .resolves([]);
        
        electrum.request.withArgs("blockchain.scripthash.listunspent", "a86b99eaddb15a85a2595b7c91db3cebdd2dffe5a47e3efe6a4954daa72ede21")
          .resolves([{ tx_hash: "09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198", tx_pos: 0, value: 6000000000, height: 1 }]);
        
        electrum.request.withArgs("blockchain.transaction.get", "09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198")
          .resolves("02000000010000000000000000000000000000000000000000000000000000000000000001000000006441a87e0b7d692986e47c7f19f04bb86a4e4ca95a9e6ae60ca2e2283cab90e9987148cbff6fbaceaf4ee3d0437f9e9162cf6afbb3972846bfd919b350d6d4fb515b412102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31bffffffff0200bca065010000001976a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788acd0070000000000001976a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788ac00000000")
    
        cy.spy(win.console, "log");
      }
    });

    cy.finishedLoading({ timeout: 10000 });
  });

  it('can successfully donate using integrated wallet', () => {

    cy.contains("You're supporting " + campaignJson.title);
    cy.contains("Your donation will benefit " + campaignJson.recipients[0].name);

    electrum.request.withArgs("blockchain.scripthash.listunspent", "a86b99eaddb15a85a2595b7c91db3cebdd2dffe5a47e3efe6a4954daa72ede21")
      .resolves([{ tx_hash: "09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198", tx_pos: 0, value: 6000000000, height: 1 }])

    ipfs.add = cy.stub();
    ipfs.ready = cy.stub().resolves();
    
    // ipfs.add.withArgs(
    //   Cypress.sinon.match('{"recipients":[{"name":"Test","address":"bitcoincash:qqflp5r0tr8l29y6h5vknpvhuf6hnyy4uuv43aphgu","satoshis":12000000000}],"txHash":"a701e745800c77697a58decfaa16ecea1d8e28808505d7893e67e89de1fac572","txIndex":0,"unlockingScript":"4830450221008c380ec0673b59ab612bbdf63ccc6c8589fb85ab2d4967894d934b4d32f935ff02203fbcd20f9b6b26bfc6b03ef30b6bf0bc7e145132a65eda2c01ffa03234aa27d9c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b","seqNum":4294967295')
    // ).resolves({
    //   cid: {
    //     toV0: cy.stub().returns({
    //       bytes: Buffer.alloc(34).fill(0)
    //     })
    //   }
    // });

    cy.get('#donationAmount').type('5').type('9').type('.').type('9').type('9').type('7')
    cy.get('form').click()
    cy.get('#donationAmount').should('have.value', 59.997.toFixed(8));

    cy.contains('Continue').click();
    cy.contains('Integrated wallet').click();
    getInputByLabel("Alias").type("Test Alias");
    getInputByLabel("Comment").type("Test Comment");

    let fakeCommitment, fakeNotification;

    electrum.request.withArgs("blockchain.transaction.broadcast").onFirstCall().callsFake(async (_, txHex) => {
      fakeCommitment = Transaction.fromHex(txHex);

      //After fake setup transaction add it to wallet unspent and tx.get so it can be toggled      
      electrum.request.withArgs("blockchain.transaction.get", fakeCommitment.getId().toString())
        .resolves(fakeCommitment.toHex());
        
      electrum.request.withArgs("blockchain.scripthash.listunspent", "a86b99eaddb15a85a2595b7c91db3cebdd2dffe5a47e3efe6a4954daa72ede21")
        .resolves([{ tx_hash: fakeCommitment.getId().toString(), tx_pos: 0, value: fakeCommitment.outs[0].value, height: 2 }])

      return fakeCommitment.getId().toString();
    })
    
    electrum.request.withArgs("blockchain.transaction.broadcast").onSecondCall().callsFake(async (_, txHex) => {
      fakeNotification = Transaction.fromHex(txHex);

      //After fake notification: add it to electrum get_history and tx_get
      electrum.request.withArgs("blockchain.scripthash.get_history", "c425533e4148565c472e574a1437d9790e7818ac0a0793ae4072d6379d044337")
        .resolves([{ tx_hash: fakeNotification.getId().toString(), height: 1 }]);
      
      electrum.request.withArgs("blockchain.transaction.get",  fakeNotification.getId().toString())
        .resolves(fakeNotification.toHex());

      return fakeNotification.getId().toString();
    });
    
    cy.intercept("POST", DEFAULT_API_URL + "/api/v0/add?cid-version=0", {
      Hash: "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn"
    }).as("ipfsCommitmentData");
    
    cy.contains('Donate now').click();
    cy.contains('Pledge',{ timeout: 6000 }).wait(2000).should('not.be.disabled', { timeout: 6000 }).click();

    cy.wait('@ipfsCommitmentData').then((interception) => {
      // debugger;
      const formData = multipart.parse(Buffer.from(interception.request.body), interception.request.headers["content-type"].split("boundary=")[1]);
      const commitmentData = JSON.parse(Buffer.from(formData[0].data).toString('utf8'))
      cy.intercept("GET", `${DEFAULT_GATEWAY_URL}/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn/`, commitmentData);
    });



    cy.location().should(newUrl => {
      expect(newUrl.hash).to.eq("#/")
    });

    cy.window().then(win => {  // get the window used by app (window in above code)

      cy.get('.donate-panel').trigger('mouseover');          
      cy.get('.donate-panel').contains("59.997 BCH raised of 120 BCH goal")
      cy.get('.donate-panel').contains("1 contribution")
      cy.get('.contribution-list').contains("1 contribution")
      cy.get('.contribution-list').contains("Test Alias")
      cy.get('.contribution-list').contains("Test Comment")  
      cy.get('.contribution-list').contains("50%")  
      cy.get('.contribution-list').contains("59.997 BCH");
      
      cy.contains('Pledge now').click();
      
      cy.location().should(newUrl => {
        expect(newUrl.hash).to.eq("#/donate")
      });
  
      cy.contains('Continue').click().wait(500).click();
      cy.contains('Integrated wallet').click();
      cy.contains('Donate now').click();
      cy.contains('Manage wallet').click();
      
      cy.get('.utxo-item').should('have.length', 1);
      cy.get('.utxo-item .isLocked-col .checkbox').should('be.checked');
      cy.get('.utxo-item .txid-col').contains(fakeCommitment.getId().toString().slice(0,12) + ":0");
      cy.get('.utxo-item .satoshis-col').contains(fakeCommitment.outs[0].value);
      cy.get('.utxo-item').contains('refund').click();

      electrum.request.withArgs("blockchain.transaction.broadcast").onSecondCall().callsFake(async (_, txHex) => {
        fakeNotification = Transaction.fromHex(txHex);
        return fakeNotification.getId().toString();
      });

      getInputByLabel('Address').should('have.value', 'bitcoincash:qpn7qf6tacxa3xj5khst3e5h9hxanjyzyukc6y2t0x');
      cy.contains('Refund').click();
    });
  });

  it('can successfully donate using external wallet', () => {
    
    ipfs.add = cy.stub();

    // ipfs.add.withArgs(
    //   Cypress.sinon.match('{"recipients":[{"name":"Test","address":"bitcoincash:qqflp5r0tr8l29y6h5vknpvhuf6hnyy4uuv43aphgu","satoshis":12000000000}],"txHash":"09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198","txIndex":0,"unlockingScript":"47304402204006d34e7eed6b020a4067ce667aef82fa06219bce5e2bc3553ed7dffb1eed310220110ee324110a51e5e62b0f48c90fae08de5fd28634184b094005f1884632cb83c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b","seqNum":4294967295,"applicationData":{"comment":"Test","alias":"Test"},"applicationDataSignature":"IFOXh5lhlPes/IUgShB/uyJf2zhPJwfmSJfM35Y8jT30KICoS1hSLFXOUvrHnBGtPUt1CUJZWJ154idDDJsYcCw=","version":"0.0.0"}')
    // ).resolves({
    //   cid: {
    //     toV0: cy.stub().returns({
    //       bytes: Buffer.alloc(34).fill(0)
    //     })
    //   }
    // });
    
    cy.intercept("POST", DEFAULT_API_URL + "/api/v0/add?cid-version=0", {
      Hash: "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn"
    }).as("ipfsCommitmentData");

    cy.get('#donationAmount').type('5').type('9').type('.').type('9').type('9').type('7')
    cy.get('form').click()
    cy.get('#donationAmount').should('have.value', 59.997.toFixed(8));

    cy.contains('Continue').click();
    cy.contains('Electron Cash').click();
    cy.contains('Donate now').click();

    getInputByLabel("Copy to plugin").should(
      'have.value', 
      'eyJvdXRwdXRzIjpbeyJ2YWx1ZSI6MTIwMDAwMDAwMDAsImFkZHJlc3MiOiJiaXRjb2luY2FzaDpxcWZscDVyMHRyOGwyOXk2aDV2a25wdmh1ZjZobnl5NHV1djQzYXBoZ3UifV0sImRhdGEiOnsiYWxpYXMiOiIiLCJjb21tZW50IjoiIn0sImRvbmF0aW9uIjp7ImFtb3VudCI6NTk5OTcwMDAwMH0sImV4cGlyZXMiOjE2NDExODU5OTl9'
    );
    
    getInputByLabel("Paste the result").invoke('val',
      Buffer.from(JSON.stringify({
        inputs: [
          { 
            previous_output_transaction_hash: "09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198", 
            previous_output_index: 0,
            sequence_number: 0xffffffff,
            unlocking_script: "47304402204006d34e7eed6b020a4067ce667aef82fa06219bce5e2bc3553ed7dffb1eed310220110ee324110a51e5e62b0f48c90fae08de5fd28634184b094005f1884632cb83c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b"
          }
        ]
      })).toString('base64')
    ).trigger('input');

    cy.contains("Next").click();
    getInputByLabel("Alias").type("Test");
    getInputByLabel("Comment").type("Test");
    cy.contains("Next").click();

    getInputByLabel("Message").should(
      'have.value', 
      'eCF7ImNvbW1lbnQiOiJUZXN0IiwiYWxpYXMiOiJUZXN0In0='
    );

    getInputByLabel("Address").should(
      'have.value', 
      'bitcoincash:qpn7qf6tacxa3xj5khst3e5h9hxanjyzyukc6y2t0x'
    );

    getInputByLabel("Copy the resulting signature here:", {force: true}).invoke('val', 
      "IFOXh5lhlPes/IUgShB/uyJf2zhPJwfmSJfM35Y8jT30KICoS1hSLFXOUvrHnBGtPUt1CUJZWJ154idDDJsYcCw="
    ).trigger('input')

    cy.contains("Next").click();
    getInputByLabel("Bip 21").should('have.value', 
      'bitcoincash:qqflp5r0tr8l29y6h5vknpvhuf6hnyy4uuv43aphgu?amount=.00000546&op_return_raw=4cb409298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc9319800000000ffffffff122059948439065f29619ef41280cbb932be52c56d99c5966b65e0111239f098bbef47304402204006d34e7eed6b020a4067ce667aef82fa06219bce5e2bc3553ed7dffb1eed310220110ee324110a51e5e62b0f48c90fae08de5fd28634184b094005f1884632cb83c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b'
    );
    cy.contains("Done").click();

    cy.location().should(url => {
      expect(url.hash).to.eq("#/")
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
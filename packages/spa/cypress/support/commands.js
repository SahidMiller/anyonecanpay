import { clear, del, get } from 'idb-keyval';
import campaignStore from "../../src/utils/campaignStore.js"
import manageStore from "../../src/utils/manageStore.js"

Cypress.Commands.add('clearState', function clearState() {
  del("draft");
  clear(campaignStore);
  clear(manageStore);
});

Cypress.Commands.add('finishedLoading', function finishedLoading({ timeout = 5000} = {}) {
  return cy.get('#main-loader', { timeout }).should('not.exist', { timeout });
});

Cypress.Commands.add('finishedLoading', function finishedLoading({ timeout = 5000} = {}) {
  return cy.get('#main').should('be.visible', { timeout });
});
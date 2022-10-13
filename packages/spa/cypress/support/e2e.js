import "./commands.js"

const emptyString ='""';

global.__DEFAULT_GATEWAY_URL__ = JSON.parse(Cypress.env('__DEFAULT_GATEWAY_URL__') || emptyString);
global.__DEFAULT_GATEWAY_URL__ =  JSON.parse(Cypress.env('__DEFAULT_GATEWAY_URL__') || emptyString);
global.__DEFAULT_API_MULTIADDR__ =  JSON.parse(Cypress.env('__DEFAULT_API_MULTIADDR__') || emptyString);
global.__DEFAULT_API_URL__ =  JSON.parse(Cypress.env('__DEFAULT_API_URL__') || emptyString);
global.__FLIPSTARTER_CLIENT__ =  JSON.parse(Cypress.env('__FLIPSTARTER_CLIENT__') || emptyString);
global.__FLIPSTARTER_CLIENT_IPNS__ =  JSON.parse(Cypress.env('__FLIPSTARTER_CLIENT_IPNS__') || emptyString);
global.__FLIPSTARTER_CLIENT_RECORD__ =  JSON.parse(Cypress.env('__FLIPSTARTER_CLIENT_RECORD__') || emptyString);
global.__ELECTRUM_SERVERS__ =  JSON.parse(Cypress.env('__ELECTRUM_SERVERS__') || emptyString);
global.__PRELOAD_NODES__ =  JSON.parse(Cypress.env('__PRELOAD_NODES__') || emptyString);
global.__DEV_TIPS_ADDRESS__ =  JSON.parse(Cypress.env('__DEV_TIPS_ADDRESS__') || emptyString);
const typeforce = require("typeforce-polyfilled");
const polyfill = () => {};
Object.assign(polyfill, typeforce);

module.exports = polyfill;
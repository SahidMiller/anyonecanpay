const http = require('./http.js');
const { expect } = require('chai');

const METHODS = [
  'GET',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD'
]

module.exports = async function testHttpMethod (url, serverOptions) {
  for (let i = 0; i < METHODS.length; i++) {
    const res = await http({
      method: METHODS[i],
      url
    }, serverOptions)

    expect(res).to.have.property('statusCode', 404)
  }
}
const FlipstarterHttpServer = require("../src/server");

module.exports = async function http(request, serverOptions) {
  const api = new FlipstarterHttpServer(serverOptions)
  
  const server = await api._createServer({ 
    host: '127.0.0.1', 
    port: 8888,
    ipfs: serverOptions.ipfs, 
    blockchain: serverOptions.blockchain,
    supportedClients: serverOptions.supportedClients
  });

  return server.inject(request)
}
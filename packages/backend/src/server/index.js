const Hapi = require('@hapi/hapi');
const routes = require('./routes/index.js');
const { setMaxListeners } = require('events');

module.exports = class FlipstarterHttpServer {
  
  /**
   * FlipstarterHttpServer
   * 
   * @param {import('ipfs').IPFS} ipfs
   * @param {Array<string>} supportedClients
   */
  constructor(ipfs, supportedClients) {
    this._ipfs = ipfs;
    this._supportedClients = supportedClients;
  }

  async start({ port, host }, ...hapiParams) {

    this.server = await this._createServer({ port, host, ipfs: this._ipfs, supportedClients: this._supportedClients });
    
    await this.server.start(...hapiParams)
  }

  async _createServer({ port, host, ipfs, supportedClients }) {
    
    if (!ipfs) {
      throw new Error("'ipfs' argument required");
    }

    if (!supportedClients) {
      throw new Error("'supportedClients' argument required");
    }

    const server = Hapi.server({ 
      port, 
      host,
    });

    server.ext({
      type: 'onRequest',
      method: function (request, h) {
        const controller = new AbortController()
        // make sure we don't cause warnings to be logged for 'abort' event listeners
        setMaxListeners && setMaxListeners(Infinity, controller.signal)
        request.app.signal = controller.signal

        // abort the request if the client disconnects
        request.raw.res.once('close', () => {
          controller.abort()
        })

        // abort the request if the client disconnects
        request.events.once('disconnect', () => {
          controller.abort()
        })

        return h.continue
      }
    })

    server.route(routes);

    server.app.ipfs = ipfs;
    server.app.supportedClients = supportedClients;

    return server;
  }

  async stop() {
    await this.server.stop();
    this.server = null;
  }
};
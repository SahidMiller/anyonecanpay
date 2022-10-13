const FlipstarterServer = require('../../server/index.js');
const Ipfs = require('ipfs');
const IpfsHttpClient = require('ipfs-http-client');
const parseDuration = require('parse-duration').default;

module.exports = {
  command: 'daemon [port] [host]',
  describe: 'start flipstarter backend daemon',
  builder: {
    port: {
      alias: 'p',
      type: 'number',
      default: 8082,
    },
    host: {
      alias: 'h',
      type: 'string',
      default: 'localhost',
    },
    ipfsApi: {
      alias: 'api',
      type: 'string',
    },
    supportedClient: {
      alias: 'client',
      type: 'array',
      demandOption: true,
      default: [
        "k51qzi5uqu5djrim5s9504kowmxmgexhf03sgdgqkefn0afou0kj1gdhz8ncjw",
        "bitcoincash:qzqsy2t25z96u0cgxhsntrnkqrw6qkfelqcg9hy7kc"
      ]
    },
    timeout: {
      type: 'string',
      coerce: parseDuration
    },
  },
  async handler (argv) {
    const { print, repoPath } = argv.ctx

    let gatewayServer;

    /** @type {Ipfs.IPFS} */
    const ipfs = argv.ipfsApi ? IpfsHttpClient.create(argv.ipfsApi) : await Ipfs.create({ repoPath });

    try {

      gatewayServer = new FlipstarterServer(ipfs, argv.supportedClient);
      
      const host = argv.host || '127.0.0.1';
      const port = argv.port || '8082';
      const options = { host, port };

      await gatewayServer.start(options);
      
      console.info(`gateway server started on ${host}:${port}`);

    } catch (err) {

      console.log("failed to start the gateway server");
      
      if (argv.verbose) {
        console.log(err);
      }

      return false;
    }

    print('Daemon is ready')

    const cleanup = async () => {
      print('Received interrupt signal, shutting down...')
      await Promise.all([
        gatewayServer ? gatewayServer.stop().catch((err) => print("failed to stop gateway server: " + err.toString())) : Promise.resolve(),
      ])

      print('Server stopped cleanly')
      process.exit(0)
    }

    // listen for graceful termination
    process.on('SIGTERM', cleanup)
    process.on('SIGINT', cleanup)
    process.on('SIGHUP', cleanup)
  }
}

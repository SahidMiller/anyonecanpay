const { defineConfig } = require("cypress");
const path = require("path");

require('dotenv').config({ path: path.resolve(process.cwd(), "../../.env") });

async function getBraveBrowser() {
  // inside config.browsers array each object has information like
  const browserPath = '/usr/bin/brave'
  const { execa } = await import('execa');

  return execa(browserPath, ['--version']).then((result) => {
    // STDOUT will be like "Brave Browser 77.0.69.135"
    const [, version] = /Brave Browser (\d+\.\d+\.\d+\.\d+)/.exec(result.stdout)
    const majorVersion = parseInt(version.split('.')[0])

    return {
      name: 'Brave',
      channel: 'stable',
      family: 'chromium',
      displayName: 'Brave',
      version,
      path: browserPath,
      majorVersion
    }
    // implement node event listeners here
  });
}

module.exports = defineConfig({
  e2e: {
    async setupNodeEvents(on, config) {
      const basePath = process.env.NODE_ENV === "production" ?
        `ipns/${process.env.IPFS_LIBP2P_KEY}` :
        "";

      return {
        browsers: config.browsers.concat(await getBraveBrowser()),
        baseUrl: `http://localhost:8083/${basePath}`,
      }
    }
  },
  env: {
    __DEFAULT_GATEWAY_URL__: JSON.stringify(process.env.DEFAULT_GATEWAY_URL),
    __DEFAULT_API_MULTIADDR__: JSON.stringify(process.env.DEFAULT_API_MULTIADDR),
    __DEFAULT_API_URL__: JSON.stringify(process.env.DEFAULT_API_URL),
    __FLIPSTARTER_CLIENT__: JSON.stringify(process.env.FLIPSTARTER_CLIENT),
    __FLIPSTARTER_CLIENT_IPNS__: JSON.stringify(process.env.FLIPSTARTER_CLIENT_IPNS),
    __FLIPSTARTER_CLIENT_RECORD__: JSON.stringify(process.env.FLIPSTARTER_CLIENT_RECORD),
    __ELECTRUM_SERVERS__: JSON.stringify([
      { address: "bch.imaginary.cash", scheme: "wss" },
      { address: "electroncash.dk", scheme: "wss" },
      { address: "electrum.imaginary.cash", scheme: "wss" },
    ]),
    __PRELOAD_NODES__: JSON.stringify([
      { url: "https://node0.preload.ipfs.io" },
      { url: "https://node1.preload.ipfs.io" },
      { url: "https://node2.preload.ipfs.io" },
      { url: "https://node3.preload.ipfs.io" },
      ...([{ 
        url: process.env.DEFAULT_API_URL, 
        multiaddr: process.env.DEFAULT_API_MULTIADDR
      }] || []),
    ]),
    __DEV_TIPS_ADDRESS__:  JSON.stringify(process.env.DEV_TIPS_ADDRESS)
  }
});

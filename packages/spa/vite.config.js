import {defineConfig, loadEnv} from "vite"
import preact from "@preact/preset-vite";
import { viteExternalsPlugin } from 'vite-plugin-externals/dist/index.js'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import svgr from 'vite-plugin-svgr'
import fs from 'fs'
import path from 'path'
import { visualizer } from "rollup-plugin-visualizer";
import pnpPlugin from `rollup-plugin-pnp-resolve`;
import { createRequire } from 'module';
import signedManifestPlugin from "./scripts/rollup-sign-manifest-plugin.js"
import restartDockerPlugin from "./scripts/rollup-restart-docker-plugin.js"

const require = createRequire(import.meta.url);

// vite.config.ts
export default ({ mode } = {}) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), "../../"), '');

  const externalModules = {
    ipfs: 'Ipfs',
  }

  const copyTargets = [
    {
      src: './public/js/*',
      dest: './static/js'
    },
    {
      src: './public/snd/applause.mp3',
      dest: './static/media/'
    },
  ]
  
  if (env.BUILD_CAMPAIGN) {
    copyTargets.push({
      src: './public/campaign.json',
      dest: './'
    });
  }

  return defineConfig({
    server: {
      https: env.BUILD_HTTPS && {
        key: fs.readFileSync('../../.cert/key.pem'),
        cert: fs.readFileSync('../../.cert/cert.pem'),
      },
    },
    define: {
      __DEFAULT_GATEWAY_URL__: JSON.stringify(env.DEFAULT_GATEWAY_URL),
      __DEFAULT_API_MULTIADDR__: JSON.stringify(env.DEFAULT_API_MULTIADDR),
      __DEFAULT_API_URL__: JSON.stringify(env.DEFAULT_API_URL),
      __FLIPSTARTER_CLIENT__: JSON.stringify(env.FLIPSTARTER_CLIENT),
      __FLIPSTARTER_CLIENT_IPNS__: JSON.stringify(env.FLIPSTARTER_CLIENT_IPNS),
      __FLIPSTARTER_CLIENT_RECORD__: JSON.stringify(env.FLIPSTARTER_CLIENT_RECORD),
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
          url: env.DEFAULT_API_URL, 
          multiaddr: env.DEFAULT_API_MULTIADDR
        }] || []),
      ]),
      __DEV_TIPS_ADDRESS__:  JSON.stringify(env.DEV_TIPS_ADDRESS)
    },
    publicDir: false,
    plugins: [
      pnpPlugin(),
      preact(),
      svgr(),
      viteStaticCopy({
        targets: copyTargets
      }),
      viteExternalsPlugin(externalModules),
      visualizer(),
      signedManifestPlugin({
        address: env.SIGNING_NODE_ADDRESS,
        wif: env.SIGNING_NODE_WIF
      }),
      restartDockerPlugin({
        name: "spa",
        enabled: env.NODE_ENV === 'development',
      })
    ],
    resolve: {
      alias: {
        "preact/compat": require.resolve("preact/compat"),
        "react-query": '@tanstack/react-query',
        "bip39": '@scure/bip39',
        "moment": 'dayjs',
        "buffer": require.resolve('buffer/'),
        "stream": 'stream-browserify',
        "util": require.resolve('util/'),
        crypto: 'crypto-browserify',
        child_process: './polyfill/empty.js',
        // //IPFS - when not externalized in dev
        os: 'os-browserify/browser',
        path: 'path-browserify',
        http: 'stream-http',
        https: 'https-browserify',
        net: './polyfill/empty.js',
        xml2js: './polyfill/empty.js',
        'ipfs': './public/js/ipfs.min.js',
        'typeforce': require.resolve(env.NODE_ENV !=="development" ? "./polyfill/typeforce.cjs" : "typeforce"),
        'typeforce-polyfilled': require.resolve("typeforce"),
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis'
        },
      },
    },
    build: {
      emptyOutDir: true,
      minify: env.NODE_ENV !== 'development' ? false : 'esbuild',
      rollupOptions: {
        output: {
          entryFileNames: `static/js/[name].js`,
          chunkFileNames: `static/js/[name].js`,
          assetFileNames: (info) => {
            if (/\.css$/.test(info.name)) {
              return `static/css/[name].[ext]`
            } else {
              return `static/media/[name].[ext]`
            }
          },
        }
      }
    },
  });
}
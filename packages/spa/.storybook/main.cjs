// .storybook/main.js|ts
const { mergeConfig } = require('vite');
const preact = require("@preact/preset-vite").default;
const { viteExternalsPlugin } = require('vite-plugin-externals')
const { viteStaticCopy } = require('vite-plugin-static-copy')

module.exports = {
  stories: ['../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  core: {
    builder: '@storybook/builder-vite', // 👈 The builder enabled here.
  },
  async viteFinal(config) {
    // Merge custom configuration into the default config
    const { resolve } = (await import('../vite.config.js')).default({});

    return mergeConfig(config, {
      publicDir: false,

      // Use the same "resolve" configuration as your app
      resolve, 
      // Add dependencies to pre-optimization
      optimizeDeps: {
        include: ['storybook-dark-mode'],
      },
      plugins: [
        preact(),
      ],
      optimizeDeps: {
        esbuildOptions: {
          // Node.js global to browser globalThis
          define: {
            global: 'globalThis'
          },
        },
      },
    });
  },
};
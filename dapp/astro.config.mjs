import { defineConfig } from 'astro/config';
import basicSsl from '@vitejs/plugin-basic-ssl'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import react from '@astrojs/react';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      basicSsl(),
      nodePolyfills(
        {
          include: ['fs', 'child_process'],
          globals: { Buffer:true, global: true, process: true },
          protocolImports: true,
        }
      ),
    ],
    server: {
      https: true,
    },
  },
  integrations: [react(), tailwind()]
})
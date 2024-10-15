import { defineConfig } from 'astro/config';
import basicSsl from '@vitejs/plugin-basic-ssl'

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [basicSsl()],
    server: {
      https: true,
    },
  },
  routes: [
    '/predictions',
  ],
  integrations: [react()]
})
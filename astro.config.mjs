import { defineConfig } from 'astro/config';
import image from '@astrojs/image';

// https://astro.build/config
export default defineConfig({
    site: 'https://manuelavos.com',
    output: 'static',
    vite : {
        build: {
            cssTarget: 'es2015'
        }
    },
    integrations: [image({
        serviceEntryPoint: '@astrojs/image/sharp'
      })],
});

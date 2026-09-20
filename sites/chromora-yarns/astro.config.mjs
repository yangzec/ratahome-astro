// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    port: 43125,
    host: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@trade/core': fileURLToPath(new URL('../../packages/core/src', import.meta.url)),
        '@trade/sections': fileURLToPath(new URL('../../packages/sections/src', import.meta.url)),
        '@site/config': fileURLToPath(new URL('./site.config.ts', import.meta.url)),
        '@site/content': fileURLToPath(new URL('./src/lib/content.ts', import.meta.url)),
        '@site/theme': fileURLToPath(new URL('./theme.json', import.meta.url)),
        '@site/blueprints': fileURLToPath(new URL('./blueprints', import.meta.url)),
      },
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});

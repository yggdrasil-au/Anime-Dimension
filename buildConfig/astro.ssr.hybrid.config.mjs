// Sites\Anime-Dimension\main\buildConfig\astro.config.mjs
// test SSR/hybrid Astro config for /anime-ssr/* paths

import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

// Hybrid (SSR) dev config for testing /anime-ssr/*
export default defineConfig({
    output: 'hybrid',
    build: {
        format: 'preserve',
    },
    integrations: [mdx()],
    srcDir: './source/html',
    publicDir: './public',
    cacheDir: './www/dist/.astro-ssr',
    outDir: './www/dist/html-ssr',
    server: {
        host: '0.0.0.0',
        port: 3001,
    },
})


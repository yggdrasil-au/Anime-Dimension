// Sites\Anime-Dimension\main\buildConfig\astro.config.mjs

import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
//import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    output: 'static',
    build: {
        format: 'preserve',
    },
    /*adapter: node({
        mode: 'standalone'
    }),*/
    markdown: {
        shikiConfig: {
            theme: 'dark-plus',
        },
    },
    integrations: [mdx()],
    srcDir: './source/html',
    publicDir: './public',
    cacheDir: './www/dist/astrobuild/.astrocache',
    outDir: './www/dist/astrobuild',
    server: {
        host: '0.0.0.0',
        port: 3000,
    },
    vite: {
        server: {
            host: '0.0.0.0',
            // Allow custom host for dev access (Vite 5 host check)
            allowedHosts: ['dev.anime-dimension.com'],
            watch: {
                ignored: ['!**/www/dist/**'],
            },
        },
    },
})

// Sites\Anime-Dimension\main\buildConfig\astro.config.mjs

import { defineConfig } from 'npm:astro@6.1.5/config'
import mdx from 'npm:@astrojs/mdx@5.0.3'
//import node from 'npm:@astrojs/node';

// https://astro.build/config
export default defineConfig({
    output: 'static',
    //output: 'server', // SSR
    build: {
        format: 'preserve',
    },
    //base: '/client/',
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
    //server: {
    //    host: '127.0.0.1',
    //    port: 3000,
    //},
    vite: {
        server: {
            host: '127.0.0.1',
            // Allow custom host for dev access (Vite 5 host check)
            allowedHosts: ['dev.anime-dimension.com'],
            watch: {
                ignored: ['!**/www/dist/**'],
            },
        },
    },
})

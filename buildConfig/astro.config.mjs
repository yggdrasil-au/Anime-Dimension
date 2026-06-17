// Sites\Anime-Dimension\main\buildConfig\astro.config.mjs

import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
//import node from 'npm:@astrojs/node';

// https://astro.build/config
export default defineConfig({
    output: 'static',
    //output: 'server', // SSR
    build: {
        format: 'preserve',
    },
    //base: '/client/',
    //adapter: node({
    //    mode: 'middleware'
    //}),
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
})

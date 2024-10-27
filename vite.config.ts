import { defineConfig } from 'vite'

export default defineConfig({
    'root': 'src',
    'publicDir': '../public',
    'appType': 'mpa',
    'build': {
        'copyPublicDir': true,
        'outDir': '../build',
        'emptyOutDir': true,
        'assetsDir': 'static',
        'assetsInlineLimit': 0,
        'minify': false,
        'sourcemap': false,
        'cssMinify': false,
        'cssCodeSplit': false,
        'ssr': false
    },
    'css': {
        'transformer': 'postcss',
        'modules': false,
        'devSourcemap': false
    },
    // 'plugins': [{
    //     name: 'dctweak-index-stuffer',
    //     transformIndexHtml(html, ctx) {
    //         return html.replace(/<body>/, `<body>\nHELLO\n${(readFileSync('build/dctweaked.ts'))}`)
    //     }
    // }]

})


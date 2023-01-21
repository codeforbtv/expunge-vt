const vuePlugin = require("esbuild-plugin-vue3")
const esbuild = require('esbuild');
const copyStaticFiles = require('esbuild-copy-static-files')

esbuild.build({
    entryPoints: ['background.js', 'filings.js', 'index.js', 'payload.js', 'saveFile.js'],
    bundle: true,
    outdir: 'build/',
    plugins: [vuePlugin(),
        copyStaticFiles({
          src: './static',
          dest: './build'
        })],
    loader: {
            '.eot': 'dataurl',
            '.png': 'file',
            '.ttf': 'dataurl',
            '.svg': 'dataurl',
            '.woff': 'dataurl',
            '.woff2': 'dataurl',
        },
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});

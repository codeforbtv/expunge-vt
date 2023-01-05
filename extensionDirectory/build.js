const vuePlugin = require("esbuild-plugin-vue3")
const esbuild = require('esbuild');
const copyStaticFiles = require('esbuild-copy-static-files')

esbuild.build({
    entryPoints: ['index.js'],
    bundle: true,
    outfile: 'build/index.js',
    plugins: [vuePlugin(),
        copyStaticFiles({
          src: './static',
          dest: './build'
        })],
    loader: {
        '.png': 'file'
    },
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});

esbuild.build({
    entryPoints: ['payload.js'],
    bundle: true,
    outfile: 'build/payload.js',
    plugins: [vuePlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});

esbuild.build({
    entryPoints: ['background.js'],
    bundle: true,
    outfile: 'build/background.js',
    //plugins: [vuePlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});

const vuePlugin = require("esbuild-plugin-vue3")
const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['index.js'],
    bundle: true,
    outfile: 'build/index.js',
    plugins: [vuePlugin()],
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


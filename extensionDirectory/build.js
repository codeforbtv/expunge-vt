const vuePlugin = require("esbuild-plugin-vue3")
const esbuild = require('esbuild');
const exec = require('child_process').exec;
const { copyFileSync, cpSync } = require('fs');

esbuild.build({
    entryPoints: ['background.js', 'store.mjs', 'index.js', 'manage-counts.js', 'payload.js', 'filings.js', 'saveFile.js'],
    bundle: true,
    outdir: 'build/',
    plugins: [vuePlugin(),
    {
        name: "postbuild",
        setup(build) {
            build.onEnd((result) => {
                const staticDir = './static';
                const packageJson = './package.json';
                const buildDir = './build/';
                const productionBuild = "npm install --omit=dev";
                cpSync(staticDir, buildDir, {
                    force: true,
                    recursive: true
                });
                copyFileSync(packageJson, buildDir + packageJson);
                exec(productionBuild,
                    {
                        cwd: buildDir
                    })
            })
        }
    }],
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

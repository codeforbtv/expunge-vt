import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import inject from '@rollup/plugin-inject';
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    inject({
        //Remember to add `"jquery": "^3.6.1"` in `dependencies` for `package.json`
        jQuery: "jquery",
        $: "jquery"
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  root: 'src/pages',
  publicDir: '../../public',
  build: {
    rollupOptions: {
      input: {
        popup: './src/pages/popup/index.html',
        filings: './src/pages/filings/index.html',
        counts: './src/pages/manage-counts/index.html',
        disclaimer: './src/pages/disclaimer/index.html'
      }
    },
    outDir: '../../dist',
    minify: false
  },
})

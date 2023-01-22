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
  root: 'src',
  publicDir: '../public',
  build: {
    rollupOptions: {
      input: {
        popup: './src/pages/popup/index.html',
        // filings: './src/filings.html',
        // counts: './src/manage-counts.html',
        // disclaimer: './src/disclaimer.html'
      },
      output: {
        entryFileNames: '[name].html'
      }
    },
    outDir: '../dist',
    minify: false
  },
})

import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: './test/index.js',
      output: {
        dir: 'dist',
        entryFileNames: 'index.js',
      },
    },
  },
})

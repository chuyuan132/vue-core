import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: './test/index.js',
      output: {
        dir: 'dist',
        entryFileNames: 'index.js',
      },
    },
  },
})

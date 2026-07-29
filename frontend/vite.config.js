import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    // This plugin correctly handles client-side routing
    {
      name: 'spa-redirect',
      apply: 'build',
      generateBundle(options, bundle) {
        this.emitFile({
          type: 'asset',
          fileName: '_redirects',
          source: '/* /index.html 200'
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://amazon-global-exports.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  // This is CRUCIAL: it tells Vite your app is served from the root
  base: '/'
})

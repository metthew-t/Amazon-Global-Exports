import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to handle SPA routing
    {
      name: 'spa-redirect',
      apply: 'build',
      generateBundle(options, bundle) {
        // Ensure _redirects file is included in the build
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
    sourcemap: false,
    // Ensure assets are properly handled
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  base: '/'
})

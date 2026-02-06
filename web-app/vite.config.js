import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy les requetes /uploads vers l'API backend
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // Proxy les requetes /api vers l'API backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})

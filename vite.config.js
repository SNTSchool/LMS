import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // ⭐ บังคับใช้ classic runtime (แก้ React is not defined)
      jsxRuntime: 'classic',
    })
  ],

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },

  define: {
    // ป้องกันบาง lib เรียก process.env แล้วพัง
    'process.env': {},
  }
})
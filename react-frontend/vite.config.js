import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  server: {
    host: true, // This allows external connections
    allowedHosts: [
      'localhost',
      'stallion-hip-heavily.ngrok-free.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/complete-onboarding-v4': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/whatsapp-webhooks': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
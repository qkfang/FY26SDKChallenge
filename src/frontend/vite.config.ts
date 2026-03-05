import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    envPrefix: ['VITE_', 'AZURE_', 'API_URL'],
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.API_URL || 'http://localhost:3001',
          changeOrigin: true
        }
      }
    }
  }
})

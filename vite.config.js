import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/belmes/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/v5': {
        target: 'http://172.18.7.91:7777',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v5/, '/api/v5')
      }
    }
  }
})







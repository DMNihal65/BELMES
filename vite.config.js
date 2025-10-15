import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/belmes/', //For the development mode this code must be commented and not required , but should be uncommented in the depoyment mode becasue it is required
  plugins: [react()],
  server: {
    // proxy: {
    //   '/api/v5': {
    //     target: 'http://172.18.7.89:7777',
    //     changeOrigin: true,
    //     secure: false,
    //     rewrite: (path) => path.replace(/^\/api\/v5/, '/api/v5')
    //   },
    //   '/proxy': {
    //     target: 'http://172.18.100.214:8006',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/proxy/, '')
    //   }
    // }
  }
})






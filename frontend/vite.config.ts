import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    proxy: {
      "/auth": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/users": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/movies": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/reviews": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/ratings": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

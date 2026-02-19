import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const target = env.VITE_API_BASE || "http://localhost:4000"
  const shared = {
    target,
    changeOrigin: true,
    secure: false,
    cookieDomainRewrite: "",
  }
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5175,
      strictPort: true,
      proxy: {
        "/auth": shared,
        "/users": shared,
        "/movies": shared,
        "/reviews": shared,
        "/ratings": shared,
        "/media": shared,
      },
    },
  }
})

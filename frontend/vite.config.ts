import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const target = env.VITE_API_BASE || "http://localhost:4000"
  const srcDir = fileURLToPath(new URL('./src', import.meta.url))
  const shared = {
    target,
    changeOrigin: true,
    secure: false,
    cookieDomainRewrite: "",
  }
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@src': srcDir,
        '@api': path.join(srcDir, 'api'),
        '@assets': path.join(srcDir, 'assets'),
        '@components': path.join(srcDir, 'components'),
        '@context': path.join(srcDir, 'context'),
        '@data': path.join(srcDir, 'data'),
        '@hooks': path.join(srcDir, 'hooks'),
        '@lib': path.join(srcDir, 'lib'),
        '@pages': path.join(srcDir, 'pages'),
        '@tests': path.join(srcDir, 'tests'),
      },
    },
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
    test: {
      environment: "jsdom",
      setupFiles: ["./src/tests/setup.ts"],
      include: [
        "src/tests/**/*.test.{js,jsx,ts,tsx}",
        "src/tests/**/*.spec.{js,jsx,ts,tsx}",
      ],
    },
  }
})

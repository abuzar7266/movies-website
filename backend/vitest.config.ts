import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@auth": fileURLToPath(new URL("./src/auth", import.meta.url)),
      "@config": fileURLToPath(new URL("./src/config", import.meta.url)),
      "@docs": fileURLToPath(new URL("./src/docs", import.meta.url)),
      "@dtos": fileURLToPath(new URL("./src/dtos", import.meta.url)),
      "@generated": fileURLToPath(new URL("./src/generated", import.meta.url)),
      "@middleware": fileURLToPath(new URL("./src/middleware", import.meta.url)),
      "@repositories": fileURLToPath(new URL("./src/repositories", import.meta.url)),
      "@routes": fileURLToPath(new URL("./src/routes", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@tools": fileURLToPath(new URL("./src/tools", import.meta.url))
    }
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000
  }
});

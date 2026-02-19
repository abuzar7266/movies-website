import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.spec.ts"],
    testTimeout: 60000,
    hookTimeout: 60000
  }
});

import { defineConfig } from "vitest/config";
import { resolve } from "path";
import os from "node:os";

const TEST_WORKERS = os.cpus().length;

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    globalSetup: ["./src/__tests__/globalSetup.ts"],
    poolOptions: {
      forks: { maxForks: TEST_WORKERS, minForks: 1 },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});

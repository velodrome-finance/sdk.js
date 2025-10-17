import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~test": path.resolve(__dirname, "./test"),
    },
    environment: "node",
    setupFiles: [path.resolve(__dirname, "./test/setup.ts")],
    globalSetup: [path.resolve(__dirname, "./test/globalSetup.ts")],
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~test": path.resolve(__dirname, "./test"),
    },
  },
});

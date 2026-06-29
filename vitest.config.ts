import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    dir: "./tests/unit",
    globals: true,
    setupFiles: ["./tests/vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

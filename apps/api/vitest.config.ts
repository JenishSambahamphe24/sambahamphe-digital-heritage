import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const CONTAINER_STARTUP_TIMEOUT_MS = 120_000;
const TEST_TIMEOUT_MS = 30_000;

export default defineConfig({
  // Vite's default transform drops decorator metadata, which Nest needs for
  // constructor injection; SWC keeps it.
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    hookTimeout: CONTAINER_STARTUP_TIMEOUT_MS,
    testTimeout: TEST_TIMEOUT_MS,
  },
});

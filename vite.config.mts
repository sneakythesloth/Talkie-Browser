import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The renderer is loaded by Electron with loadFile (file://), so asset paths
// must be relative. Output goes to dist/, which electron/main.cjs loads.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "chrome134", // Electron 35 ships Chromium 134
    sourcemap: true
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false
  }
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import polyfillNode from "rollup-plugin-polyfill-node";
import { nodeResolve } from "@rollup/plugin-node-resolve";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), polyfillNode()],
  define: {
    global: "window", // map global -> windo
  },
  resolve: {
    alias: {
      events: "events",
      util: "util",
      stream: "stream-browserify",
      buffer: "buffer",
    },
     mainFields: ["module", "main"], 
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    rollupOptions: {
      plugins: [ nodeResolve(), polyfillNode()],
    },
  },
});

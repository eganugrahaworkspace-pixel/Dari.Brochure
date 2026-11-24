import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    // MapLibre is loaded lazily as its own chunk; keep the warning meaningful for the rest.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        brosur: fileURLToPath(new URL("./brosur.html", import.meta.url)),
      },
    },
  },
  server: { host: true },
  preview: { host: true },
});

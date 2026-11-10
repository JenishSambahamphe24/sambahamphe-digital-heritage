import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: { alias: { "#": new URL("./src", import.meta.url).pathname } },
  server: {
    // Same-origin API (ADR-006), as Caddy does in production: the browser
    // sees one site, so the admin_sid cookie belongs to it.
    proxy: {
      "/api": { target: API_INTERNAL_URL, headers: { "X-Client": "admin" } },
    },
  },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // In local dev the frontend calls a relative `/api/...` path (VITE_API_URL=/api/graduateTracer),
  // the same path the Vercel rewrite uses in production. This proxy forwards it to the local
  // backend so there is no CORS and no port in the frontend code. Override the target with
  // VITE_DEV_API_TARGET if your backend runs on a different port.
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

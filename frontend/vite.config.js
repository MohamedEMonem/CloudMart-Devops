import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config — proxies /api requests to the Express backend
// so we don't hit CORS issues during development
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Any request starting with /api is forwarded to the backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const projectRoot = import.meta.dirname;
const frontendRoot = path.join(projectRoot, "frontend");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: frontendRoot,
  envDir: projectRoot,
  resolve: {
    alias: {
      "@": path.join(frontendRoot, "src"),
    },
  },
  build: {
    outDir: path.join(projectRoot, "dist", "frontend"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: false,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});

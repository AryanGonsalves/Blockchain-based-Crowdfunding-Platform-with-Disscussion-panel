import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/socket': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
  plugins: [react()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  build: {
    rollupOptions: {
      external: [
        `@safe-globalThis/safe-ethers-adapters`,
        `@safe-globalThis/safe-core-sdk`,
        `@safe-globalThis/safe-ethers-lib`
      ]
    }
  }
});
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: "/", // Changed from "./" to "/"
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      "/api": {
        target: "https://checklist-houskeeping.sagartmt.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

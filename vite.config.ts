import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@/core', replacement: path.resolve(__dirname, 'src/components/core') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
})

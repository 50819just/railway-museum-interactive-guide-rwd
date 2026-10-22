import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative URLs work for both GitHub project Pages and local previews.
  base: './',
  plugins: [react()],
})

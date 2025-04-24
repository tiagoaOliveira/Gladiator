import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Gladiator/', // 👈 importante para GitHub Pages
  plugins: [react()],
})

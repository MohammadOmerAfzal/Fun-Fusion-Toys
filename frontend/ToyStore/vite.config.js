import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
  host: true,   // listens on all interfaces (0.0.0.0)
  port: 5173,   // container internal port
}
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    // se você usa variáveis de ambiente, mapeie aqui
    'process.env': {}
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_ECJY_VISUAL_PHASE_1': JSON.stringify(process.env.VITE_ECJY_VISUAL_PHASE_1 === 'true' || process.env.VITE_ECJY_VISUAL_PHASE_1 === '1'),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
  },
})
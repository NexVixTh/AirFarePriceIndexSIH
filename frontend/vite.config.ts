import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/health': 'http://127.0.0.1:5000',
      '/index': 'http://127.0.0.1:5000',
      '/cpi': 'http://127.0.0.1:5000',
      '/fares': 'http://127.0.0.1:5000',
      '/routes': 'http://127.0.0.1:5000',
      '/route-stats': 'http://127.0.0.1:5000',
      '/airline-stats': 'http://127.0.0.1:5000',
      '/multi-window-analysis': 'http://127.0.0.1:5000',
      '/lead-time-elasticity': 'http://127.0.0.1:5000',
      '/data-quality-report': 'http://127.0.0.1:5000',
      '/route-quality': 'http://127.0.0.1:5000',
      '/outlier-detection': 'http://127.0.0.1:5000',
      '/dgca-validation': 'http://127.0.0.1:5000',
      '/dgca-methodology': 'http://127.0.0.1:5000',
      '/priority-routes': 'http://127.0.0.1:5000',
      '/scheduler-stats': 'http://127.0.0.1:5000',
      '/anomalies': 'http://127.0.0.1:5000',
      '/scraper-logs': 'http://127.0.0.1:5000',
    },
  },
})

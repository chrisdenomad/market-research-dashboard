import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Generate .gz sidecar files at build time so a capable server
    // (nginx, Caddy, etc.) can serve them without runtime compression.
    compression({ algorithm: 'gzip', ext: '.gz' }),
    // Brotli gives ~15% smaller files than gzip where supported
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],

  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into their own async chunks.
        // Each chunk is fetched only when first needed, and cached
        // independently by the browser on subsequent visits.
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-recharts'
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'vendor-chartjs'
          }
          if (id.includes('node_modules/@dnd-kit')) {
            return 'vendor-dndkit'
          }
          // xlsx, jspdf, html2canvas are already lazy (dynamic import) so
          // Rollup will auto-split them; we name them explicitly for clarity.
          if (id.includes('node_modules/xlsx')) {
            return 'vendor-xlsx'
          }
          if (id.includes('node_modules/jspdf')) {
            return 'vendor-jspdf'
          }
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-html2canvas'
          }
          // Core React runtime
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize React Fast Refresh
      fastRefresh: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Enable CORS for all origins
    cors: true,
    // Optimize HMR
    hmr: {
      overlay: false, // Disable error overlay for faster feedback
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@xyflow') || id.includes('reactflow')) {
              return 'flow-vendor';
            }
            if (id.includes('zustand')) {
              return 'state-vendor';
            }
            if (id.includes('three') || id.includes('@paper-design')) {
              return 'graphics-vendor';
            }
            if (id.includes('lucide')) {
              return 'icons-vendor';
            }
          }
        },
        // Optimize asset file names for caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Enable minification with esbuild (fastest)
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Reduce bundle size
    reportCompressedSize: false,
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'reactflow',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
    ],
    // Exclude large dependencies that don't need pre-bundling
    exclude: ['@paper-design/shaders-react'],
  },
  // CSS optimizations
  css: {
    devSourcemap: false,
    // PostCSS optimizations handled by tailwind
  },
  // Reduce memory usage
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})

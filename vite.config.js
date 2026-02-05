import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Load environment variables
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd());

export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor';
          }
          
          // Feature chunks
          if (id.includes('ReconstructionViewer')) {
            return '3d-viewer';
          }
          if (id.includes('CameraCapture')) {
            return 'camera';
          }
          if (id.includes('PuzzleBoard')) {
            return 'puzzle';
          }
          if (id.includes('FragmentGrid')) {
            return 'gallery';
          }
          
          // Page chunks
          if (id.includes('HomePage') || id.includes('capturePage') || id.includes('Reconstruct') || 
              id.includes('GalleryPage') || id.includes('Puzzle') || id.includes('AboutPage')) {
            return 'pages';
          }
        }
      }
    },
    
    // Bundle optimization
    minify: false,
    sourcemap: false,
    target: 'esnext',
    
    // Asset optimization
    assetsInlineLimit: 4096,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true
  },
  
  // Development optimizations
  server: {
    hmr: {
      overlay: false
    }
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // Environment variables
  define: {
    // App info
    __APP_VERSION__: JSON.stringify(env.npm_package_version || '1.0.0'),
    __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'ARCHIA'),
    __APP_DESCRIPTION__: JSON.stringify(env.VITE_APP_DESCRIPTION || 'Archaeological Pottery Reconstruction AI'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    
    // Environment
    __NODE_ENV__: JSON.stringify(env.NODE_ENV || 'development'),
    __DEV__: JSON.stringify(env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(env.NODE_ENV === 'production'),
    
    // Feature flags
    __ENABLE_ANALYTICS__: env.VITE_ENABLE_ANALYTICS === 'true',
    __ENABLE_SENTRY__: env.VITE_ENABLE_SENTRY === 'true',
    __ENABLE_3D_VIEWER__: env.VITE_ENABLE_3D_VIEWER !== 'false',
    __ENABLE_CAMERA__: env.VITE_ENABLE_CAMERA !== 'false',
    __ENABLE_PUZZLE__: env.VITE_ENABLE_PUZZLE !== 'false',
    __ENABLE_GALLERY__: env.VITE_ENABLE_GALLERY !== 'false',
    
    // API endpoints
    __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:3001'),
    __CDN_URL__: JSON.stringify(env.VITE_CDN_URL || 'http://localhost:3001'),
    
    // Sentry configuration
    __SENTRY_DSN__: JSON.stringify(env.VITE_SENTRY_DSN || ''),
    
    // Debug settings
    __DEBUG_MODE__: JSON.stringify(env.VITE_DEBUG_MODE || 'false'),
    __LOG_LEVEL__: JSON.stringify(env.VITE_LOG_LEVEL || 'error')
  }
});

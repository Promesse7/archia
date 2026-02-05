import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          
          // Feature chunks
          '3d-viewer': ['./src/components/features/reconstruction/ReconstructionViewer.jsx'],
          camera: ['./src/components/features/camera/CameraCapture.jsx'],
          puzzle: ['./src/components/features/puzzle/PuzzleBoard.jsx'],
          gallery: ['./src/components/features/gallery/FragmentGrid.jsx'],
          
          // Page chunks
          pages: [
            './src/pages/HomePage.jsx',
            './src/pages/capturePage.jsx', 
            './src/pages/Reconstruct.jsx',
            './src/pages/GalleryPage.jsx',
            './src/pages/Puzzle.jsx',
            './src/pages/AboutPage.jsx'
          ]
        }
      }
    },
    
    // Bundle optimization
    minify: 'terser',
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
    __APP_VERSION__: JSON.stringify(loadEnv().npm_package_version || '1.0.0'),
    __APP_TITLE__: JSON.stringify(loadEnv().VITE_APP_TITLE || 'ARCHIA'),
    __APP_DESCRIPTION__: JSON.stringify(loadEnv().VITE_APP_DESCRIPTION || 'Archaeological Pottery Reconstruction AI'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    
    // Environment
    __NODE_ENV__: JSON.stringify(loadEnv().NODE_ENV || 'development'),
    __DEV__: JSON.stringify(loadEnv().NODE_ENV === 'development'),
    __PROD__: JSON.stringify(loadEnv().NODE_ENV === 'production'),
    
    // Feature flags
    __ENABLE_ANALYTICS__: loadEnv().VITE_ENABLE_ANALYTICS === 'true',
    __ENABLE_SENTRY__: loadEnv().VITE_ENABLE_SENTRY === 'true',
    __ENABLE_3D_VIEWER__: loadEnv().VITE_ENABLE_3D_VIEWER !== 'false',
    __ENABLE_CAMERA__: loadEnv().VITE_ENABLE_CAMERA !== 'false',
    __ENABLE_PUZZLE__: loadEnv().VITE_ENABLE_PUZZLE !== 'false',
    __ENABLE_GALLERY__: loadEnv().VITE_ENABLE_GALLERY !== 'false',
    
    // API endpoints
    __API_BASE_URL__: JSON.stringify(loadEnv().VITE_API_BASE_URL || 'http://localhost:3001'),
    __CDN_URL__: JSON.stringify(loadEnv().VITE_CDN_URL || 'http://localhost:3001'),
    
    // Sentry configuration
    __SENTRY_DSN__: JSON.stringify(loadEnv().VITE_SENTRY_DSN || ''),
    
    // Debug settings
    __DEBUG_MODE__: JSON.stringify(loadEnv().VITE_DEBUG_MODE || 'false'),
    __LOG_LEVEL__: JSON.stringify(loadEnv().VITE_LOG_LEVEL || 'error')
  }
});

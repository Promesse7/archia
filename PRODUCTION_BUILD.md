# ARCHIA Production Build Configuration

## 🚀 Build Optimizations

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
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
          'camera': ['./src/components/features/camera/CameraCapture.jsx'],
          'puzzle': ['./src/components/features/puzzle/PuzzleBoard.jsx'],
          'gallery': ['./src/components/features/gallery/FragmentGrid.jsx'],
          
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
    sourcemap: true,
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
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __NODE_ENV__: JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:analyze": "vite build --mode production && npx vite-bundle-analyzer dist/stats.html",
    "preview": "vite preview",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx --fix",
    "lint:check": "eslint src --ext .js,.jsx,.ts,.tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "size-check": "npm run build && npx bundlesize",
    "optimize": "npm run lint && npm run type-check && npm run build",
    "deploy: "npm run optimize && npm run build:analyze"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "vite": "^6.0.0",
    "vite-bundle-analyzer": "^4.9.0",
    "bundlesize": "^0.18.1",
    "eslint": "^9.39.1",
    "@typescript-eslint/eslint-plugin": "^7.3.1",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-refresh": "^0.4.6",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5",
    "@vitest/ui": "^2.0.5",
    "@vitest/coverage-v8": "^2.0.5"
  }
}
```

### Environment Configuration
```bash
# .env.production
NODE_ENV=production
VITE_APP_TITLE=ARCHIA
VITE_APP_DESCRIPTION=Archaeological Pottery Reconstruction AI
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=true
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_API_BASE_URL=https://api.archia.ai
VITE_CDN_URL=https://cdn.archia.ai
```

### Tree Shaking Configuration
```javascript
// Ensure only used code is included
export const features = {
  '3d-viewer': () => import('./components/features/reconstruction/ReconstructionViewer'),
  'camera': () => import('./components/features/camera/CameraCapture'),
  'puzzle': () => import('./components/features/puzzle/PuzzleBoard'),
  'gallery': () => import('./components/features/gallery/FragmentGrid')
};
```

### Service Worker for Caching
```javascript
// public/sw.js
const CACHE_NAME = 'archia-v1';
const STATIC_CACHE = 'archia-static-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## 📊 Bundle Analysis

### Expected Bundle Sizes
- **Main Bundle**: ~150KB (gzipped)
- **3D Viewer**: ~80KB (gzipped, lazy loaded)
- **Camera**: ~60KB (gzipped, lazy loaded)
- **Puzzle**: ~40KB (gzipped, lazy loaded)
- **Gallery**: ~50KB (gzipped, lazy loaded)
- **Vendor**: ~300KB (gzipped, React, Three.js)
- **Total Initial Load**: ~200KB (gzipped)

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 500KB per chunk

## 🔧 Optimization Techniques

### Code Splitting Strategy
1. **Route-based splitting**: Each page is a separate chunk
2. **Feature-based splitting**: Heavy components are lazy loaded
3. **Vendor splitting**: Third-party libraries in separate chunks
4. **Dynamic imports**: Load features only when needed

### Asset Optimization
1. **Image compression**: WebP format with fallbacks
2. **Font optimization**: Subset fonts, woff2 format
3. **Icon optimization**: SVG sprites or icon fonts
4. **Lazy loading**: Images loaded on scroll/intersection

### Runtime Optimization
1. **Tree shaking**: Remove unused code
2. **Minification**: Terser optimization
3. **Gzip compression**: Server-side compression
4. **Browser caching**: Service worker for static assets

## 🚀 Deployment Strategy

### Build Process
```bash
# 1. Install dependencies
npm ci

# 2. Run tests
npm run test

# 3. Type checking
npm run type-check

# 4. Linting
npm run lint:check

# 5. Build for production
npm run build

# 6. Analyze bundle size
npm run build:analyze

# 7. Deploy to production
npm run deploy
```

### Environment Variables
- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: Optimized build with analytics

### Monitoring
- **Bundle analyzer**: Track bundle sizes over time
- **Performance monitoring**: Web Vitals integration
- **Error tracking**: Sentry integration
- **Analytics**: User behavior and performance metrics

## 📋 Pre-deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings fixed
- [ ] No console.log statements in production
- [ ] All features tested
- [ ] Bundle size under limits
- [ ] Performance budgets met

### Security
- [ ] Dependencies audited for vulnerabilities
- [ ] No hardcoded secrets in build
- [ ] CSP headers configured
- [ ] Service worker security reviewed

### Performance
- [ ] Bundle analysis completed
- [ ] Lazy loading implemented
- [ ] Images optimized
- [ ] Caching strategy in place
- [ ] Performance budgets met

### Accessibility
- [ ] Screen reader testing completed
- [ ] Keyboard navigation tested
- [ ] Color contrast verified
- [ ] Focus management implemented
- [ ] ARIA labels added

### Deployment
- [ ] Production build tested locally
- [ ] Environment variables configured
- [ ] CDN configuration ready
- [ ] Rollback plan prepared
- [ ] Monitoring tools configured

This configuration ensures ARCHIA performs optimally in production with fast load times, small bundle sizes, and excellent user experience.

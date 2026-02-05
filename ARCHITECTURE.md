# ARCHIA Production-Grade Component Architecture

## 📁 Directory Structure

```
src/
├── components/
│   ├── ui/                    # UI Primitives (no business logic)
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── StatusPill.jsx
│   │   ├── SectionHeader.jsx
│   │   ├── IconButton.jsx
│   │   └── index.js
│   ├── layout/                 # Layout components (structure only)
│   │   ├── Screen.jsx
│   │   ├── Section.jsx
│   │   ├── Panel.jsx
│   │   └── index.js
│   ├── features/               # Feature components (domain logic)
│   │   ├── camera/
│   │   │   ├── CameraCapture.jsx
│   │   │   ├── CameraControls.jsx
│   │   │   └── index.js
│   │   ├── gallery/
│   │   │   ├── FragmentCard.jsx
│   │   │   ├── FragmentGrid.jsx
│   │   │   └── index.js
│   │   ├── puzzle/
│   │   │   ├── PuzzleBoard.jsx
│   │   │   ├── PuzzleControls.jsx
│   │   │   └── index.js
│   │   ├── reconstruction/
│   │   │   ├── ReconstructionViewer.jsx
│   │   │   ├── ViewerControls.jsx
│   │   │   └── index.js
│   │   └── index.js
│   └── index.js              # Main component exports
├── pages/                     # Pages (composition + routing only)
├── hooks/                     # Custom React hooks
│   ├── useAnimation.ts
│   ├── usePerformance.ts
│   └── index.js
├── utils/                      # Utility functions
│   ├── cn.ts
│   ├── animations.ts
│   ├── validation.ts
│   └── index.js
├── constants/                  # Application constants
│   └── index.ts
└── styles/                     # Global styles
    ├── animations.css
    └── index.css
```

## 🎯 Component Responsibilities

### UI Primitives (`/components/ui/`)
- **No business logic**
- **Pure presentational components**
- **Consistent styling and behavior**
- **Reusable across features**

### Layout Components (`/components/layout/`)
- **Structure only**
- **No domain logic**
- **Consistent spacing and layout**
- **Responsive design patterns**

### Feature Components (`/components/features/`)
- **Own their domain logic**
- **Self-contained state management**
- **Feature-specific interactions**
- **No direct navigation touches**

### Pages (`/pages/`)
- **Composition of feature components**
- **Routing logic only**
- **No business logic**
- **Data flow orchestration**

## 🔧 Code Quality Standards

### Naming Conventions
- **Components**: PascalCase (`CameraCapture`, `FragmentCard`)
- **Functions**: camelCase (`handleFragmentSelect`, `isValidEmail`)
- **Constants**: UPPER_SNAKE_CASE (`ANIMATION_DURATIONS`, `API_ENDPOINTS`)
- **Files**: PascalCase for components (`CameraCapture.jsx`)

### Performance Optimizations
- **React.memo** for pure components
- **useCallback** for event handlers
- **useMemo** for expensive calculations
- **Lazy loading** for heavy components
- **Debounce/Throttle** for rapid interactions

### Validation & Type Safety
- **TypeScript interfaces** for all props
- **Runtime validation** for user input
- **Type guards** for type narrowing
- **Error boundaries** for graceful failures

## 📦 Dependencies

### Production Dependencies
```json
{
  "clsx": "^2.1.1",           // Utility for conditional classes
  "tailwind-merge": "^3.4.0",   // Merge Tailwind classes
  "lucide-react": "^0.562.0",   // Icon library
  "react": "^19.2.0",           // UI library
  "react-dom": "^19.2.0",        // DOM renderer
  "three": "^0.182.0",           // 3D graphics
  "@tensorflow/tfjs": "^4.22.0",   // Machine learning
  "@react-three/drei": "^10.7.7", // React Three.js helpers
  "@tensorflow-models/mobilenet": "^2.1.1", // Image classification
  "@tensorflow-models/depth-estimation": "^0.0.4", // Depth estimation
  "poisson-disk-sampling": "^2.3.1", // Point cloud processing
  "three-mesh-bvh": "^0.9.8"    // 3D mesh optimization
}
```

## 🎨 Animation System

### Consistent Timing
- **Fast**: 150ms (button presses, status changes)
- **Normal**: 200ms (hover effects, navigation)
- **Slow**: 300ms (page transitions, cards)
- **Slower**: 400ms (complex animations)

### GPU Acceleration
- **Transform and opacity only**
- **will-change properties** used sparingly
- **Automatic cleanup** after animations
- **Reduced motion support** for accessibility

## 🔄 State Management

### Local State
- **useState** for component state
- **useReducer** for complex state logic
- **Context** for app-wide state
- **Custom hooks** for reusable logic

### Data Flow
- **Props down** (parent → child)
- **Events up** (child → parent)
- **No direct navigation** in feature components
- **Clear separation** of concerns

## 🛡️ Error Handling

### Validation
- **Input validation** at component boundaries
- **Type checking** with TypeScript
- **Runtime guards** for safety
- **User-friendly error messages**

### Error Boundaries
- **Graceful degradation** on errors
- **Error reporting** for debugging
- **Fallback UI** for failures
- **Recovery mechanisms** where possible

## 📱 Responsive Design

### Breakpoints
- **SM**: 640px (mobile)
- **MD**: 768px (tablet)
- **LG**: 1024px (desktop)
- **XL**: 1280px (large desktop)

### Adaptive Layouts
- **Grid systems** for responsive content
- **Flexible components** for different screen sizes
- **Touch-friendly** interactions on mobile
- **Keyboard navigation** support

## 🔍 Testing Strategy

### Component Testing
- **Unit tests** for pure functions
- **Integration tests** for component interactions
- **Visual regression** for UI consistency
- **Accessibility testing** for screen readers

### Performance Testing
- **Render performance** monitoring
- **Memory leak** detection
- **Bundle size** optimization
- **Load time** measurement

## 🚀 Build & Deployment

### Development
```bash
npm run dev          # Development server
npm run lint         # Code linting
npm run preview      # Production preview
```

### Production
```bash
npm run build        # Production build
```

### Code Quality
- **ESLint** for code standards
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Git hooks** for pre-commit checks

## 📋 Migration Checklist

### ✅ Completed
- [x] Layout components created
- [x] Feature components refactored
- [x] UI primitives enhanced
- [x] Animation system implemented
- [x] Performance hooks added
- [x] Validation utilities created
- [x] Constants extracted
- [x] Dependencies optimized

### 🔄 In Progress
- [ ] Pages refactored to use new components
- [ ] Legacy components deprecated
- [ ] Error boundaries implemented
- [ ] Testing suite added

### 📋 Next Steps
- [ ] Implement comprehensive error handling
- [ ] Add accessibility testing
- [ ] Optimize bundle size
- [ ] Add performance monitoring
- [ ] Create documentation site

## 🎯 Benefits

### Maintainability
- **Clear separation** of concerns
- **Reusable components** across features
- **Consistent patterns** throughout app
- **Easy to understand** file structure

### Performance
- **Optimized rendering** with React.memo
- **Efficient animations** with GPU acceleration
- **Lazy loading** for heavy components
- **Debounced interactions** for responsiveness

### Developer Experience
- **Type safety** with TypeScript
- **Hot reloading** in development
- **Clear error messages** for debugging
- **Consistent naming** conventions

### Scalability
- **Modular architecture** for growth
- **Feature-based organization**
- **Reusable utilities** and hooks
- **Easy to add** new features

This architecture provides a solid foundation for a production-grade application with clear separation of concerns, excellent performance, and maintainable code structure.

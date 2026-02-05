// Animation utilities for ARCHIA
// Consistent, performant, and intentional animations

// Animation duration constants
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 400
} as const;

// Animation easing functions
export const ANIMATION_EASING = {
  // Standard easing curves
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  cubicBezier: 'cubic-bezier(0.4, 0, 0.2, 1)',
  cubicBezierInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Specialized easing
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
  gentle: 'cubic-bezier(0.23, 1, 0.32, 1)'
} as const;

// Tailwind animation classes
export const TRANSITION_CLASSES = {
  // Fast transitions (150ms)
  fast: `transition-all duration-[150ms] ${ANIMATION_EASING.snappy}`,
  
  // Normal transitions (200ms)
  normal: `transition-all duration-[200ms] ${ANIMATION_EASING.smooth}`,
  
  // Slow transitions (300ms)
  slow: `transition-all duration-[300ms] ${ANIMATION_EASING.cubicBezier}`,
  
  // Slower transitions (400ms)
  slower: `transition-all duration-[400ms] ${ANIMATION_EASING.cubicBezierInOut}`,
  
  // Color-only transitions
  color: `transition-colors duration-[200ms] ${ANIMATION_EASING.smooth}`,
  
  // Transform-only transitions
  transform: `transition-transform duration-[200ms] ${ANIMATION_EASING.snappy}`,
  
  // Opacity-only transitions
  opacity: `transition-opacity duration-[150ms] ${ANIMATION_EASING.easeOut}`
} as const;

// Component-specific animation classes
export const COMPONENT_ANIMATIONS = {
  // Button animations
  button: {
    base: TRANSITION_CLASSES.fast,
    hover: 'hover:scale-[0.97] active:scale-[0.95]',
    disabled: 'disabled:scale-100 disabled:opacity-50'
  },
  
  // Card animations
  card: {
    base: TRANSITION_CLASSES.normal,
    hover: 'hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-900/20',
    focus: 'focus:ring-2 focus:ring-amber-500/50'
  },
  
  // Navigation animations
  nav: {
    base: TRANSITION_CLASSES.color,
    active: 'text-amber-400',
    inactive: 'text-zinc-400 hover:text-zinc-300'
  },
  
  // Status animations
  status: {
    base: TRANSITION_CLASSES.opacity,
    change: 'duration-[150ms]'
  },
  
  // Progress animations
  progress: {
    base: 'transition-all duration-[300ms] ease-out',
    fill: 'transition-all duration-[500ms] ease-out'
  },
  
  // Loading animations
  loading: {
    spinner: 'animate-spin',
    pulse: 'animate-pulse',
    fade: 'animate-fade-in'
  }
} as const;

// Animation utility functions
export const createAnimationClass = (
  properties: string[],
  duration: keyof typeof ANIMATION_DURATIONS = 'normal',
  easing: keyof typeof ANIMATION_EASING = 'smooth'
) => {
  const durationMs = ANIMATION_DURATIONS[duration];
  const easingFn = ANIMATION_EASING[easing];
  
  return `transition-${properties.join('-')} duration-[${durationMs}ms] ${easingFn}`;
};

// Performance optimization utilities
export const GPU_ACCELERATED_PROPERTIES = [
  'transform',
  'opacity',
  'translate',
  'scale',
  'rotate'
] as const;

export const shouldUseWillChange = (properties: string[]) => {
  return properties.some(prop => 
    GPU_ACCELERATED_PROPERTIES.some(gpuProp => 
      prop.includes(gpuProp)
    )
  );
};

// Animation hooks
export const useAnimationState = (initialState: string) => {
  const [state, setState] = React.useState(initialState);
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  const animateTo = React.useCallback((newState: string) => {
    setIsAnimating(true);
    setState(newState);
    
    // Auto-clear animation state after duration
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_DURATIONS.normal);
    
    return () => clearTimeout(timer);
  }, []);
  
  return { state, isAnimating, animateTo, setState };
};

// Animation component for consistent transitions
export const AnimatedTransition = ({ 
  children, 
  show, 
  duration = 'normal',
  easing = 'smooth',
  className = ''
}: {
  children: React.ReactNode;
  show: boolean;
  duration?: keyof typeof ANIMATION_DURATIONS;
  easing?: keyof typeof ANIMATION_EASING;
  className?: string;
}) => {
  const durationMs = ANIMATION_DURATIONS[duration];
  const easingFn = ANIMATION_EASING[easing];
  
  return (
    <div
      className={className}
      style={{
        transition: `opacity ${durationMs}ms ${easingFn}, transform ${durationMs}ms ${easingFn}`,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(-8px)',
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
};

// Performance monitoring
export const AnimationPerformanceMonitor = {
  // Check if animations are causing performance issues
  checkPerformance: () => {
    const elements = document.querySelectorAll('[style*="transition"]');
    console.log(`Animated elements: ${elements.length}`);
    
    // Check for layout thrashing
    const startTime = performance.now();
    elements.forEach(el => {
      const rect = (el as HTMLElement).getBoundingClientRect();
    });
    const endTime = performance.now();
    
    if (endTime - startTime > 16) {
      console.warn('Animation performance issue detected - layout thrashing');
    }
  },
  
  // Optimize animations by removing will-change after animation
  cleanupWillChange: (element: HTMLElement) => {
    setTimeout(() => {
      element.style.willChange = 'auto';
    }, ANIMATION_DURATIONS.slower);
  }
};

// CSS custom properties for animations
export const CSS_ANIMATION_VARS = `
  :root {
    --animation-duration-fast: 150ms;
    --animation-duration-normal: 200ms;
    --animation-duration-slow: 300ms;
    --animation-duration-slower: 400ms;
    
    --animation-easing-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --animation-easing-snappy: cubic-bezier(0.4, 0, 0.2, 1);
    --animation-easing-gentle: cubic-bezier(0.23, 1, 0.32, 1);
  }
`;

export default {
  ANIMATION_DURATIONS,
  ANIMATION_EASING,
  TRANSITION_CLASSES,
  COMPONENT_ANIMATIONS,
  createAnimationClass,
  GPU_ACCELERATED_PROPERTIES,
  shouldUseWillChange,
  useAnimationState,
  AnimatedTransition,
  AnimationPerformanceMonitor,
  CSS_ANIMATION_VARS
};

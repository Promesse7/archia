import { useEffect, useRef, useState, useCallback } from 'react';

// Animation duration constants
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 400
} as const;

// Animation utilities
export const useAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = useCallback((duration: number = ANIMATION_DURATIONS.normal) => {
    setIsAnimating(true);
    
    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // Auto-clear animation state
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setIsAnimating(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return { isAnimating, startAnimation, stopAnimation };
};

// GPU-accelerated animation hook
export const useGPUAnimation = (properties: string[] = ['transform', 'opacity']) => {
  const elementRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (elementRef.current) {
      // Set will-change for GPU acceleration
      elementRef.current.style.willChange = properties.join(', ');
      
      // Clean up will-change after animation
      const cleanup = () => {
        if (elementRef.current) {
          elementRef.current.style.willChange = 'auto';
        }
      };
      
      // Auto-cleanup after longest animation
      const cleanupTimeout = setTimeout(cleanup, ANIMATION_DURATIONS.slower);
      
      return () => {
        clearTimeout(cleanupTimeout);
        cleanup();
      };
    }
  }, [properties]);

  return elementRef;
};

// Staggered animation hook for lists
export const useStaggeredAnimation = (itemCount: number, delay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    // Stagger item visibility
    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => new Set(prev).add(i));
      }, i * delay);
      
      timeouts.push(timeout);
    }
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [itemCount, delay]);

  return visibleItems;
};

// Performance monitoring hook
export const useAnimationPerformance = () => {
  const frameCount = useRef(0);
  const startTime = useRef<number>(0);
  const rafId = useRef<number | null>(null);

  const startPerformanceTest = useCallback(() => {
    frameCount.current = 0;
    startTime.current = performance.now();
    
    const measure = () => {
      frameCount.current++;
      rafId.current = requestAnimationFrame(measure);
    };
    
    rafId.current = requestAnimationFrame(measure);
  }, []);

  const stopPerformanceTest = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    const fps = (frameCount.current / duration) * 1000;
    
    return {
      frameCount: frameCount.current,
      duration,
      fps,
      isOptimal: fps >= 55 // 55fps is considered good performance
    };
  }, []);

  return { startPerformanceTest, stopPerformanceTest };
};

// Intersection Observer for lazy animations
export const useIntersectionAnimation = (
  threshold: number = 0.1,
  rootMargin: string = '0px'
) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return { isVisible, elementRef };
};

// Spring animation hook for physics-based animations
export const useSpringAnimation = (
  config: { tension?: number; friction?: number } = {}
) => {
  const { tension = 280, friction = 60 } = config;
  
  const spring = useCallback((from: number, to: number, duration: number = ANIMATION_DURATIONS.normal) => {
    // Simplified spring physics
    const velocity = 0;
    const displacement = to - from;
    const steps = Math.floor(duration / 16); // 60fps
    
    const animation = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Spring easing function
      const easeOut = 1 - Math.exp(-tension * t / steps);
      const position = from + displacement * easeOut;
      animation.push(position);
    }
    
    return animation;
  }, [tension, friction]);

  return { spring };
};

// Debounced animation hook
export const useDebouncedAnimation = (delay: number = ANIMATION_DURATIONS.normal) => {
  const [debouncedValue, setDebouncedValue] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSet = useCallback((value: any) => {
    setDebouncedValue(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedValue, debouncedSet };
};

export default {
  useAnimation,
  useGPUAnimation,
  useStaggeredAnimation,
  useAnimationPerformance,
  useIntersectionAnimation,
  useSpringAnimation,
  useDebouncedAnimation,
  ANIMATION_DURATIONS
};

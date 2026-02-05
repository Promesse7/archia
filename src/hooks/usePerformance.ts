import { useCallback, useRef, useEffect, useMemo } from 'react';
import { ANIMATION_DURATIONS } from '../constants';

// Debounce hook for rapid interactions
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = ANIMATION_DURATIONS.NORMAL
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

// Throttle hook for performance
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = ANIMATION_DURATIONS.FAST
): T => {
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
};

// Memoize expensive calculations
export const useExpensiveMemo = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

// Intersection Observer for lazy loading
export const useLazyLoad = (
  threshold: number = 0.1,
  rootMargin: string = '50px'
) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return { isVisible, elementRef };
};

// Performance monitoring
export const usePerformanceMonitor = () => {
  const frameCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>();

  const startMonitoring = useCallback(() => {
    frameCountRef.current = 0;
    startTimeRef.current = performance.now();
    
    const measure = () => {
      frameCountRef.current++;
      rafIdRef.current = requestAnimationFrame(measure);
    };
    
    rafIdRef.current = requestAnimationFrame(measure);
  }, []);

  const stopMonitoring = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    const fps = (frameCountRef.current / duration) * 1000;
    
    return {
      frameCount: frameCountRef.current,
      duration,
      fps,
      isOptimal: fps >= 55
    };
  }, []);

  return { startMonitoring, stopMonitoring };
};

// Resize observer for responsive components
export const useResizeObserver = (callback: (entries: ResizeObserverEntry[]) => void) => {
  const elementRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver(callback);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback]);

  return elementRef;
};

// Memory leak prevention
export const useCleanup = (cleanup: () => void) => {
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
};

// Optimized event handler
export const useOptimizedHandler = <T extends Event>(
  handler: (event: T) => void,
  options?: AddEventListenerOptions
) => {
  const handlerRef = useRef(handler);
  
  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Return optimized handler
  return useCallback((event: T) => {
    handlerRef.current(event);
  }, []) as (event: T) => void;
};

export default {
  useDebounce,
  useThrottle,
  useExpensiveMemo,
  useLazyLoad,
  usePerformanceMonitor,
  useResizeObserver,
  useCleanup,
  useOptimizedHandler
};

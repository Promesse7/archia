import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';

/**
 * @typedef {Object} OptimizedImageProps
 * @property {string} src
 * @property {string} alt
 * @property {string} [className]
 * @property {number|string} [width]
 * @property {number|string} [height]
 * @property {'lazy'|'eager'} [loading]
 * @property {string} [sizes]
 * @property {string} [srcSet]
 * @property {() => void} [onLoad]
 * @property {() => void} [onError]
 * @property {string} [placeholder]
 */

export const OptimizedImage = React.forwardRef(
  ({ 
    src, 
    alt, 
    className, 
    width, 
    height, 
    loading = 'lazy',
    sizes,
    srcSet,
    onLoad,
    onError,
    placeholder
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(loading === 'eager');
    const imgRef = useRef<HTMLImageElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (loading !== 'lazy' || isLoaded) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: '50px' }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [loading, isLoaded]);

    // Combine refs
    const combinedRef = useCallback((node) => {
      imgRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoaded(false);
      onError?.();
    }, [onError]);

    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* Loading placeholder */}
        {!isLoaded && !hasError && placeholder && (
          <div 
            className="absolute inset-0 bg-zinc-800 flex items-center justify-center"
            style={{ 
              backgroundImage: `linear-gradient(45deg, #27272a 25%, transparent 50%, #27272a 75%)`,
              backgroundSize: '20px 20px',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-transparent rounded-full animate-pulse" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-red-400 text-4xl">⚠️</div>
              <p className="text-zinc-400 text-sm">Failed to load image</p>
            </div>
          </div>
        )}

        {/* Actual image */}
        <img
          ref={combinedRef}
          src={isInView ? src : undefined}
          srcSet={isInView ? srcSet : undefined}
          sizes={isInView ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            hasError ? 'hidden' : ''
          )}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
        />
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

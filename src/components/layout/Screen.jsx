import React from 'react';
import { cn } from '../../utils/cn';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-8xl',
  '3xl': 'max-w-10xl',
  '4xl': 'max-w-12xl',
  '5xl': 'max-w-16xl',
  'full': 'max-w-full'
};

export const Screen = React.forwardRef<HTMLDivElement, ScreenProps>(
  ({ children, className, maxWidth = '6xl', ...props }, ref) => {
    const maxWidthClass = maxWidthClasses[maxWidth];
    
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen w-full px-6 py-8 sm:px-8 sm:py-12',
          maxWidthClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Screen.displayName = 'Screen';

export { Screen };

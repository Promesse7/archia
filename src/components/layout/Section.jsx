import React from 'react';
import { cn } from '../../utils/cn';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingClasses = {
  none: '',
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-8',
  xl: 'py-10'
};

export const Section = React.forwardRef < HTMLDivElement, SectionProps> (
  ({ children, className, title, subtitle, action, padding = 'md', ...props }, ref) => {
    const paddingClass = paddingClasses[padding];

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-6 overflow-hidden',
          paddingClass,
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="space-y-2">
            {title && (
              <h2 className="text-2xl font-bold text-white leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-zinc-400 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {action && (
          <div className="flex items-center justify-end">
            {action}
          </div>
        )}

        {children}
      </div>
    );
  });

Section.displayName = 'Section';

export { Section };

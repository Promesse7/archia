import React from 'react';
import { cn } from '../../utils/cn';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'sidebar' | 'card' | 'glass';
}

const variantClasses = {
  default: 'bg-zinc-900/50 border border-zinc-800/50',
  sidebar: 'bg-zinc-900/80 border border-zinc-700/50',
  card: 'bg-zinc-800/50 border border-zinc-700/50',
  glass: 'bg-zinc-900/30 backdrop-blur-sm border border-zinc-700/30'
};

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
  const variantClass = variantClasses[variant] || variantClasses.default;
  
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg',
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Panel.displayName = 'Panel';

export { Panel };

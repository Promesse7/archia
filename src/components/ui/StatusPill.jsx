import React from 'react';
import { Badge } from './Badge';

const StatusPill = React.forwardRef(({ status, message, className, ...props }, ref) => {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'idle':
        return 'neutral';
      case 'loading':
        return 'warning';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const variant = getStatusVariant(status);
  const isLoading = status === 'loading';

  return (
    <Badge
      ref={ref}
      variant={variant}
      className={`
        flex items-center gap-2
        transition-all duration-[150ms] ease-out
        ${isLoading ? 'animate-pulse' : ''}
        ${className}
      `}
      {...props}
    >
      <div className={`
        w-2 h-2 rounded-full
        transition-all duration-[150ms] ease-out
        ${isLoading ? 'bg-amber-400 animate-ping' : ''}
        ${status === 'success' ? 'bg-green-400' : ''}
        ${status === 'error' ? 'bg-red-400' : ''}
        ${status === 'idle' ? 'bg-zinc-400' : ''}
      `} />
      
      <span className="transition-opacity duration-[150ms] ease-out">
        {message || status}
      </span>
    </Badge>
  );
});

StatusPill.displayName = 'StatusPill';

// Export all components
export { StatusPill };

// Default export for backward compatibility
export default StatusPill;

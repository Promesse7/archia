import React from 'react';

const badgeVariants = {
  neutral: 'bg-zinc-700 text-zinc-200 border border-zinc-600',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs font-medium',
  md: 'px-2.5 py-1 text-sm font-medium',
  lg: 'px-3 py-1.5 text-base font-medium',
};

const Badge = React.forwardRef(({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}, ref) => {
  const variantClass = badgeVariants[variant] || badgeVariants.neutral;
  const sizeClass = badgeSizes[size] || badgeSizes.md;

  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center justify-center rounded-full border font-medium overflow-hidden
        transition-all duration-[200ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-zinc-900
        ${variantClass} ${sizeClass} ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

// Export all components
export { Badge, badgeVariants };

// Default export for backward compatibility
export default Badge;

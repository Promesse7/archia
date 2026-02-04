import React from 'react';

const badgeVariants = {
  variant: {
    neutral: 'bg-surface2 text-ink border border-border',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  size: {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }
};

const Badge = React.forwardRef(({ 
  className, 
  variant = 'neutral', 
  size = 'md', 
  children, 
  ...props 
}, ref) => {
  const variantClass = badgeVariants.variant[variant] || badgeVariants.variant.neutral;
  const sizeClass = badgeVariants.size[size] || badgeVariants.size.md;

  return (
    <div
      ref={ref}
      className={`
        inline-flex items-center rounded-full border font-medium
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1
        ${variantClass} ${sizeClass} ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Badge.displayName = 'Badge';

export { Badge, badgeVariants };

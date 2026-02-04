import React from 'react';

const iconButtonVariants = {
  variant: {
    primary: 'bg-accent text-white hover:bg-accentHover active:bg-accentActive disabled:bg-accent/50 disabled:text-white/70',
    secondary: 'bg-surface text-ink border border-border hover:bg-surface2 active:bg-surface3 disabled:bg-surface/50 disabled:text-muted',
    ghost: 'bg-transparent text-ink hover:bg-surface active:bg-surface2 disabled:text-muted',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-600/50 disabled:text-white/70',
  },
  size: {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }
};

const IconButton = React.forwardRef(({ 
  className, 
  variant = 'secondary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  icon, 
  tooltip,
  children,
  ...props 
}, ref) => {
  const variantClass = iconButtonVariants.variant[variant] || iconButtonVariants.variant.secondary;
  const sizeClass = iconButtonVariants.size[size] || iconButtonVariants.size.md;
  
  const button = (
    <button
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        transition-all duration-150 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:cursor-not-allowed
        ${!disabled ? 'hover:scale-[0.97] active:scale-[0.95]' : ''}
        ${variantClass} ${sizeClass} ${className}
      `}
      ref={ref}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      title={tooltip}
      {...props}
    >
      {icon || children}
    </button>
  );

  return button;
});

IconButton.displayName = 'IconButton';

export { IconButton, iconButtonVariants };

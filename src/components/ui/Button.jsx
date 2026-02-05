import React from 'react';

const buttonVariants = {
  primary: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-500/50 disabled:text-white/70',
  secondary: 'bg-zinc-700 text-white border border-zinc-600 hover:bg-zinc-600 active:bg-zinc-500 disabled:bg-zinc-700/50 disabled:text-zinc-400',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white active:bg-zinc-700 disabled:text-zinc-500',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-500/50 disabled:text-white/70',
};

const buttonSizes = {
  sm: 'h-8 px-3 text-sm rounded-md min-h-8 min-w-8',
  md: 'h-10 px-4 text-sm rounded-md min-h-10 min-w-10',
  lg: 'h-12 px-6 text-base rounded-lg min-h-12 min-w-12',
};

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  children, 
  ...props 
}, ref) => {
  const variantClass = buttonVariants[variant] || buttonVariants.primary;
  const sizeClass = buttonSizes[size] || buttonSizes.md;
  
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
        disabled:pointer-events-none disabled:cursor-not-allowed
        ${!disabled ? 'hover:scale-[0.97] active:scale-[0.95]' : 'scale-100'}
        ${variantClass} ${sizeClass} ${className}
      `}
      ref={ref}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        willChange: !disabled ? 'transform' : 'auto'
      }}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };

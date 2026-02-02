import React from 'react';

const buttonVariants = {
  variant: {
    default: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-zinc-300 bg-white hover:bg-zinc-50 hover:text-zinc-900',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    ghost: 'hover:bg-zinc-100 hover:text-zinc-900',
    link: 'text-zinc-900 underline-offset-4 hover:underline',
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  },
};

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variantClass = buttonVariants.variant[variant] || buttonVariants.variant.default;
  const sizeClass = buttonVariants.size[size] || buttonVariants.size.default;
  
  return (
    <button
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
        ${variantClass} ${sizeClass} ${className}
      `}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };

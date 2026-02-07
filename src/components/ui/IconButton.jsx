import React, { useState } from 'react';

const iconButtonVariants = {
  primary: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-2 focus:ring-amber-500/20',
  secondary: 'bg-zinc-700 text-white hover:bg-zinc-600 focus:ring-2 focus:ring-zinc-500/20',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white focus:ring-2 focus:ring-zinc-500/20',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500/20',
};

const iconButtonSizes = {
  sm: 'w-8 h-8 p-1.5',
  md: 'w-10 h-10 p-2',
  lg: 'w-12 h-12 p-2.5',
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
  const [showTooltip, setShowTooltip] = useState(false);
  
  const variantClass = iconButtonVariants[variant] || iconButtonVariants.secondary;
  const sizeClass = iconButtonSizes[size] || iconButtonSizes.md;
  
  const button = (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-200 focus:outline-none focus:ring-offset-2 focus:ring-offset-zinc-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        transform hover:scale-[0.97] active:scale-[0.95]
        ${variantClass} ${sizeClass} ${className}
      `}
      ref={ref}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      {...props}
    >
      {icon || children}
    </button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <div className="relative inline-block">
      {button}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-zinc-900 border border-zinc-700 rounded shadow-lg whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-700"></div>
          </div>
        </div>
      )}
    </div>
  );
});

IconButton.displayName = 'IconButton';

// Export all components
export { IconButton, iconButtonVariants };

// Default export for backward compatibility
export default IconButton;

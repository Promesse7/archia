import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigation } from '../../contexts/NavigationContext.jsx';

// Common button variants and sizes for consistency
const buttonVariants = {
  primary: 'bg-amber-500 text-white hover:bg-amber-600',
  secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600',
  outline: 'border border-zinc-300 bg-transparent hover:bg-zinc-100 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-700',
  ghost: 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const baseStyles = [
  'inline-flex items-center justify-center',
  'rounded-lg font-medium transition-all',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
  'disabled:opacity-50 disabled:pointer-events-none',
  'whitespace-nowrap',
].join(' ');

const NavigationButton = forwardRef(({
  to,
  children,
  className = '',
  disabled = false,
  isLoading,
  loadingText = 'Loading...',
  icon: Icon,
  variant = 'primary',
  size = 'md',
  onClick,
  ...props
}, ref) => {
  const { navigate, isNavigating } = useNavigation();
  const isActuallyLoading = isLoading || (isNavigating && to);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (to && !isActuallyLoading && !disabled) {
      navigate(to);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      disabled={disabled || isActuallyLoading}
      className={`${baseStyles} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {isActuallyLoading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {children}
        </>
      )}
    </button>
  );
});

NavigationButton.displayName = 'NavigationButton';

NavigationButton.propTypes = {
  to: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  icon: PropTypes.elementType,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(Object.keys(buttonVariants)),
  size: PropTypes.oneOf(Object.keys(buttonSizes)),
};

export default NavigationButton;

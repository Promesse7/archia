import React from 'react';

const cardVariants = {
  padding: {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
};

const Card = React.forwardRef(({ className, padding = 'md', children, ...props }, ref) => {
  const paddingClass = cardVariants.padding[padding] || cardVariants.padding.md;
  
  return (
    <div
      ref={ref}
      className={`
        rounded-xl border border-charcoal-700/50 bg-charcoal-900/50 backdrop-blur-sm text-white
        shadow-lg shadow-black/20
        transition-all duration-[200ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
        hover:-translate-y-1 hover:shadow-xl hover:shadow-charcoal-900/20
        focus:ring-2 focus:ring-ochre-500/50 focus:outline-none
        ${paddingClass} ${className}
      `}
      style={{
        willChange: 'transform, box-shadow'
      }}
      {...props}
    >
      {children}
    </div>
  );
});

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`
      flex flex-col space-y-2 pb-4 border-b border-charcoal-700/50
      ${className}
    `}
    {...props}
  />
));

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`
      text-xl font-semibold leading-tight text-white
      ${className}
    `}
    {...props}
  />
));

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`
      text-sm text-charcoal-400 leading-relaxed
      ${className}
    `}
    {...props}
  />
));

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`
      pt-4
      ${className}
    `}
    {...props}
  />
));

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`
      flex items-center justify-between pt-4 mt-4 border-t border-charcoal-700/50
      ${className}
    `}
    {...props}
  />
));

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

// Export all components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };

// Default export for backward compatibility
export default Card;

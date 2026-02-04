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
        rounded-xl border border-border bg-surface text-ink shadow-lg
        transition-shadow duration-200 hover:shadow-xl
        ${paddingClass} ${className}
      `}
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
      flex flex-col space-y-2 pb-4 border-b border-border/50
      ${className}
    `}
    {...props}
  />
));

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`
      text-xl font-semibold leading-tight text-ink
      ${className}
    `}
    {...props}
  />
));

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`
      text-sm text-muted leading-relaxed
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
      flex items-center justify-between pt-4 mt-4 border-t border-border/50
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

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };

import React from 'react';

const SectionHeader = React.forwardRef(({ title, subtitle, action, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`
        flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/50
        ${className}
      `}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

export { SectionHeader };

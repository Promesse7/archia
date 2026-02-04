import React from 'react';

const SectionHeader = ({ title, subtitle, action, className, ...props }) => {
  return (
    <div
      className={`
        flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50
        ${className}
      `}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-ink leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted leading-relaxed max-w-2xl">
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
};

export { SectionHeader };

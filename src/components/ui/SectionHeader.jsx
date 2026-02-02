import React from 'react';

const SectionHeader = ({ title, description, actions, className, ...props }) => {
  return (
    <div
      className={`
        flex items-center justify-between space-y-2
        ${className}
      `}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export { SectionHeader };

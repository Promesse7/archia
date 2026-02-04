import React from 'react';
import { Badge, badgeVariants } from './Badge';

const StatusPill = ({ status, message, className, ...props }) => {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'idle':
        return 'neutral';
      case 'loading':
        return 'warning';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'idle':
        return '●';
      case 'loading':
        return '⟳';
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return '●';
    }
  };

  const variant = getStatusVariant(status);
  const icon = getStatusIcon(status);
  const isLoading = status === 'loading';

  return (
    <Badge
      variant={variant}
      className={`
        flex items-center gap-1.5
        ${isLoading ? 'animate-pulse' : ''}
        ${className}
      `}
      {...props}
    >
      <span className={`${isLoading ? 'animate-spin' : ''}`}>
        {icon}
      </span>
      {message || status}
    </Badge>
  );
};

export { StatusPill };

import React from 'react';
import { Badge } from './Badge';

const StatusPill = ({ status, variant = 'default', className, ...props }) => {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'ready':
      case 'active':
      case 'complete':
      case 'success':
        return 'success';
      case 'processing':
      case 'loading':
      case 'pending':
        return 'warning';
      case 'error':
      case 'failed':
      case 'offline':
        return 'destructive';
      default:
        return variant;
    }
  };

  return (
    <Badge
      variant={getStatusVariant(status)}
      className={`
        capitalize font-medium
        ${className}
      `}
      {...props}
    >
      {status}
    </Badge>
  );
};

export { StatusPill };

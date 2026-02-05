import React from 'react';
import { useNavigation } from './AppShell';

const ScreenContainer = ({ children, screenId }) => {
  const { currentPage, isTransitioning } = useNavigation();
  const isActive = currentPage === screenId;

  return (
    <div
      className={`
        min-h-screen w-full
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isActive 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-3 pointer-events-none absolute inset-0'
        }
        ${isTransitioning && isActive ? 'scale-[0.98]' : 'scale-100'}
      `}
      style={{
        willChange: isActive ? 'opacity, transform' : 'auto'
      }}
    >
      {children}
    </div>
  );
};

export default ScreenContainer;

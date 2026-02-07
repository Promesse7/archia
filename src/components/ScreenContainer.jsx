import React, { useEffect, useRef } from 'react';
import * as PropTypes from 'prop-types';
import { useNavigation } from '../contexts/NavigationContext.jsx';

const ScreenContainer = ({ children, screenId, className = '' }) => {
  const { currentPage, isNavigating } = useNavigation();
  const isActive = currentPage === screenId;
  const prevIsActive = useRef(false);
  
  // Track previous active state for exit animations
  useEffect(() => {
    if (isActive) {
      prevIsActive.current = true;
    }
  }, [isActive]);

  // Don't render if this screen was never active
  if (!isActive && !prevIsActive.current) {
    return null;
  }

  return (
    <div
      className={`
        min-h-screen w-full 
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isActive ? 'opacity-100' : 'opacity-0'}
        ${isActive ? 'translate-y-0' : '-translate-y-3'}
        ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}
        ${isActive ? 'relative' : 'absolute top-0 left-0'}
        ${isNavigating && isActive ? 'scale-[0.99]' : 'scale-100'}
        ${className}
      `}
      style={{
        willChange: isActive || isNavigating ? 'opacity, transform' : 'auto',
        zIndex: isActive ? 1 : 'auto',
        transitionProperty: 'opacity, transform',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '300ms',
      }}
      aria-hidden={!isActive}
      aria-live={isActive ? 'polite' : 'off'}
    >
      {children}
    </div>
  );
};

ScreenContainer.propTypes = {
  children: PropTypes.node.isRequired,
  screenId: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default ScreenContainer;

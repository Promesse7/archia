import React from 'react';
import { useNavigation } from './AppShell';

// Navigation items configuration
const navigationItems = [
  { id: 'home', label: 'Home', icon: '🏠', path: '/' },
  { id: 'capture', label: 'Capture', icon: '📸', path: '/capture' },
  { id: 'reconstruct', label: 'Reconstruct', icon: '🔬', path: '/reconstruct' },
  { id: 'gallery', label: 'Gallery', icon: '🖼️', path: '/gallery' },
  { id: 'puzzle', label: 'Puzzle', icon: '🧩', path: '/puzzle' },
];

const FloatingBottomNav = () => {
  const { currentPage, navigate, isTransitioning } = useNavigation();

  const handleNavigation = (pageId) => {
    if (!isTransitioning) {
      navigate(pageId);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-surface/90 backdrop-blur-xl border border-border/50 rounded-full px-6 py-3 shadow-2xl">
        <nav className="flex items-center space-x-2">
          {navigationItems.map((item) => {
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                disabled={isTransitioning}
                className={`
                  relative flex flex-col items-center px-3 py-2 rounded-full transition-all duration-250 ease-out
                  ${isActive 
                    ? 'text-accent scale-110' 
                    : 'text-muted hover:text-ink hover:scale-105'
                  }
                  ${isTransitioning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                aria-label={`Navigate to ${item.label}`}
              >
                {/* Active state glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-accent/20 rounded-full blur-md -z-10" />
                )}
                
                {/* Icon */}
                <span className={`
                  text-lg transition-transform duration-250 ease-out
                  ${isActive ? 'scale-125' : 'scale-100'}
                `}>
                  {item.icon}
                </span>
                
                {/* Label */}
                <span className={`
                  text-xs font-medium mt-1 transition-all duration-250 ease-out
                  ${isActive ? 'opacity-100 font-semibold' : 'opacity-70'}
                `}>
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default FloatingBottomNav;

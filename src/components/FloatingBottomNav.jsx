import React from 'react';
import { useNavigation } from './AppShell';

// Icon components instead of emojis
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MicroscopeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const GalleryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PuzzleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
  </svg>
);

// Navigation items configuration
const navigationItems = [
  { id: 'home', label: 'Home', icon: <HomeIcon />, path: '/' },
  { id: 'capture', label: 'Capture', icon: <CameraIcon />, path: '/capture' },
  { id: 'reconstruct', label: 'Reconstruct', icon: <MicroscopeIcon />, path: '/reconstruct' },
  { id: 'gallery', label: 'Gallery', icon: <GalleryIcon />, path: '/gallery' },
  { id: 'puzzle', label: 'Puzzle', icon: <PuzzleIcon />, path: '/puzzle' },
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
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-full px-6 py-3 shadow-2xl">
        <nav className="flex items-center space-x-2">
          {navigationItems.map((item) => {
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                disabled={isTransitioning}
                className={`
                  relative flex flex-col items-center px-3 py-2 rounded-full transition-all duration-[250ms] ease-out
                  ${isActive 
                    ? 'text-amber-400 scale-110' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:scale-105'
                  }
                  ${isTransitioning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                aria-label={`Navigate to ${item.label}`}
              >
                {/* Active state glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md -z-10" />
                )}
                
                {/* Icon */}
                <span className={`
                  transition-transform duration-[250ms] ease-out
                  ${isActive ? 'scale-125 text-amber-400' : 'scale-100 text-zinc-400'}
                `}>
                  {item.icon}
                </span>
                
                {/* Label */}
                <span className={`
                  text-xs font-medium mt-1 transition-all duration-[250ms] ease-out
                  ${isActive ? 'opacity-100 font-semibold text-amber-400' : 'opacity-70 text-zinc-400'}
                `}>
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
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

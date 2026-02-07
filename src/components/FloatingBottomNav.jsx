import React from 'react';
import * as PropTypes from 'prop-types';
import { useNavigation } from '../contexts/NavigationContext.jsx';
import { Home, Camera, Box, BookOpen, Puzzle } from 'lucide-react';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'capture', icon: Camera, label: 'Capture' },
  { id: 'gallery', icon: Box, label: 'Gallery' },
  { id: 'reconstruct', icon: Box, label: 'Reconstruct' },
  { id: 'about', icon: BookOpen, label: 'About' },
];

const NavButton = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full flex flex-col items-center justify-center transition-all ${
        isActive 
          ? 'text-amber-500 bg-zinc-700' 
          : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs mt-1">{item.label}</span>
      {isActive && (
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
      )}
    </button>
  );
};

NavButton.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

const FloatingBottomNav = () => {
  const { currentPage, navigate, isNavigating } = useNavigation();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800/80 backdrop-blur-lg rounded-full p-2 shadow-xl z-40">
      <div className="flex items-center space-x-2">
        {navItems.map((item) => (
          <div key={item.id} className="relative">
            <NavButton
              item={item}
              isActive={currentPage === item.id}
              onClick={() => !isNavigating && navigate(item.id)}
            />
          </div>
        ))}
      </div>
    </nav>
  );
};

export default FloatingBottomNav;

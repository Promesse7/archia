import { useState } from 'react';

// Simple page-based routing system
export function useRouter() {
  const [currentPage, setCurrentPage] = useState('splash');
  
  const navigate = (page) => {
    setCurrentPage(page);
  };
  
  return { currentPage, navigate };
}

// Global navigation structure
export const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'capture', label: 'Capture', icon: '📸' },
  { id: 'reconstruction', label: 'Reconstruction', icon: '🏺' },
  { id: 'puzzle', label: 'Puzzle Lab', icon: '🧩' },
  { id: 'about', label: 'About', icon: '📚' }
];

// Page components will be imported and rendered based on currentPage
export const PAGES = {
  splash: 'SplashPage',
  home: 'HomePage',
  capture: 'CapturePage',
  reconstruction: 'ReconstructionPage',
  puzzle: 'PuzzlePage',
  about: 'AboutPage'
};

import { useState } from 'react';
import { DEFAULT_PAGE, NAV_ITEMS } from './features/core';

// Simple page-based routing system
export function useRouter() {
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  
  const navigate = (page) => {
    setCurrentPage(page);
  };
  
  return { currentPage, navigate };
}

// Global navigation structure
export const NAVIGATION_ITEMS = NAV_ITEMS;

// Page components will be imported and rendered based on currentPage
export const PAGES = {
  splash: 'SplashPage',
  home: 'HomePage',
  capture: 'CapturePage',
  reconstruction: 'ReconstructionPage',
  gallery: 'GalleryPage',
  puzzle: 'PuzzlePage',
  about: 'AboutPage'
};

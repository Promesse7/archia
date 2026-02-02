import React, { useState, useEffect } from 'react';
import { useRouter } from './router';
import Navigation from './components/Navigation';

// Import pages
import SplashPage from './pages/SplashPage';
import HomePage from './pages/HomePage';
import CapturePage from './pages/CapturePage';
import ReconstructionPage from './pages/ReconstructionPage';
import PuzzlePage from './pages/PuzzlePage';
import AboutPage from './pages/AboutPage';

// Page component mapping
const pageComponents = {
  splash: SplashPage,
  home: HomePage,
  capture: CapturePage,
  reconstruction: ReconstructionPage,
  puzzle: PuzzlePage,
  about: AboutPage
};

export default function App() {
  const { currentPage, navigate } = useRouter();
  const [fragments, setFragments] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Handle fragment addition
  const handleFragmentAdded = (fragment) => {
    setFragments(prev => [...prev, fragment]);
  };

  // Handle splash completion
  const handleSplashComplete = () => {
    setModelsLoaded(true);
    navigate('home');
  };

  // Render current page
  const renderCurrentPage = () => {
    const PageComponent = pageComponents[currentPage];
    
    if (!PageComponent) {
      console.error(`Unknown page: ${currentPage}`);
      return <HomePage onNavigate={navigate} fragmentCount={fragments.length} />;
    }

    // Special handling for pages that need extra props
    switch (currentPage) {
      case 'splash':
        return <PageComponent onReady={handleSplashComplete} />;
      
      case 'home':
        return <PageComponent onNavigate={navigate} fragmentCount={fragments.length} />;
      
      case 'capture':
        return <PageComponent onNavigate={navigate} onFragmentAdded={handleFragmentAdded} />;
      
      case 'reconstruction':
        return <PageComponent onNavigate={navigate} fragments={fragments} />;
      
      case 'puzzle':
      case 'about':
        return <PageComponent onNavigate={navigate} />;
      
      default:
        return <PageComponent onNavigate={navigate} />;
    }
  };

  // Show splash screen while models load, then show navigation + pages
  if (currentPage === 'splash') {
    return renderCurrentPage();
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation 
        currentPage={currentPage} 
        onNavigate={navigate}
        fragmentCount={fragments.length}
      />
      {renderCurrentPage()}
    </div>
  );
}

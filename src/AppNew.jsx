import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter } from './router';
import { AppShell } from './features/core';

const SplashPage = React.lazy(() => import('./pages/SplashPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const CapturePage = React.lazy(() => import('./pages/CapturePage'));
const ReconstructionPage = React.lazy(() => import('./pages/ReconstructionPage'));
const GalleryPage = React.lazy(() => import('./pages/GalleryPage'));
const PuzzlePage = React.lazy(() => import('./pages/PuzzlePage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));

export default function App() {
  const { currentPage, navigate } = useRouter();
  const [fragments, setFragments] = useState([]);

  // Handle fragment addition
  const handleFragmentAdded = useCallback((fragment) => {
    setFragments(prev => [...prev, fragment]);
  }, []);

  // Handle splash completion
  const handleSplashComplete = useCallback(() => {
    navigate('home');
  }, [navigate]);

  const activeScreen = useMemo(() => {
    switch (currentPage) {
      case 'splash':
        return <SplashPage onReady={handleSplashComplete} />;
      case 'home':
        return <HomePage onNavigate={navigate} fragmentCount={fragments.length} />;
      case 'capture':
        return <CapturePage onNavigate={navigate} onFragmentAdded={handleFragmentAdded} />;
      case 'reconstruction':
        return <ReconstructionPage onNavigate={navigate} fragments={fragments} />;
      case 'gallery':
        return <GalleryPage onNavigate={navigate} fragments={fragments} />;
      case 'puzzle':
        return <PuzzlePage onNavigate={navigate} />;
      case 'about':
        return <AboutPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} fragmentCount={fragments.length} />;
    }
  }, [currentPage, fragments, navigate, handleFragmentAdded, handleSplashComplete]);

  if (currentPage === 'splash') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
        {activeScreen}
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <AppShell currentPage={currentPage} onNavigate={navigate} fragmentCount={fragments.length}>
        {activeScreen}
      </AppShell>
    </Suspense>
  );
}
import React, { Suspense, useCallback, useMemo, useState, useEffect } from 'react';
import AppShell from './components/AppShell';
import FloatingBottomNav from './components/FloatingBottomNav';
import ScreenContainer from './components/ScreenContainer';
import LoadingScreen from './components/LoadingScreen';
import { preloadModels } from './ai/classifier';
import { getDepthEstimator } from './ai/depthEstimator';

// Lazy load pages for performance
const SplashPage = React.lazy(() => import('./pages/SplashPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const CapturePage = React.lazy(() => import('./pages/CapturePage'));
const ReconstructionPage = React.lazy(() => import('./pages/Reconstruct'));
const GalleryPage = React.lazy(() => import('./pages/GalleryPage'));
const PuzzlePage = React.lazy(() => import('./pages/Puzzle'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));

// Error boundary component for graceful error handling
const ErrorBoundary = ({ children, error }) => (
  <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-6">
    <div className="text-center space-y-4">
      <div className="text-6xl text-red-400 mb-4">⚠️</div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-zinc-400 mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);

// Lazy loading wrapper with error boundary
const LazyPageWrapper = ({ children, fallback = null }) => (
  <ErrorBoundary>
    <Suspense 
      fallback={
        fallback || (
          <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-zinc-400">Loading...</p>
            </div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Prevent double-loading in React StrictMode
let modelsStarted = false;

export default function App() {
  const [currentPage, setCurrentPage] = useState('splash');
  const [fragments, setFragments] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("Initializing...");
  const [loadingError, setLoadingError] = useState(null);

  // Load models on mount
  useEffect(() => {
    if (modelsStarted) return;
    modelsStarted = true;

    async function loadModels() {
      try {
        // Stage 1: Depth Estimator (0-25%)
        setLoadingStage("Initializing depth estimator...");
        setLoadingProgress(5);
        
        await getDepthEstimator();
        setLoadingProgress(25);
        setLoadingStage("Depth estimator ready");

        await new Promise(resolve => setTimeout(resolve, 300));

        // Stage 2-4: MobileNet & Classifier (25-100%)
        setLoadingStage("Loading AI models...");
        
        const success = await preloadModels((progressData) => {
          const mappedProgress = 25 + (progressData.percent * 0.75);
          setLoadingProgress(mappedProgress);
          setLoadingStage(progressData.stage);
        });

        if (success) {
          setLoadingProgress(100);
          setLoadingStage("All models loaded!");
          await new Promise(resolve => setTimeout(resolve, 500));
          setModelsLoaded(true);
        } else {
          throw new Error("Model initialization returned false");
        }

      } catch (err) {
        console.error("Model loading error:", err);
        setLoadingError(err.message);
        setLoadingStage("Failed to load models");
      }
    }

    loadModels();
  }, []);

  // Show loading screen if models aren't loaded
  if (!modelsLoaded) {
    return (
      <LoadingScreen 
        progress={loadingProgress}
        stage={loadingStage}
        error={loadingError}
      />
    );
  }

  // Navigation function
  const navigate = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Handle fragment addition
  const handleFragmentAdded = useCallback((fragment) => {
    setFragments(prev => [...prev, fragment]);
  }, []);

  // Handle splash completion
  const handleSplashComplete = useCallback(() => {
    navigate('home');
  }, [navigate]);

  // Render screen with transitions
  const renderScreen = (screenId, component) => (
    <LazyPageWrapper>
      <ScreenContainer screenId={screenId}>
        {component}
      </ScreenContainer>
    </LazyPageWrapper>
  );

  // All screens with ScreenContainer
  const screens = (
    <>
      {renderScreen('splash', <SplashPage onReady={handleSplashComplete} />)}
      {renderScreen('home', <HomePage onNavigate={navigate} fragmentCount={fragments.length} />)}
      {renderScreen('capture', <CapturePage onNavigate={navigate} onFragmentAdded={handleFragmentAdded} />)}
      {renderScreen('reconstruct', <ReconstructionPage onNavigate={navigate} fragments={fragments} />)}
      {renderScreen('gallery', <GalleryPage onNavigate={navigate} fragments={fragments} />)}
      {renderScreen('puzzle', <PuzzlePage onNavigate={navigate} />)}
      {renderScreen('about', <AboutPage onNavigate={navigate} />)}
    </>
  );

  // Splash screen gets special treatment (no navigation)
  if (currentPage === 'splash') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
        <AppShell>
          {screens}
        </AppShell>
      </Suspense>
    );
  }

  // Main app with navigation
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <AppShell>
        <div className="relative min-h-screen pb-24">
          {screens}
        </div>
        <FloatingBottomNav />
      </AppShell>
    </Suspense>
  );
}
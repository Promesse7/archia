import React, { Suspense, useCallback, useState, useEffect } from 'react';
import AppShell from './components/AppShell';
import FloatingBottomNav from './components/FloatingBottomNav';
import ScreenContainer from './components/ScreenContainer';
import LoadingScreen from './components/LoadingScreen';
import { preloadModels } from './ai/classifier';
import { getDepthEstimator } from './ai/depthEstimator';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext.jsx';
import { FragmentProvider } from './contexts/FragmentContext';
import * as PropTypes from "prop-types";

// Lazy load pages for performance
const SplashPage = React.lazy(() => import('./pages/SplashPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const CapturePage = React.lazy(() => import('./pages/CapturePage'));
const ReconstructionPage = React.lazy(() => import('./pages/ReconstructionPage'));
const GalleryPage = React.lazy(() => import('./pages/GalleryPage'));
const PuzzlePage = React.lazy(() => import('./pages/PuzzlePage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));

// Error boundary for page loading
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="text-6xl text-red-400 mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-zinc-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
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
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

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

LazyPageWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node
};

// Prevent double-loading in React StrictMode
let modelsStarted = false;

const AppContent = () => {
  const { currentPage, fragments } = useNavigation();

  // Render current page based on navigation state
  const renderPage = () => {
    const pages = {
      splash: <SplashPage />,
      home: <HomePage fragmentCount={fragments.length} />,
      capture: <CapturePage />,
      reconstruct: <ReconstructionPage />,
      gallery: <GalleryPage />,
      puzzle: <PuzzlePage />,
      about: <AboutPage />
    };

    return (
      <LazyPageWrapper>
        {pages[currentPage] || <div className="p-4">Page not found: {currentPage}</div>}
      </LazyPageWrapper>
    );
  };

  return (
    <div className="relative min-h-screen">
      {renderPage()}
    </div>
  );
};

AppContent.propTypes = {
  // Add any necessary prop types
};

export default function App() {
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
          setLoadingStage(progressData.stage || "Loading AI models...");
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
        // Even if models fail to load, we'll still let the app start
        setModelsLoaded(true);
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

  return (
    <NavigationProvider>
      <FragmentProvider>
        <AppShell>
          <div className="relative min-h-screen pb-24">
            <AppContent />
            <FloatingBottomNav />
          </div>
        </AppShell>
      </FragmentProvider>
    </NavigationProvider>
  );
}
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('splash');
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState(['splash']);
  const [error, setError] = useState(null);
  const [fragments, setFragments] = useState([]); // Central fragments state

  // Navigation guards
  const navigationGuards = useMemo(() => ({
    'reconstruct': () => ({
      canNavigate: fragments.length > 0,
      reason: fragments.length === 0 ? 'Please capture at least one fragment first' : null
    }),
    'gallery': () => ({
      canNavigate: true
    })
    // Add more guards as needed
  }), [fragments]);

  // Fragment management functions
  const addFragment = useCallback((fragment) => {
    setFragments(prev => [...prev, fragment]);
  }, []);

  const removeFragment = useCallback((fragmentId) => {
    setFragments(prev => prev.filter(f => f.id !== fragmentId));
  }, []);

  const clearFragments = useCallback(() => {
    setFragments([]);
  }, []);

  const updateFragment = useCallback((fragmentId, updates) => {
    setFragments(prev => prev.map(f => 
      f.id === fragmentId ? { ...f, ...updates } : f
    ));
  }, []);

  const navigate = useCallback(async (pageId, options = {}) => {
    if (currentPage === pageId) return;
    if (isNavigating) return;

    try {
      setIsNavigating(true);
      setError(null);

      // Check navigation guards
      const guard = navigationGuards[pageId];
      if (guard) {
        const result = await guard();
        if (result && !result.canNavigate) {
          setError(result.reason || 'Navigation blocked');
          return;
        }
      }

      // Add to history if it's a new page
      setNavigationHistory(prev => {
        if (prev[prev.length - 1] === pageId) return prev;
        return options.replace 
          ? [...prev.slice(0, -1), pageId]  // Replace last entry
          : [...prev, pageId];              // Add new entry
      });

      // Update URL
      const url = `#${pageId}`;
      const state = { pageId, timestamp: Date.now() };
      
      if (options.replace) {
        window.history.replaceState(state, '', url);
      } else {
        window.history.pushState(state, '', url);
      }

      // Smooth transition
      await new Promise(resolve => setTimeout(resolve, 150));
      setCurrentPage(pageId);
      
      // Scroll to top on navigation
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Navigation error:', err);
      setError(err);
    } finally {
      setIsNavigating(false);
    }
  }, [currentPage, isNavigating, navigationGuards]);

  const goBack = useCallback(() => {
    if (navigationHistory.length <= 1) return;
    
    const newHistory = [...navigationHistory];
    newHistory.pop();
    const previousPage = newHistory[newHistory.length - 1];
    
    navigate(previousPage, { replace: true });
  }, [navigationHistory, navigate]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (event) => {
      const hash = window.location.hash.substring(1) || 'home';
      if (hash !== currentPage) {
        const historyIndex = navigationHistory.indexOf(hash);
        
        if (historyIndex !== -1) {
          setNavigationHistory(prev => prev.slice(0, historyIndex + 1));
        } else {
          setNavigationHistory(prev => [...prev, hash]);
        }
        
        setCurrentPage(hash);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage, navigationHistory]);

  const value = {
    currentPage,
    isNavigating,
    error,
    navigate,
    goBack,
    navigationHistory,
    fragments, // Expose fragments to all components
    addFragment,
    removeFragment,
    clearFragments,
    updateFragment
  };

  return React.createElement(
    NavigationContext.Provider,
    { value },
    [
      React.cloneElement(children, { key: 'navigation-children' }),
      isNavigating && React.createElement(
        'div',
        { 
          key: 'navigation-loading',
          className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' 
        },
        React.createElement(
          'div',
          { 
            className: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500' 
          }
        )
      ),
      error && React.createElement(
        'div',
        { 
          key: 'navigation-error',
          className: 'fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50' 
        },
        [
          `Navigation error: ${error.message}`,
          React.createElement(
            'button',
            { 
              key: 'dismiss-button',
              onClick: () => setError(null),
              className: 'ml-4 text-sm underline'
            },
            'Dismiss'
          )
        ]
      )
    ].filter(Boolean)
  );
};

NavigationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

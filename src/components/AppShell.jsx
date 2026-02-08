import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as PropTypes from 'prop-types';
import { useNavigation } from '../contexts/NavigationContext.jsx';

// Theme context for global theme management
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 

export const AppShell = ({ children }) => {
  // Global theme state
  const [theme, setTheme] = useState('dark');
  const { isNavigating } = useNavigation();
  
  // Theme management
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-zinc-950', 'text-white');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-zinc-950', 'text-white');
    }
  }, [theme]);

  // Memoize theme context value to prevent unnecessary re-renders
  const themeContextValue = useMemo(() => ({
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div className={`min-h-screen relative ${theme === 'dark' ? 'dark bg-zinc-900' : 'bg-gray-50'}`}>
        {/* Global loading overlay */}
        {isNavigating && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-opacity duration-300">
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              <p className="text-zinc-900 dark:text-white">Loading...</p>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className={`transition-opacity duration-300 ${isNavigating ? 'opacity-50' : 'opacity-100'}`}>
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

AppShell.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppShell;
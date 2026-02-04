import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme context for global theme management
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within an AppShell');
  }
  return context;
};

// Navigation context for global navigation state
const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within an AppShell');
  }
  return context;
};

const AppShell = ({ children }) => {
  // Global theme state
  const [theme, setTheme] = useState('dark');
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState(['home']);

  // Theme management
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Navigation management
  const navigate = (page) => {
    if (page === currentPage || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Add to history
    setNavigationHistory(prev => [...prev, page]);
    
    // Change page after transition starts
    setTimeout(() => {
      setCurrentPage(page);
      setIsTransitioning(false);
    }, 150);
  };

  const goBack = () => {
    if (navigationHistory.length <= 1) return;
    
    setIsTransitioning(true);
    const newHistory = [...navigationHistory];
    newHistory.pop();
    const previousPage = newHistory[newHistory.length - 1];
    
    setTimeout(() => {
      setCurrentPage(previousPage);
      setNavigationHistory(newHistory);
      setIsTransitioning(false);
    }, 150);
  };

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const themeValue = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  const navigationValue = {
    currentPage,
    navigate,
    goBack,
    isTransitioning,
    navigationHistory
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      <NavigationContext.Provider value={navigationValue}>
        <div className={`min-h-screen bg-background text-foreground ${theme}`}>
          {children}
        </div>
      </NavigationContext.Provider>
    </ThemeContext.Provider>
  );
};

export default AppShell;

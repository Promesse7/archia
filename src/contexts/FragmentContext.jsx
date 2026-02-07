import React, { createContext, useContext, useState } from 'react';

const FragmentContext = createContext();

export const FragmentProvider = ({ children }) => {
  const [selectedFragments, setSelectedFragments] = useState([]);

  return (
    <FragmentContext.Provider value={{ selectedFragments, setSelectedFragments }}>
      {children}
    </FragmentContext.Provider>
  );
};

export const useFragmentContext = () => {
  const context = useContext(FragmentContext);
  if (!context) {
    throw new Error('useFragmentContext must be used within a FragmentProvider');
  }
  return context;
};

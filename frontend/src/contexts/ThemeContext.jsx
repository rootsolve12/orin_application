import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Save to local storage
    localStorage.setItem('theme', 'light');
    
    // Apply to root HTML element (always remove dark)
    const root = window.document.documentElement;
    root.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => {
    // Ignore toggle, always light
    setTheme('light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

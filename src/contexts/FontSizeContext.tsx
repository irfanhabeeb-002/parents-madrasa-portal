import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  fontSizeClass: string;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const FONT_SIZE_KEY = 'madrasa-portal-font-size';

const fontSizeClasses: Record<FontSize, string> = {
  small: 'text-font-small',
  medium: 'text-font-medium', 
  large: 'text-font-large'
};

interface FontSizeProviderProps {
  children: ReactNode;
}

export const FontSizeProvider: React.FC<FontSizeProviderProps> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  // Load font size from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) as FontSize;
    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }
  }, []);

  // Update localStorage and apply to document root
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(FONT_SIZE_KEY, size);
    
    // Apply font size class to document root for global effect
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${size}`);
  };

  // Apply initial font size to document root
  useEffect(() => {
    document.documentElement.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  const value: FontSizeContextType = {
    fontSize,
    setFontSize,
    fontSizeClass: fontSizeClasses[fontSize]
  };

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = (): FontSizeContextType => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};
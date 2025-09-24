import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'auto';
type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: EffectiveTheme;
  userTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isHighContrast: boolean;
  prefersReducedMotion: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [userTheme, setUserTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'auto';
  });

  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  const [isHighContrast, setIsHighContrast] = useState(() => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for high contrast preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = userTheme === 'auto' ? systemTheme : userTheme;

    // Update document class for theme
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(effectiveTheme);

    // Update high contrast class
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Update reduced motion class
    if (prefersReducedMotion) {
      document.documentElement.classList.add('motion-reduce');
    } else {
      document.documentElement.classList.remove('motion-reduce');
    }
  }, [userTheme, systemTheme, isHighContrast, prefersReducedMotion]);

  const setTheme = (theme: Theme) => {
    setUserTheme(theme);
    localStorage.setItem('theme', theme);
  };

  const toggleTheme = () => {
    const effectiveTheme = userTheme === 'auto' ? systemTheme : userTheme;
    const newTheme: Theme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const effectiveTheme = userTheme === 'auto' ? systemTheme : userTheme;

  const value: ThemeContextType = {
    theme: effectiveTheme,
    userTheme,
    setTheme,
    toggleTheme,
    isHighContrast,
    prefersReducedMotion,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

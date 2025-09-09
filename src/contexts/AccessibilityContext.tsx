import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const ACCESSIBILITY_STORAGE_KEY = 'madrasa-portal-accessibility';

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  keyboardNavigation: true,
  screenReaderOptimized: false,
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // Load settings from localStorage and detect system preferences
  useEffect(() => {
    const savedSettings = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    let initialSettings = defaultSettings;

    if (savedSettings) {
      try {
        initialSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    // Apply system preferences if not explicitly set by user
    if (!savedSettings) {
      initialSettings.reducedMotion = prefersReducedMotion;
      initialSettings.highContrast = prefersHighContrast;
    }

    setSettings(initialSettings);
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Keyboard navigation
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }

    // Screen reader optimization
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    // Save to localStorage
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY);
  };

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
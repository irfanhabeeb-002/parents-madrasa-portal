import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { findUserByPhone, type User } from '../data/users';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (phoneNumber: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'madrasa-portal-user';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log('User loaded from localStorage:', userData.name);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (phoneNumber: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const foundUser = findUserByPhone(phoneNumber);
      
      if (!foundUser) {
        throw new Error('User not registered. Contact admin.');
      }

      // Save to localStorage and state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      
      console.log('User logged in successfully:', foundUser.name);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setError(null);
    console.log('User logged out');
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  ConfirmationResult,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { FirebaseUser as AppUser, FIREBASE_COLLECTIONS } from '../types/firebase';

// User interface for authentication
interface User {
  uid: string;
  displayName: string;
  phone?: string;
  email?: string;
  role?: 'parent' | 'student';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  loginWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Firebase is configured
  const firebaseConfigured = isFirebaseConfigured();

  // Listen to Firebase auth state changes (only if Firebase is configured)
  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      // Use mock authentication for development
      console.log('Using mock authentication for development');
      initializeMockAuth();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, firebaseUser.uid));
          
          let userData: User;
          
          if (userDoc.exists()) {
            const firestoreData = userDoc.data() as AppUser;
            userData = {
              uid: firebaseUser.uid,
              displayName: firestoreData.displayName || firebaseUser.displayName || 'User',
              phone: firestoreData.phoneNumber || firebaseUser.phoneNumber || undefined,
              email: firestoreData.email || firebaseUser.email || undefined,
              role: firestoreData.role,
            };
          } else {
            // Create user profile if it doesn't exist
            userData = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              phone: firebaseUser.phoneNumber || undefined,
              email: firebaseUser.email || undefined,
              role: 'parent', // Default role
            };
            
            // Save to Firestore
            await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, firebaseUser.uid), {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              phoneNumber: firebaseUser.phoneNumber,
              displayName: firebaseUser.displayName || 'User',
              role: 'parent',
              createdAt: Timestamp.now(),
              lastLoginAt: Timestamp.now(),
              emailVerified: firebaseUser.emailVerified,
            } as AppUser);
          }
          
          setUser(userData);
          console.log('User authenticated:', userData.displayName);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setError('Failed to load user profile');
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setupRecaptcha = (elementId: string): RecaptchaVerifier => {
    // Clear any existing reCAPTCHA
    const existingRecaptcha = document.getElementById(elementId);
    if (existingRecaptcha) {
      existingRecaptcha.innerHTML = '';
    }

    return new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        setError('reCAPTCHA expired. Please try again.');
      },
      'error-callback': (error: any) => {
        console.error('reCAPTCHA error:', error);
        setError('reCAPTCHA verification failed. Please try again.');
      },
    });
  };

  const loginWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
    setLoading(true);
    setError(null);

    try {
      // Clean and validate phone number
      const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');
      
      // Validate Indian mobile number format
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      // Use mock authentication if Firebase is not configured
      if (!firebaseConfigured || !auth) {
        return mockPhoneLogin(cleanPhone);
      }

      // Format phone number to international format
      const formattedPhone = `+91${cleanPhone}`;

      // Set up reCAPTCHA
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      
      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      
      console.log('OTP sent to:', formattedPhone);
      return confirmationResult;
    } catch (error: any) {
      console.error('Phone login error:', error);
      setError(getErrorMessage(error.code || error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Use mock authentication if Firebase is not configured
      if (!firebaseConfigured || !auth) {
        await mockOTPVerification(confirmationResult, otp);
        return;
      }

      await confirmationResult.confirm(otp);
      console.log('Phone number verified successfully');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setError(getErrorMessage(error.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Use mock authentication if Firebase is not configured
      if (!firebaseConfigured || !auth) {
        await mockEmailLogin(email, password);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      console.log('Email login successful');
    } catch (error: any) {
      console.error('Email login error:', error);
      setError(getErrorMessage(error.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Use mock authentication if Firebase is not configured
      if (!firebaseConfigured || !auth) {
        await mockEmailRegistration(email, password, displayName);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      console.log('Email registration successful');
    } catch (error: any) {
      console.error('Email registration error:', error);
      setError(getErrorMessage(error.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Use mock authentication if Firebase is not configured
      if (!firebaseConfigured || !auth) {
        await mockLogout();
        return;
      }

      await signOut(auth);
      console.log('User logged out');
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(getErrorMessage(error.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const cleanupRecaptcha = (): void => {
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (recaptchaContainer) {
      recaptchaContainer.innerHTML = '';
    }
  };

  // Initialize mock authentication for development
  const initializeMockAuth = (): void => {
    // Check for existing mock user on mount
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored mock user:', error);
        localStorage.removeItem('mockUser');
      }
    }
    setLoading(false);

    // Listen for mock auth state changes
    const handleMockAuthChange = (event: CustomEvent) => {
      const userData = event.detail;
      setUser(userData);
      setLoading(false);
    };

    window.addEventListener('mockAuthStateChanged', handleMockAuthChange as EventListener);
    
    return () => {
      window.removeEventListener('mockAuthStateChanged', handleMockAuthChange as EventListener);
    };
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    loginWithPhone,
    loginWithEmail,
    verifyOTP,
    registerWithEmail,
    logout,
    clearError,
    setupRecaptcha,
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



// Mock authentication functions for development mode
const mockUsers = [
  { uid: '1', displayName: 'Abdul Rahman', phone: '9876543210', email: 'abdul@example.com', role: 'parent' as const },
  { uid: '2', displayName: 'Fatima', phone: '9123456780', email: 'fatima@example.com', role: 'parent' as const },
  { uid: '3', displayName: 'Muhammad', phone: '9012345678', email: 'muhammad@example.com', role: 'parent' as const },
];

const mockPhoneLogin = async (phoneNumber: string): Promise<ConfirmationResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockUser = mockUsers.find(user => user.phone === phoneNumber);
  
  if (!mockUser) {
    throw new Error('User not found with this phone number');
  }
  
  // Store phone number for OTP verification
  localStorage.setItem('mockPhoneNumber', phoneNumber);
  
  console.log('Mock OTP sent to:', phoneNumber);
  
  // Return a mock confirmation result
  return {
    confirm: async (otp: string) => {
      if (otp === '123456') {
        // Mock successful verification - this will be handled by mockOTPVerification
        return Promise.resolve();
      } else {
        throw new Error('Invalid OTP');
      }
    }
  } as ConfirmationResult;
};

const mockOTPVerification = async (confirmationResult: ConfirmationResult, otp: string): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (otp !== '123456') {
    throw new Error('Invalid OTP. Use 123456 for demo');
  }
  
  // Find the user based on the phone number (stored in localStorage during phone login)
  const phoneNumber = localStorage.getItem('mockPhoneNumber');
  const mockUser = mockUsers.find(user => user.phone === phoneNumber);
  
  if (mockUser) {
    // Store user in localStorage to simulate authentication
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    // Trigger a custom event to notify the auth context
    window.dispatchEvent(new CustomEvent('mockAuthStateChanged', { detail: mockUser }));
  }
  
  console.log('Mock OTP verification successful');
};

const mockEmailLogin = async (email: string, password: string): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockUser = mockUsers.find(user => user.email === email);
  
  if (!mockUser || password !== 'password123') {
    throw new Error('Invalid email or password');
  }
  
  // Store user in localStorage to simulate authentication
  localStorage.setItem('mockUser', JSON.stringify(mockUser));
  // Trigger a custom event to notify the auth context
  window.dispatchEvent(new CustomEvent('mockAuthStateChanged', { detail: mockUser }));
  
  console.log('Mock email login successful');
};

const mockEmailRegistration = async (email: string, password: string, displayName: string): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if user already exists
  const existingUser = mockUsers.find(user => user.email === email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }
  
  // Create new mock user
  const newUser = {
    uid: Date.now().toString(),
    displayName,
    email,
    phone: undefined,
    role: 'parent' as const,
  };
  
  // Store user in localStorage to simulate authentication
  localStorage.setItem('mockUser', JSON.stringify(newUser));
  // Trigger a custom event to notify the auth context
  window.dispatchEvent(new CustomEvent('mockAuthStateChanged', { detail: newUser }));
  
  console.log('Mock email registration successful');
};

const mockLogout = async (): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Remove user from localStorage
  localStorage.removeItem('mockUser');
  localStorage.removeItem('mockPhoneNumber');
  // Trigger a custom event to notify the auth context
  window.dispatchEvent(new CustomEvent('mockAuthStateChanged', { detail: null }));
  
  console.log('Mock logout successful');
};

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode: string): string {
  // Handle custom error messages (non-Firebase errors)
  if (!errorCode.startsWith('auth/')) {
    return errorCode;
  }

  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number.';
    case 'auth/invalid-verification-code':
      return 'Invalid OTP. Please check and try again.';
    case 'auth/code-expired':
      return 'OTP has expired. Please request a new one.';
    case 'auth/missing-verification-code':
      return 'Please enter the OTP sent to your phone.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again later.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    case 'auth/requires-recent-login':
      return 'Please log in again to complete this action.';
    default:
      return 'An error occurred. Please try again.';
  }
}
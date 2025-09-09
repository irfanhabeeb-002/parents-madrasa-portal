import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
// Firebase imports - COMMENTED OUT FOR MANUAL LOGIN
// TODO: Uncomment these imports when ready to enable Firebase Auth
/*
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
*/

// Import allowed users for manual login
import allowedUsers from '../data/allowedUsers.json';

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
  // Manual login method - no OTP required
  loginWithPhone: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  
  // Firebase methods - COMMENTED OUT FOR MANUAL LOGIN
  // TODO: Uncomment these when ready to enable Firebase Auth
  /*
  loginWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier;
  */
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MANUAL LOGIN MODE - Firebase is disabled
  // TODO: When ready to enable Firebase, uncomment the Firebase code below and comment out manual login
  
  // Initialize manual authentication
  useEffect(() => {
    console.log('Using manual phone-number login (Firebase disabled)');
    initializeManualAuth();
  }, []);

  // Initialize manual authentication for development
  const initializeManualAuth = (): void => {
    // Check for existing user session on mount
    const storedUser = localStorage.getItem('manualAuthUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('Restored user session:', userData.displayName);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('manualAuthUser');
      }
    }
    setLoading(false);
  };

  /* 
  // FIREBASE AUTH CODE - COMMENTED OUT FOR MANUAL LOGIN
  // TODO: Uncomment this section when ready to enable Firebase Auth
  
  // Check if Firebase is configured
  const firebaseConfigured = isFirebaseConfigured();

  // Listen to Firebase auth state changes (only if Firebase is configured)
  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      console.log('Firebase not configured, using manual authentication');
      initializeManualAuth();
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
  */

  // MANUAL LOGIN METHODS
  const loginWithPhone = async (phoneNumber: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Clean and validate phone number
      const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');
      
      // Validate Indian mobile number format
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user in allowed users list
      const foundUser = allowedUsers.find(user => user.phoneNumber === cleanPhone);
      
      if (!foundUser) {
        throw new Error('User not registered. Please contact administrator.');
      }

      // Create user object
      const userData: User = {
        uid: foundUser.uid,
        displayName: foundUser.displayName,
        phone: foundUser.phoneNumber,
        email: foundUser.email,
        role: foundUser.role as 'parent' | 'student',
      };

      // Store user in localStorage
      localStorage.setItem('manualAuthUser', JSON.stringify(userData));
      setUser(userData);
      
      console.log('Manual login successful:', userData.displayName);
    } catch (error: any) {
      console.error('Phone login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove user from localStorage
      localStorage.removeItem('manualAuthUser');
      setUser(null);
      
      console.log('Manual logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      setError('Failed to logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* 
  // FIREBASE AUTH METHODS - COMMENTED OUT FOR MANUAL LOGIN
  // TODO: Uncomment these methods when ready to enable Firebase Auth
  
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
  */

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    loginWithPhone,
    logout,
    clearError,
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



/* 
// FIREBASE ERROR HELPER - COMMENTED OUT FOR MANUAL LOGIN
// TODO: Uncomment this when ready to enable Firebase Auth

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
*/
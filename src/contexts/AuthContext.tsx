import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
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
    console.warn('Using manual phone-number login (Firebase disabled)');
    initializeManualAuth();
  }, []);

  // Initialize manual authentication for development
  const initializeManualAuth = (): void => {
    // Check for existing user session on mount
    const storedUser = localStorage.getItem('manualAuthUser');
    if (storedUser) {
      try {
        let userData = JSON.parse(storedUser);
        setUser(userData);
        console.warn('Restored user session:', userData.displayName);
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
      console.warn('Firebase not configured, using manual authentication');
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
          console.warn('User authenticated:', userData.displayName);
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
      const foundUser = allowedUsers.find(
        user => user.phoneNumber === cleanPhone
      );

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

      console.warn('Manual login successful:', userData.displayName);
    } catch (error: any) {
      console.error('Phone login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (retryCount: number = 0): Promise<void> => {
    const maxRetries = 3;
    setLoading(true);
    setError(null);

    try {
      console.warn(
        `Starting logout process... (attempt ${retryCount + 1}/${maxRetries + 1})`
      );

      // Simulate network delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Enhanced session cleanup: Complete removal of all user data
      try {
        // Primary cleanup: Remove main auth user data
        localStorage.removeItem('manualAuthUser');

        // Comprehensive cleanup: Remove all potential auth-related data
        const authRelatedKeys = [
          'manualAuthUser',
          'authUser',
          'user',
          'userSession',
          'sessionData',
          'authToken',
          'accessToken',
          'refreshToken',
          'loginTime',
          'lastActivity',
          'userPreferences',
          'authState',
        ];

        // Remove known auth keys
        authRelatedKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove ${key}:`, e);
          }
        });

        // Scan and remove any keys that might contain user data
        const allLocalStorageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            allLocalStorageKeys.push(key);
          }
        }

        allLocalStorageKeys.forEach(key => {
          if (
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('user') ||
            key.toLowerCase().includes('session') ||
            key.toLowerCase().includes('login') ||
            key.toLowerCase().includes('token')
          ) {
            try {
              localStorage.removeItem(key);
              console.warn(`Removed potential auth key: ${key}`);
            } catch (e) {
              console.warn(`Failed to remove potential auth key ${key}:`, e);
            }
          }
        });

        // Also clean sessionStorage
        const allSessionStorageKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            allSessionStorageKeys.push(key);
          }
        }

        allSessionStorageKeys.forEach(key => {
          if (
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('user') ||
            key.toLowerCase().includes('session') ||
            key.toLowerCase().includes('login') ||
            key.toLowerCase().includes('token')
          ) {
            try {
              sessionStorage.removeItem(key);
              console.warn(`Removed potential session auth key: ${key}`);
            } catch (e) {
              console.warn(
                `Failed to remove potential session auth key ${key}:`,
                e
              );
            }
          }
        });

        console.warn(
          'Comprehensive localStorage and sessionStorage cleanup successful'
        );
      } catch (storageError) {
        console.warn(
          'Storage cleanup failed, attempting fallback:',
          storageError
        );

        // Fallback cleanup mechanisms
        try {
          // Nuclear option: clear all localStorage and sessionStorage
          // This ensures complete cleanup but may affect other app data
          console.warn('Attempting nuclear cleanup of all storage');
          localStorage.clear();
          sessionStorage.clear();
          console.warn('Nuclear storage cleanup completed');
        } catch (fallbackError) {
          console.error('All cleanup methods failed:', fallbackError);
          // Continue with logout even if storage cleanup fails
        }
      }

      // Ensure AuthContext state is properly reset to null
      // This is critical for security and proper state management
      setUser(null);
      setError(null);

      // Force a state update to ensure components re-render
      // This helps prevent any cached user state from persisting
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify user state is actually null
      if (user !== null) {
        console.warn('User state not properly cleared, forcing null');
        setUser(null);
      }

      console.warn(
        'Manual logout successful - complete session cleanup performed'
      );
    } catch (error: any) {
      console.error(`Logout error (attempt ${retryCount + 1}):`, error);

      // Implement retry logic for failed logout attempts
      if (retryCount < maxRetries) {
        console.warn(`Retrying logout... (${retryCount + 1}/${maxRetries})`);
        // Exponential backoff: wait longer between retries
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          return await logout(retryCount + 1);
        } catch (retryError) {
          // If retry also fails, continue to error handling below
          console.error('Retry failed:', retryError);
        }
      }

      // Create user-friendly error messages with actionable guidance
      let userFriendlyMessage = 'Failed to logout completely.';
      let actionableGuidance = 'Please try again or refresh the page.';

      if (
        error.message?.includes('localStorage') ||
        error.message?.includes('storage')
      ) {
        userFriendlyMessage = 'Unable to clear session data from your browser.';
        actionableGuidance =
          'Try refreshing the page or clearing your browser cache, then attempt logout again.';
      } else if (
        error.message?.includes('network') ||
        error.message?.includes('fetch')
      ) {
        userFriendlyMessage = 'Network error during logout.';
        actionableGuidance = 'Check your internet connection and try again.';
      } else if (retryCount >= maxRetries) {
        userFriendlyMessage = 'Logout failed after multiple attempts.';
        actionableGuidance =
          'Please refresh the page or close your browser to ensure you are logged out securely.';
      }

      const enhancedError = new Error(
        `${userFriendlyMessage} ${actionableGuidance}`
      );
      enhancedError.name = 'LogoutError';
      (enhancedError as any).originalError = error;
      (enhancedError as any).retryCount = retryCount;
      (enhancedError as any).actionableGuidance = actionableGuidance;

      setError(enhancedError.message);

      // Force cleanup even if logout failed - critical for security
      try {
        setUser(null);
        setError(null);

        // Emergency cleanup: try to clear storage even on error
        try {
          localStorage.removeItem('manualAuthUser');
          sessionStorage.removeItem('manualAuthUser');
        } catch (emergencyCleanupError) {
          console.error('Emergency cleanup failed:', emergencyCleanupError);
        }

        console.warn('Forced user state cleanup completed');
      } catch (cleanupError) {
        console.error('Failed to cleanup user state:', cleanupError);
      }

      throw enhancedError;
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
        console.warn('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired');
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
      
      console.warn('OTP sent to:', formattedPhone);
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
      console.warn('Phone number verified successfully');
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
      console.warn('Email login successful');
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
      
      console.warn('Email registration successful');
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
      console.warn('User logged out');
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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

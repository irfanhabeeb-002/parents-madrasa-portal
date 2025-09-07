import React, { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User, AuthState, SignupCredentials } from '../types/user';

interface AuthContextType extends AuthState {
  sendOTP: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string, userData?: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Create user document in Firestore
  const createUserDocument = async (
    firebaseUser: FirebaseUser, 
    userData: SignupCredentials
  ): Promise<User> => {
    const userRecord: User = {
      uid: firebaseUser.uid,
      name: userData.name,
      phone: userData.phone,
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userRecord);
    return userRecord;
  };

  // Setup reCAPTCHA verifier
  const setupRecaptcha = (elementId: string): RecaptchaVerifier => {
    return new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
      }
    });
  };

  // Send OTP to phone number
  const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      // Format phone number to include country code if not present
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+880${phoneNumber}`;
      
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return confirmationResult;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Verify OTP and complete authentication
  const verifyOTP = async (
    confirmationResult: ConfirmationResult, 
    otp: string, 
    userData?: SignupCredentials
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const userCredential = await confirmationResult.confirm(otp);
      
      // Check if user already exists
      let user = await fetchUserData(userCredential.user);
      
      // If user doesn't exist and we have signup data, create new user
      if (!user && userData) {
        user = await createUserDocument(userCredential.user, userData);
      }
      
      if (!user) {
        throw new Error('User data not found. Please sign up first.');
      }
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await signOut(auth);
      dispatch({ type: 'SET_USER', payload: null });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        dispatch({ type: 'SET_USER', payload: userData });
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    ...state,
    sendOTP,
    verifyOTP,
    logout,
    setupRecaptcha
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
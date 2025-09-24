import { enableIndexedDbPersistence } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Initialize Firebase with offline persistence and error handling
 */
export async function initializeFirebase(): Promise<void> {
  // Skip Firebase initialization if not configured (development mode)
  if (!db) {
    console.warn('Firebase not configured - skipping persistence setup');
    return;
  }

  try {
    // Enable offline persistence for Firestore
    await enableIndexedDbPersistence(db);

    console.warn('Firebase initialized with offline persistence');
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firebase persistence failed: Multiple tabs open');
    } else if (error.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Firebase persistence not supported in this browser');
    } else {
      console.error('Firebase persistence error:', error);
    }
  }
}

/**
 * Check if Firebase is properly configured
 */
export function validateFirebaseConfig(): boolean {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingVars = requiredEnvVars.filter(
    envVar => !import.meta.env[envVar]
  );

  if (missingVars.length > 0) {
    console.error('Missing Firebase environment variables:', missingVars);
    return false;
  }

  return true;
}

/**
 * Get Firebase project configuration info
 */
export function getFirebaseConfig() {
  return {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    isDevelopment: import.meta.env.DEV,
    isEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
  };
}

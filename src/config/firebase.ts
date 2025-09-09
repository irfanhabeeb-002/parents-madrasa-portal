import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration from environment variables
let firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const isPlaceholder = (value: string | undefined): boolean => {
    return !value || 
           value === 'your_api_key_here' || 
           value.includes('your_') || 
           value === 'your_project.firebaseapp.com' ||
           value === 'your_project_id' ||
           value === 'your_project.appspot.com' ||
           value === 'your_sender_id' ||
           value === 'your_app_id' ||
           value === 'your_measurement_id';
  };

  return requiredEnvVars.every(envVar => !isPlaceholder(import.meta.env[envVar]));
};

// Only initialize Firebase if properly configured
if (!isFirebaseConfigured()) {
  console.warn(
    '🔥 Firebase not configured - authentication will use mock mode for development'
  );
  console.warn(
    '📝 To use Firebase Authentication, update the .env file with your Firebase configuration'
  );
  console.warn(
    '📖 See FIREBASE_SETUP.md for detailed setup instructions'
  );
}

// Initialize Firebase only if configured
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage };

// Initialize Firebase Cloud Messaging (only if supported)
let messaging: ReturnType<typeof getMessaging> | null = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export { messaging };

// Connect to emulators in development (only if Firebase is configured)
if (import.meta.env.DEV && isFirebaseConfigured() && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  // Only connect to emulators if not already connected
  try {
    if (auth) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
  } catch (error) {
    // Emulator already connected or not available
    console.log('Auth emulator connection skipped:', error);
  }

  try {
    if (db) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    // Emulator already connected or not available
    console.log('Firestore emulator connection skipped:', error);
  }

  try {
    if (storage) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    // Emulator already connected or not available
    console.log('Storage emulator connection skipped:', error);
  }
}

export default app;
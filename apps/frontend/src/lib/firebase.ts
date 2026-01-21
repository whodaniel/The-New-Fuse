import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED, Firestore } from 'firebase/firestore';

// Default configuration with hardcoded values as fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC4h4qMlMj0kSrvIlwdooJ9uiZn0XqoA8o',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'the-new-fuse-2025.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'the-new-fuse-2025',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'the-new-fuse-2025.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '241337102384',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:241337102384:web:232e153c82083f9e00fdf5'
};

// Initialize Firebase (with hot-reload protection)
let app: FirebaseApp;
try {
  app = getApp(); // Try to get existing app first
} catch {
  app = initializeApp(firebaseConfig); // Initialize if doesn't exist
}

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with proper error handling
let db: Firestore;

try {
  // Check if Firestore is already initialized to avoid duplicate initialization error
  try {
    db = getFirestore(app);
  } catch (e) {
    // Not initialized yet, try with custom settings
    console.warn('Standard getFirestore failed, attempting initializeFirestore...', e);
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });
    } catch (initError) {
      console.error('Failed to initialize Firestore with custom settings:', initError);
      // Last resort fallback
      db = getFirestore(app);
    }
  }
} catch (error) {
  console.error('[The New Fuse] Critical Firestore initialization error:', error);
  // Ensure db is defined even if initialization fails to prevent imports from crashing
  // Use a proxy or mock if necessary, but for now just log
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;

import { initializeApp, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import 'firebase/firestore'; // Ensure side-effects for component registration

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
let app;
try {
  app = getApp(); // Try to get existing app first
} catch {
  app = initializeApp(firebaseConfig); // Initialize if doesn't exist
}

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with proper error handling
let db;
try {
  // Check if Firestore is already initialized in the default app
  try {
      db = getFirestore(app);
      console.log('Firestore already initialized, reusing instance.');
  } catch (e) {
      // Not initialized, proceed to initialize
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });
  }
} catch (error: any) {
  console.warn('Firestore initialization warning:', error.message);
  try {
    // If complex initialization failed, try simple getFirestore again as last resort
    db = getFirestore(app);
  } catch (getError: any) {
    console.error('Failed to get Firestore instance:', getError);
    // If it still fails, it might be that the SDK component isn't registered.
    // The side-effect import above should prevent this, but if it happens, we can't do much.
  }
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;



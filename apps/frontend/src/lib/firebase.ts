import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// Default configuration with hardcoded values as fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC4h4qMlMj0kSrvIlwdooJ9uiZn0XqoA8o',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'the-new-fuse-2025.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'the-new-fuse-2025',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'the-new-fuse-2025.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '241337102384',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:241337102384:web:232e153c82083f9e00fdf5'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
let db;
try {
  // Attempt to initialize with our preferred settings
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  });
} catch (error: any) {
  // If we fail (e.g. "already exists"), just get the existing instance
  // This is safe because getFirestore returns the existing default instance
  // associated with the app if it exists.
  db = getFirestore(app);
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export signInWithPopup for convenience
export { signInWithPopup };

export default app;

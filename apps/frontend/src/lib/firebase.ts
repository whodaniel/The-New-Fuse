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
  // Try standard initialization first without special settings
  // This is the safest default behavior
  db = getFirestore(app);
} catch (getError) {
    // If standard initialization fails, it might be because we wanted to configure it first,
    // or the app is invalid.
    console.warn('Standard getFirestore failed, attempting initializeFirestore...', getError);

    try {
        db = initializeFirestore(app, {
             cacheSizeBytes: CACHE_SIZE_UNLIMITED
        });
    } catch (initError) {
        console.error('Failed to initialize Firestore:', initError);
        // We cannot recover easily if both fail, but db will be undefined
    }
}

// Optional: Apply long polling if really needed, but it should be done via initializeFirestore
// If we needed experimentalForceLongPolling, we should have done:
/*
try {
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
} catch (e) {
    db = getFirestore(app);
}
*/
// However, the previous code was failing in a way that suggested the "Service not available"
// might be due to race conditions or incorrect usage of getFirestore() after a failed initializeFirestore().
// By prioritizing getFirestore(app) (which is idempotent if already initialized), we are safer.

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;

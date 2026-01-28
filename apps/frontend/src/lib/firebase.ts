import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Sanity check for Firebase Config
const isEnvPlaceholder = (val: string | undefined) => !val || val.startsWith('${');

if (isEnvPlaceholder(firebaseConfig.apiKey)) {
  console.error(
    '[The New Fuse] Firebase API Key is missing! Auth will fail. Set VITE_FIREBASE_API_KEY.'
  );
}
if (isEnvPlaceholder(firebaseConfig.projectId)) {
  console.error(
    '[The New Fuse] Firebase Project ID is missing! Database will fail. Set VITE_FIREBASE_PROJECT_ID.'
  );
}

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
  // Only attempt Firestore init if we have a project ID
  if (!isEnvPlaceholder(firebaseConfig.projectId)) {
    // Ensure app is initialized before accessing Firestore
    const currentApp = getApp();

    try {
      // Try to get existing instance
      db = getFirestore(currentApp);
    } catch (e) {
      // If getting existing failed, try initializing
      try {
        db = initializeFirestore(currentApp, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
        });
      } catch (initError) {
        console.warn('[The New Fuse] Firestore init fallback:', initError);
        db = getFirestore(currentApp);
      }
    }
  } else {
    console.warn('[The New Fuse] Skipping Firestore init: Missing Project ID');
  }
} catch (error) {
  console.error('[The New Fuse] Critical Firestore initialization error - check project config:', error);
  // Prevent crash by creating a dummy object if needed, or letting it throw later
  // For now, allow it to be undefined and let explicit usage fail if critical
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;

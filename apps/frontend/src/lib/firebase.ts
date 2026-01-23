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

// Sanity check for Firebase API Key
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== '${VITE_FIREBASE_API_KEY}') {
  const key = firebaseConfig.apiKey;
  if (key.length < 30) {
    console.error(
      `[The New Fuse] Firebase API Key seems too short (${key.length} chars). Check Railway variables.`
    );
  } else {
    // Only log this once in production to reduce noise
    if (import.meta.env.DEV) {
      console.log(
        `[The New Fuse] Firebase config detected (Key starts with: ${key.substring(0, 8)}...)`
      );
    }
  }
} else {
  const isEnvPlaceholder = firebaseConfig.apiKey === '${VITE_FIREBASE_API_KEY}';
  console.error(
    `[The New Fuse] Firebase API Key is ${isEnvPlaceholder ? 'unresolved placeholder' : 'missing'}! Auth will fail. ` +
    'Action Required: Set VITE_FIREBASE_API_KEY in Railway environment variables and redeploy.'
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

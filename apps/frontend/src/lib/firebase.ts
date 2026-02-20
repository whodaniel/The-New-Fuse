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

// Initialize Firestore with proper error handling and lazy registration protection
let db: Firestore;

const initializeDB = (currentApp: FirebaseApp): Firestore => {
  try {
    // Try to get existing instance first
    return getFirestore(currentApp);
  } catch (e: any) {
    const errorMsg = e?.message || String(e);
    
    // Check if specifically not registered yet
    if (errorMsg.includes('not been registered')) {
      console.warn('[The New Fuse] Firestore component not yet registered, initializing...');
      return initializeFirestore(currentApp, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });
    }
    
    try {
      // If getting existing failed, try initializing
      return initializeFirestore(currentApp, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });
    } catch (initError) {
      // If initialization failed (e.g. already exists but getFirestore failed?), fallback
      console.warn('[The New Fuse] Firestore init fallback:', initError);
      return getFirestore(currentApp);
    }
  }
};

try {
  // Ensure app is initialized before accessing Firestore
  const currentApp = getApp();
  db = initializeDB(currentApp);
} catch (error) {
  console.error('[The New Fuse] Critical Firestore initialization error - check project config:', error);
  // As a last-ditch effort, try to initialize directly from the app variable
  try {
    db = getFirestore(app);
  } catch (finalError) {
    console.error('[The New Fuse] Final Firestore recovery failed:', finalError);
  }
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;

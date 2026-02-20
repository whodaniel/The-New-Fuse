import { initializeApp, getApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED, Firestore } from 'firebase/firestore';
import 'firebase/firestore'; // Side-effect import to ensure registration

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with proper error handling and lazy registration protection
let db: Firestore;

const initializeDB = (currentApp: FirebaseApp): Firestore => {
  try {
    // Standard initialization - often works if 'firebase/firestore' was imported
    return getFirestore(currentApp);
  } catch (e: any) {
    const errorMsg = e?.message || String(e);
    console.warn(`[The New Fuse] Firestore initialization warning: ${errorMsg}`);
    
    // Explicit initialization - required if getFirestore fails due to registration timing
    try {
      return initializeFirestore(currentApp, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });
    } catch (initError: any) {
      console.error('[The New Fuse] Firestore init fallback failed:', initError);
      // As an absolute last resort, return whatever getFirestore gives, or let it throw
      return getFirestore(currentApp);
    }
  }
};

try {
  db = initializeDB(app);
} catch (error) {
  console.error('[The New Fuse] Critical Firestore initialization error:', error);
  // @ts-ignore - Let it be undefined, but prevent top-level crash
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;

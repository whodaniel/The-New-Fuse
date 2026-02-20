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

const initializeDB = (currentApp: FirebaseApp): Firestore | undefined => {
  try {
    return getFirestore(currentApp);
  } catch (e: any) {
    try {
      return initializeFirestore(currentApp, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });
    } catch (initError: any) {
      // Failed to initialize, we'll return undefined to not crash
      return undefined;
    }
  }
};

try {
  db = initializeDB(app) as Firestore;
} catch (error) {
  // Silent catch
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;

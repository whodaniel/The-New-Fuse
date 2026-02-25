import { initializeApp, getApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, getRedirectResult, signInWithRedirect } from 'firebase/auth';
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

const isPlaceholder = (value?: string): boolean => {
  if (!value) return true;
  return /\$\{[^}]+\}/.test(value);
};

const isLikelyFirebaseApiKey = (value?: string): boolean => {
  if (!value) return false;
  const key = value.trim();
  // Most Firebase Web API keys begin with AIza and are ~39 chars.
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(key);
};

const hasUsableFirebaseConfig =
  !isPlaceholder(firebaseConfig.apiKey) &&
  !isPlaceholder(firebaseConfig.authDomain) &&
  !isPlaceholder(firebaseConfig.projectId) &&
  isLikelyFirebaseApiKey(firebaseConfig.apiKey);

// Sanity check for Firebase API Key
if (hasUsableFirebaseConfig) {
  const key = firebaseConfig.apiKey;
  // Only log this once in production to reduce noise
  if (import.meta.env.DEV) {
    console.log(
      `[The New Fuse] Firebase config detected (Key starts with: ${key.substring(0, 8)}...)`
    );
  }
} else {
  console.error(
    '[The New Fuse] Firebase config missing/invalid. Skipping Firebase initialization on this build. ' +
      'Set valid VITE_FIREBASE_* values in deployment env to enable Firebase auth.'
  );
}

// On connect subdomain we intentionally avoid hard Firebase boot requirements.
const isConnectHost =
  typeof window !== 'undefined' &&
  /^connect\.thenewfuse\.com$/i.test(String(window.location.hostname || ''));

let app: FirebaseApp | null = null;
try {
  if (!isConnectHost && hasUsableFirebaseConfig) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } else if (import.meta.env.DEV && isConnectHost) {
    console.warn('[The New Fuse] Skipping Firebase initialization on connect subdomain.');
  }
} catch (error) {
  console.error('[The New Fuse] Firebase initializeApp failed:', error);
}

// Initialize Auth (safe fallback keeps app usable even when Firebase is misconfigured)
export const auth = app
  ? getAuth(app)
  : (null as unknown as ReturnType<typeof getAuth>);

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
  if (app) {
    db = initializeDB(app) as Firestore;
  }
} catch (_error) {
  // Keep optional
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithRedirect, getRedirectResult };

export default app;

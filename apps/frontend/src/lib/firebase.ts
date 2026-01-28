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
let db: Firestore | undefined;

// Disabled automatic initialization as Firestore is not currently used
// Uncomment logic below if Firestore is needed in the future

try {
  // Only attempt Firestore init if we have a project ID
  if (!isEnvPlaceholder(firebaseConfig.projectId)) {
     // console.log('[The New Fuse] Firestore initialization skipped (unused)');
  }
} catch (error) {
  // console.error('[The New Fuse] Critical Firestore initialization error - check project config:', error);
}

export { db };
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };

export default app;

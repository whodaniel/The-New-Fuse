import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';

// Fallback Firebase configuration for development

const firebaseConfig = {
  apiKey: 'AIzaSyC4h4qMlMj0kSrvIlwdooJ9uiZn0XqoA8o',
  authDomain: 'the-new-fuse-2025.firebaseapp.com',
  projectId: 'the-new-fuse-2025',
  storageBucket: 'the-new-fuse-2025.firebasestorage.app',
  messagingSenderId: '241337102384',
  appId: '1:241337102384:web:232e153c82083f9e00fdf5'
};

// Try to override with environment variables if available
try {
  if (import.meta && import.meta.env) {
    firebaseConfig.apiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
    firebaseConfig.authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain;
    firebaseConfig.projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    firebaseConfig.storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
    firebaseConfig.messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId;
    firebaseConfig.appId = import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId;
  }
} catch (error) {
  console.log('Using fallback Firebase configuration');
}

// Validate required Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is missing. Please check your environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

let db;
try {
  // Initialize Firestore with settings
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Keep this as it seems intentional for your env
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  });
} catch (error: any) {
  // If already initialized, use the existing instance
  if (error.code === 'failed-precondition' || error.message?.includes('already exists')) {
     db = getFirestore(app);
  } else {
    console.error('Firestore initialization failed:', error);
    // Fallback
    db = getFirestore(app);
  }
}

export { db };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export signInWithPopup for convenience
export { signInWithPopup };

export default app;

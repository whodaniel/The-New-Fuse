import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';

// Fallback Firebase configuration for development
const firebaseConfig = {
  apiKey: 'AIzaSyA1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  authDomain: 'thenewfuse.firebaseapp.com',
  projectId: 'thenewfuse',
  storageBucket: 'thenewfuse.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef123456'
};

// Try to override with environment variables if available
try {
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
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
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export signInWithPopup for convenience
export { signInWithPopup };

export default app;

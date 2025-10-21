import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "REDACTED-FIREBASE-KEY-1",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "the-new-fuse-2025.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "the-new-fuse-2025",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "the-new-fuse-2025.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1003514421915",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1003514421915:web:9f5b9f9f9f9f9f9f9f9f9f"
};

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
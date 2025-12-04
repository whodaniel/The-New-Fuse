import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';
var firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
// Validate required Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.error('Firebase configuration is missing. Please check your environment variables.');
}
// Initialize Firebase
var app = initializeApp(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
export var auth = getAuth(app);
// Initialize Cloud Firestore and get a reference to the service
export var db = getFirestore(app);
// Google Auth Provider
export var googleProvider = new GoogleAuthProvider();
// Export signInWithPopup for convenience
export { signInWithPopup };
export default app;

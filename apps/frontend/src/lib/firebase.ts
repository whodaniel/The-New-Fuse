import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "REDACTED-FIREBASE-KEY-1",
    authDomain: "the-new-fuse-2025.firebaseapp.com",
    projectId: "the-new-fuse-2025",
    storageBucket: "the-new-fuse-2025.appspot.com",
    messagingSenderId: "1003514421915",
    appId: "1:1003514421915:web:9f5b9f9f9f9f9f9f9f9f9f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    prompt: 'select_account'
});

export { auth, googleProvider };
export default app;

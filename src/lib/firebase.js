import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "REDACTED-FIREBASE-KEY-2",
    authDomain: "the-new-fuse-2025.firebaseapp.com",
    projectId: "the-new-fuse-2025",
    storageBucket: "the-new-fuse-2025.firebasestorage.app",
    messagingSenderId: "241337102384",
    appId: "1:241337102384:web:232e153c82083f9e00fdf5",
    measurementId: "G-4SE9JEJH6N"
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
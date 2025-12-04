import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';
declare const app: import("@firebase/app").FirebaseApp;
export declare const auth: import("@firebase/auth").Auth;
export declare const db: import("@firebase/firestore").Firestore;
export declare const googleProvider: GoogleAuthProvider;
export { signInWithPopup };
export default app;

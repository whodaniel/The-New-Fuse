import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, } from 'firebase/auth';
import { auth } from '@/lib/firebase';
export function useFirebaseAuth(): any {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    const signIn = async (email, password) => {
        try {
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        }
        catch (err) {
            setError({ code: err.code, message: err.message });
            throw err;
        }
    };
    const signInWithGoogle = async () => {
        try {
            setError(null);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            return result.user;
        }
        catch (err) {
            setError({ code: err.code, message: err.message });
            throw err;
        }
    };
    const signUp = async (email, password) => {
        try {
            setError(null);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return result.user;
        }
        catch (err) {
            setError({ code: err.code, message: err.message });
            throw err;
        }
    };
    const resetPassword = async (email) => {
        try {
            setError(null);
            await sendPasswordResetEmail(auth, email);
        }
        catch (err) {
            setError({ code: err.code, message: err.message });
            throw err;
        }
    };
    const logout = async () => {
        try {
            setError(null);
            await signOut(auth);
        }
        catch (err) {
            setError({ code: err.code, message: err.message });
            throw err;
        }
    };
    return {
        user,
        loading,
        error,
        signIn,
        signInWithGoogle,
        signUp,
        resetPassword,
        logout,
    };
}
//# sourceMappingURL=useFirebaseAuth.js.map
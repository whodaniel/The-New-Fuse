import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.js';
import { auth, googleProvider, signInWithPopup } from '../../lib/firebase.js';

const LoginPage = () => {
    const navigate = useNavigate();
    const { setToken } = useAuth();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [userId, setUserId] = useState('');

    const handleGoogleLogin = async () => {
        try {
            setError(null);
            setIsLoading(true);
            
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Check if 2FA is enabled for this user
            const idTokenResult = await user.getIdTokenResult();
            if (idTokenResult.claims['2faEnabled']) {
                setUserId(user.uid);
                setRequires2FA(true);
                return;
            }

            const token = await user.getIdToken();
            setToken(token);
            navigate('/workspace');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handle2FASubmit = async (code: string) => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code })
            });

            if (!response.ok) {
                throw new Error('Invalid 2FA code');
            }

            const token = await auth.currentUser?.getIdToken();
            setToken(token);
            navigate('/workspace');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>
                {error && (
                    <div className="rounded-md bg-red-50 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}
                {requires2FA ? (
                    <div>
                        <h3 className="text-lg font-medium mb-4">Enter 2FA Code</h3>
                        <input
                            type="text"
                            className="w-full p-2 border rounded mb-4"
                            placeholder="Enter 2FA code"
                            maxLength={6}
                            onInput={(e) => {
                                const value = e.target.value;
                                if (/^\d{0,6}$/.test(value)) {
                                    e.target.value = value;
                                } else {
                                    e.target.value = value.slice(0, -1);
                                }
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handle2FASubmit(e.target.value);
                                }
                            }}
                        />
                        <button
                            onClick={() => handle2FASubmit(userId)}
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} transition-colors duration-200`}
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </div>
                            ) : (
                                'Verify 2FA'
                            )}
                        </button>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} transition-colors duration-200`}
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign in with Google'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
//# sourceMappingURL=index.js.map

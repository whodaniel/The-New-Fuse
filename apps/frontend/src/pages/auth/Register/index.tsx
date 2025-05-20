import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../AuthContext.js';
import { auth, googleProvider } from '../../../lib/firebase.js';
import { signInWithPopup } from 'firebase/auth';
const RegisterPage = () => {
    const navigate = useNavigate();
    const { setToken } = useAuth();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleGoogleRegister = async () => {
        try {
            setError(null);
            setIsLoading(true);
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            setToken(token);
            navigate('/workspace');
        }
        catch (err) {
            console.error('Registration error:', err);
            setError('Failed to register with Google. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button onClick={() => navigate('/login')} className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </button>
          </p>
        </div>
        {error && (<div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>)}
        <div>
          <button onClick={handleGoogleRegister} disabled={isLoading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} transition-colors duration-200`}>
            {isLoading ? (<div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </div>) : ('Sign up with Google')}
          </button>
        </div>
      </div>
    </div>);
};
export default RegisterPage;
//# sourceMappingURL=index.js.map
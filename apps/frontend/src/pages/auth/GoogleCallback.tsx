import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setToken } = useAuth();
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setToken(token);
            navigate('/dashboard');
        }
        else {
            const error = searchParams.get('error');
            console.error('Authentication error:', error);
            navigate('/login?error=' + (error || 'auth_failed'));
        }
    }, [searchParams, navigate, setToken]);
    return (<div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Processing authentication...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>);
};
export default GoogleCallback;
//# sourceMappingURL=GoogleCallback.js.map
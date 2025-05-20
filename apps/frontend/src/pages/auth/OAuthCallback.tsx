import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');
        if (error) {
            console.error('Authentication failed:', error);
            navigate('/login?error=auth_failed');
            return;
        }
        if (token) {
            login(token);
            navigate('/dashboard');
        }
        else {
            navigate('/login');
        }
    }, [location, navigate, login]);
    return (<div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>);
};
export default OAuthCallback;
//# sourceMappingURL=OAuthCallback.js.map
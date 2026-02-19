import { useNavigate, useSearchParams } from 'react-router-dom';
// import { useAuth } from '@/hooks/useAuth';

/**
 * Basic JWT structure validation (does NOT verify signature - that's done server-side)
 * Just checks that the token has the expected format: header.payload.signature
 */
const isValidJwtFormat = (token: string): boolean => {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Check if each part is valid base64
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    // Basic structure check
    return !!(header && payload && typeof payload === 'object');
  } catch {
    return false;
  }
};

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // const { signInWithGoogle } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Validate token format before storing
      if (!isValidJwtFormat(token)) {
        console.error('Invalid token format received');
        navigate('/login?error=invalid_token_format');
        return;
      }
      
      // Additional check: ensure token doesn't contain obvious XSS attempts
      if (token.includes('<script') || token.includes('javascript:')) {
        console.error('Token contains suspicious content');
        navigate('/login?error=invalid_token');
        return;
      }
      
      localStorage.setItem('auth_token', token);
      navigate('/dashboard');
    } else {
      const error = searchParams.get('error');
      console.error('Authentication error:', error);
      navigate('/login?error=' + (error || 'auth_failed'));
    }
  }, [searchParams, navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Processing authentication...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
};

export default GoogleCallback;

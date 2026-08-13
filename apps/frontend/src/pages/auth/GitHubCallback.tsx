import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import { useAuth } from '@/hooks/useAuth';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('auth_token', token);
      navigate('/dashboard');
    } else {
      const error = searchParams.get('error');
      console.error('GitHub authentication error:', error);
      navigate('/login?error=' + (error || 'auth_failed'));
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Processing GitHub authentication...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
};

export default GitHubCallback;

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const extractCallbackError = (location: { search: string; hash: string }): string | null => {
  const search = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  return (
    search.get('error_description') ||
    search.get('error') ||
    hash.get('error_description') ||
    hash.get('error')
  );
};

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, handleSSOCallback } = useAuth();
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const error = extractCallbackError(location);
      if (error) {
        console.error('Authentication failed:', error);
        navigate(`/auth/login?error=${encodeURIComponent(error)}`, { replace: true });
        return;
      }
      // Legacy token callback compatibility
      const legacyToken = params.get('token');
      if (legacyToken) {
        await login(legacyToken);
        navigate('/dashboard', { replace: true });
        return;
      }
      // Supabase OAuth callback flow
      await handleSSOCallback('supabase', '');
      navigate('/dashboard', { replace: true });
    };
    run().catch(() => navigate('/auth/login?error=auth_failed', { replace: true }));
  }, [location, navigate, login, handleSSOCallback]);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};
export default OAuthCallback;

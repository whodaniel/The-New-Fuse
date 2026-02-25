import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const error = params.get('error') || params.get('error_description');
      if (error) {
        console.error('Authentication failed:', error);
        navigate('/auth/login?error=auth_failed', { replace: true });
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
      if (supabase) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && data?.session?.access_token) {
          await login(data.session.access_token);
          navigate('/dashboard', { replace: true });
          return;
        }
      }
      navigate('/auth/login', { replace: true });
    };
    run().catch(() => navigate('/auth/login?error=auth_failed', { replace: true }));
  }, [location, navigate, login]);
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

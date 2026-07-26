import { useAuth } from '@/hooks/useAuth';
import { consumeDeepLinkNext } from '@/services/authSession';
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
      const hashParams = new URLSearchParams(
        location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
      );
      const next = consumeDeepLinkNext('/dashboard');
      const error = extractCallbackError(location);
      if (error) {
        console.error('Authentication failed:', error);
        navigate(`/auth/login?error=${encodeURIComponent(error)}`, { replace: true });
        return;
      }
      const legacyToken = params.get('token');
      if (legacyToken) {
        await login(legacyToken);
        navigate(next, { replace: true });
        return;
      }
      const magicLinkToken = hashParams.get('access_token');
      if (magicLinkToken) {
        await login(magicLinkToken);
        navigate(next, { replace: true });
        return;
      }
      const magicToken = hashParams.get('token');
      if (magicToken) {
        await login(magicToken);
        navigate(next, { replace: true });
        return;
      }
      const code = params.get('code');
      if (code) {
        await handleSSOCallback('supabase', code);
        navigate(next, { replace: true });
        return;
      }
      const type = hashParams.get('type') || params.get('type');
      if (type === 'magiclink' || type === 'recovery' || type === 'signup') {
        await handleSSOCallback('supabase', '');
        navigate(next, { replace: true });
        return;
      }
      console.error('OAuthCallback: No code, token, or access_token found in URL');
      navigate('/auth/login?error=no_auth_data', { replace: true });
    };
    run().catch((err) => {
      console.error('OAuth callback handling failed:', err);
      navigate('/auth/login?error=auth_failed', { replace: true });
    });
  }, [location, navigate, login, handleSSOCallback]);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Connecting…</h2>
        <p>Authorizing this device and injecting your session.</p>
      </div>
    </div>
  );
};
export default OAuthCallback;

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Basic JWT structure validation (does NOT verify signature - that's done server-side)
 * Just checks that the token has the expected format: header.payload.signature
 */
const isValidJwtFormat = (token: string): boolean => {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const decodePart = (value: string) =>
      atob(
        value
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(value.length + ((4 - (value.length % 4)) % 4), '=')
      );
    // Check if each part is valid base64
    const header = JSON.parse(decodePart(parts[0]));
    const payload = JSON.parse(decodePart(parts[1]));

    // Basic structure check
    return !!(header && payload && typeof payload === 'object');
  } catch {
    return false;
  }
};

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, handleSSOCallback } = useAuth();

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get('token');
      if (token) {
        // Validate token format before using token auth flow.
        if (!isValidJwtFormat(token)) {
          console.error('Invalid token format received');
          navigate('/auth/login?error=invalid_token_format', { replace: true });
          return;
        }

        if (token.includes('<script') || token.includes('javascript:')) {
          console.error('Token contains suspicious content');
          navigate('/auth/login?error=invalid_token', { replace: true });
          return;
        }

        await login(token);
        navigate('/dashboard', { replace: true });
        return;
      }

      const searchError = searchParams.get('error') || searchParams.get('error_description');
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashError = hashParams.get('error') || hashParams.get('error_description');
      const authError = searchError || hashError;

      if (authError) {
        console.error('Authentication error:', authError);
        navigate('/auth/login?error=' + encodeURIComponent(authError), { replace: true });
        return;
      }

      // Magic link: token may come in hash as access_token
      const magicLinkToken = hashParams.get('access_token');
      if (magicLinkToken) {
        await login(magicLinkToken);
        navigate('/dashboard', { replace: true });
        return;
      }

      // Magic link: token may also come as 'token' in hash
      const magicToken = hashParams.get('token');
      if (magicToken) {
        await login(magicToken);
        navigate('/dashboard', { replace: true });
        return;
      }

      // Supabase OAuth callback flow (uses ?code= query param)
      const code = searchParams.get('code');
      if (code) {
        await handleSSOCallback('supabase', code);
        navigate('/dashboard', { replace: true });
        return;
      }

      // No valid auth data found
      console.error('GoogleCallback: No code, token, or access_token found in URL');
      navigate('/auth/login?error=no_auth_data', { replace: true });
    };

    run().catch((error) => {
      console.error('Google callback handling failed:', error);
      navigate('/auth/login?error=auth_failed', { replace: true });
    });
  }, [searchParams, navigate, login, handleSSOCallback]);

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

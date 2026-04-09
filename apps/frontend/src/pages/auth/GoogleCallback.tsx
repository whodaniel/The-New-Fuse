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

      localStorage.setItem('auth_token', token);
      navigate('/dashboard');
    } else {
      const error = searchParams.get('error');
      if (error) {
        console.warn('Authentication error:', error);
      }
      navigate('/auth/login?error=' + (error || 'auth_failed'));
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

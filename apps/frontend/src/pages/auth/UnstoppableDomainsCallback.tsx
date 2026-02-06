import { GlassCard } from '@/components/ui/premium';
import { useAuth } from '@/providers/AuthProvider';
import { unstoppableDomainsService } from '@/services/unstoppableDomains.service';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Callback page for Unstoppable Domains OAuth flow
 * Handles the redirect after user authenticates with Unstoppable Domains
 */
const UnstoppableDomainsCallback: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithUnstoppableDomains } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get user data from Unstoppable Domains
        const udUser = await unstoppableDomainsService.loginCallback();

        // Authenticate with your backend
        if (loginWithUnstoppableDomains) {
          await loginWithUnstoppableDomains(udUser);
        }

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        console.error('Unstoppable Domains callback error:', err);
        setError(err.message || 'Authentication failed');

        // Redirect to login after error
        setTimeout(() => {
          navigate('/auth/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, loginWithUnstoppableDomains]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-4">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full z-10">
        <GlassCard className="p-8 space-y-6">
          <div className="text-center">
            {error ? (
              <>
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
                <p className="text-gray-400 text-sm">{error}</p>
                <p className="text-gray-500 text-xs mt-2">Redirecting to login...</p>
              </>
            ) : (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-spin" />
                <h2 className="text-2xl font-bold text-white mb-2">Completing Authentication</h2>
                <p className="text-gray-400 text-sm">
                  Please wait while we verify your Unstoppable Domain...
                </p>
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default UnstoppableDomainsCallback;

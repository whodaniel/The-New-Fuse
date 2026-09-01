import { API_ENDPOINTS } from '@/config/api';
import { authFetch } from '@/utils/authToken';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';

type MembershipState = {
  active: boolean;
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
};

interface RequireMembershipProps {
  children: React.ReactNode;
  fallback?: string;
}

export const RequireMembership: React.FC<RequireMembershipProps> = ({
  children,
  fallback = '/membership',
}) => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { isSuperAdmin } = useAuthorization();
  const [membership, setMembership] = useState<MembershipState | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const shouldBypass = useMemo(() => isSuperAdmin, [isSuperAdmin]);

  useEffect(() => {
    let canceled = false;

    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      if (!canceled) {
        setRedirectTo('/auth/login');
        setIsChecking(false);
      }
      return;
    }

    if (shouldBypass) {
      if (!canceled) {
        setMembership({ active: true, tier: 'ENTERPRISE' });
        setIsChecking(false);
        setRedirectTo(null);
      }
      return;
    }

    setIsChecking(true);

    const checkMembership = async () => {
      try {
        // Use the centralized API endpoint (resolves to absolute VITE_API_URL in
        // production) so this call never hits the broken Cloudflare Pages /api proxy.
        const response = await authFetch(API_ENDPOINTS.BILLING.MEMBERSHIP_ME, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            // A 401 here means the JWT itself is invalid or expired — the token did
            // not survive the trip to the canonical API origin.  Only then is a
            // logout appropriate.  A network/proxy failure that happens to surface as
            // 401 must not silently destroy a valid session, so we verify auth state
            // with /auth/me before acting.
            console.warn(
              '[RequireMembership] 401 from membership endpoint – verifying auth before logout'
            );
            if (!canceled) {
              try {
                const meResponse = await authFetch(API_ENDPOINTS.AUTH.ME, {
                  credentials: 'include',
                });
                if (!meResponse.ok) {
                  // /auth/me also rejected → the session is genuinely invalid.
                  if (logout) logout();
                  setMembership(null);
                  setRedirectTo('/auth/login?error=auth_failed');
                } else {
                  // /auth/me is fine → membership endpoint had a transient problem.
                  // Treat user as STARTER (unauthenticated from a membership POV)
                  // and redirect to the membership onboarding page rather than logout.
                  setMembership({ active: false, tier: 'STARTER' });
                  setRedirectTo(fallback);
                }
              } catch {
                // Network failure during the verification check – don't logout.
                setMembership({ active: false, tier: 'STARTER' });
                setRedirectTo(fallback);
              }
              setIsChecking(false);
            }
            return;
          }
          if (response.status === 403) {
            if (!canceled) {
              setMembership({ active: false, tier: 'STARTER' });
              setRedirectTo(fallback);
            }
            return;
          }
          throw new Error(`Membership check failed with status ${response.status}`);
        }

        const payload = await response.json();
        const data = payload?.data ?? payload;

        if (!canceled) {
          const active = Boolean(data?.active);
          setMembership({
            active,
            tier: (data?.tier as 'STARTER' | 'PRO' | 'ENTERPRISE') || 'STARTER',
          });
          if (!active) {
            setRedirectTo(fallback);
          } else {
            setRedirectTo(null);
          }
        }
      } catch {
        if (!canceled) {
          // Network or unexpected error — don't logout; redirect to membership page.
          setMembership({ active: false, tier: 'STARTER' });
          setRedirectTo(fallback);
        }
      } finally {
        if (!canceled) {
          setIsChecking(false);
        }
      }
    };

    checkMembership();

    return () => {
      canceled = true;
    };
  }, [isAuthenticated, isLoading, shouldBypass, fallback]);

  useEffect(() => {
    if (redirectTo && !isLoading && !isChecking) {
      window.location.replace(redirectTo);
    }
  }, [redirectTo, isLoading, isChecking]);

  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (redirectTo) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!membership?.active) {
    return null;
  }

  return <>{children}</>;
};

export default RequireMembership;

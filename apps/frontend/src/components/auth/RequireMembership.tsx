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
  const { isAuthenticated, isLoading } = useAuth();
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
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/billing/membership/me', {
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            if (!canceled) {
              setMembership(null);
              setRedirectTo('/auth/login');
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

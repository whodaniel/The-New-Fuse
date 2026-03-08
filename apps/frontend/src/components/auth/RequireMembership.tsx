import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
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

  const shouldBypass = useMemo(() => isSuperAdmin, [isSuperAdmin]);

  useEffect(() => {
    let canceled = false;

    const checkMembership = async () => {
      if (!isAuthenticated || shouldBypass) {
        if (!canceled) {
          setMembership({ active: true, tier: 'ENTERPRISE' });
          setIsChecking(false);
        }
        return;
      }

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
          throw new Error(`Membership check failed with status ${response.status}`);
        }

        const payload = await response.json();
        const data = payload?.data ?? payload;

        if (!canceled) {
          setMembership({
            active: Boolean(data?.active),
            tier: (data?.tier as 'STARTER' | 'PRO' | 'ENTERPRISE') || 'STARTER',
          });
        }
      } catch {
        if (!canceled) {
          setMembership({ active: false, tier: 'STARTER' });
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
  }, [isAuthenticated, shouldBypass]);

  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!membership?.active) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default RequireMembership;

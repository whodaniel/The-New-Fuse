import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { sessionManager, Session } from '@your-org/security';
import { useToast } from './ui/use-toast.js';

interface SessionProviderProps {
  children: React.ReactNode;
  initialSession?: Session;
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (initialSession) {
      sessionManager.setSession(initialSession);
    }

    const handleSessionExpired = async () => {
      toast({
        title: 'Session Expired',
        description: 'Please log in again to continue',
        variant: 'destructive'
      });

      try {
        await sessionManager.clearSession();
        router.push('/login');
      } catch (error) {
        console.error('Error handling expired session:', error);
      }
    };

    const handleSessionRefresh = () => {
      toast({
        title: 'Session Refreshed',
        description: 'Your session has been extended',
        variant: 'success'
      });
    };

    sessionManager.on('expired', handleSessionExpired);
    sessionManager.on('refreshed', handleSessionRefresh);

    return () => {
      sessionManager.off('expired', handleSessionExpired);
      sessionManager.off('refreshed', handleSessionRefresh);
    };
  }, [initialSession, router, toast]);

  return <>{children}</>;
}
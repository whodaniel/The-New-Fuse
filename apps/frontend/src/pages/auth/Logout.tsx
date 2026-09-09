import { useAuth } from '@/hooks/useAuth';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const performLogout = async () => {
      try {
        await logout();
      } catch (err) {
        console.error('[Logout] Error during sign out:', err);
      } finally {
        if (active) {
          navigate('/auth/login', { replace: true });
        }
      }
    };

    performLogout();

    return () => {
      active = false;
    };
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm rounded-md border border-slate-800 bg-slate-900 p-6 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        <h2 className="text-lg font-medium text-white">Signing out...</h2>
        <p className="mt-1 text-sm text-slate-400">Clearing session and redirecting to login</p>
      </div>
    </div>
  );
};

export default Logout;

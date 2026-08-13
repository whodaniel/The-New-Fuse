import { LogIn, LogOut } from 'lucide-react';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarAuthProps {
  collapsed: boolean;
}

const SidebarAuth: React.FC<SidebarAuthProps> = ({ collapsed }) => {
  const { user, loading, error, isConfigured, isAuthenticated, loginWithGoogle, logout } =
    useAuth();

  if (!isConfigured) {
    if (collapsed) return null;
    return (
      <div className="sidebar-auth sidebar-auth-muted" title="Supabase env vars not configured">
        <span className="sidebar-auth-label">Auth unavailable</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sidebar-auth sidebar-auth-muted">
        {!collapsed ? <span className="sidebar-auth-label">Signing in…</span> : null}
      </div>
    );
  }

  if (isAuthenticated && user) {
    const initial = (user.name || user.email || '?').charAt(0).toUpperCase();
    return (
      <div className="sidebar-auth">
        <div className="sidebar-auth-user" title={user.email}>
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="sidebar-auth-avatar" />
          ) : (
            <span className="sidebar-auth-avatar sidebar-auth-initial">{initial}</span>
          )}
          {!collapsed ? (
            <div className="sidebar-auth-meta">
              <span className="sidebar-auth-name">{user.name || user.email}</span>
              <span className="sidebar-auth-email">{user.email}</span>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="sidebar-auth-btn"
          onClick={() => void logout()}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
          {!collapsed ? <span>Sign out</span> : null}
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-auth">
      <button
        type="button"
        className="sidebar-auth-btn sidebar-auth-primary"
        onClick={() => void loginWithGoogle()}
        aria-label="Sign in with Google"
        title="Sign in with Google"
      >
        <LogIn size={16} />
        {!collapsed ? <span>Sign in</span> : null}
      </button>
      {!collapsed && error ? (
        <span className="sidebar-auth-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
};

export default SidebarAuth;

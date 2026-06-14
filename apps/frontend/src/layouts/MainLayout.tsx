// @ts-nocheck
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';

const TNF_LOGO_URL = 'https://thenewfuse.com/assets/brand/tnf-logo.png';

const MainLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30">
      {/* Premium TNF Header */}
      <nav className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                  <img className="h-5 w-5" src={TNF_LOGO_URL} alt="TNF" />
                </div>
                <span className="font-headline text-lg font-black tracking-widest uppercase hidden sm:block">
                  The New Fuse
                </span>
              </Link>

              {isAuthenticated && (
                <div className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] font-black text-white/60">
                  <Link to="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/command-center"
                    className="hover:text-primary transition-colors"
                  >
                    Command Center
                  </Link>
                  <Link to="/marketplace" className="hover:text-primary transition-colors">
                    Marketplace
                  </Link>
                  <Link to="/resources/skills" className="hover:text-primary transition-colors">
                    Skills
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      {user?.username || 'Pilot'}
                    </span>
                    <span className="text-[8px] text-white/40 uppercase tracking-[0.2em]">
                      Rank: Super Director
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-white/5 hover:bg-error/20 border border-white/10 hover:border-error/50 rounded text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="px-6 py-2 bg-primary hover:bg-white text-black text-[10px] font-black uppercase tracking-widest transition-colors rounded-sm"
                >
                  Establish Connection
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full">
        <Outlet />
      </main>

      {/* System Status Footer */}
      <footer className="w-full border-t border-white/10 bg-black/30 py-6">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="font-mono text-[8px] text-white/20 uppercase tracking-[0.3em]">
            © 2026 TNF SYSTEM KERNEL // ALL SIGNALS ENCRYPTED
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-2 h-2 bg-primary animate-pulse rounded-full"></div>
            <span className="font-mono text-[8px] text-primary uppercase tracking-[0.2em]">
              Node US-WEST-1: ONLINE
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

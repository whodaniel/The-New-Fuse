import React, { type ReactNode } from 'react';
import { useRoute } from '../route-context';
import SynergyStatusBar from './SynergyStatusBar';

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
  className?: string;
  showBack?: boolean;
}

/**
 * Unified page chrome for TNF Desktop — consistent header, spacing, and banners.
 */
export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  actions,
  banner,
  children,
  className = '',
  showBack = false,
}) => {
  const { goBack, history } = useRoute();
  // Every sidebar destination is top-level, so "Back" defaulting to on put a
  // control on pages with no meaningful parent — it just replayed history and
  // contradicted the sidebar as the navigation model. Pages that are genuinely
  // nested (a detail view opened from a list) opt in with showBack.
  const canGoBack = showBack && history.length > 1;

  return (
    <div className={`page-container ${className}`.trim()}>
      <header className="page-header">
        <div className="header-info">
          {canGoBack ? (
            <button type="button" className="ghost-button page-back-btn" onClick={() => goBack()}>
              ← Back
            </button>
          ) : null}
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="header-actions">{actions}</div> : null}
      </header>
      {banner}
      {/* Global synergy state belongs to the chrome, not to each page. Every page
          used to render this itself, below its own title — 18 copies that each
          re-derived the same counts and drifted apart. */}
      <SynergyStatusBar />
      {children}
    </div>
  );
};

export default PageShell;

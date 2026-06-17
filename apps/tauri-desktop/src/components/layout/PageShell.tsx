import React, { type ReactNode } from 'react';
import { useRoute } from '../route-context';

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
  showBack = true,
}) => {
  const { goBack, history } = useRoute();
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
      {children}
    </div>
  );
};

export default PageShell;

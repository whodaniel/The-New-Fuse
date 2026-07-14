import React from 'react';
import PageShell from '../components/layout/PageShell';
import { useRoute } from '../components/route-context';
import { DEFAULT_ROUTE } from '../config/routes';

interface NotFoundProps {
  attemptedRoute?: string;
}

const NotFound: React.FC<NotFoundProps> = ({ attemptedRoute }) => {
  const { navigate, goBack, history } = useRoute();

  return (
    <PageShell
      title="Page not found"
      subtitle={
        attemptedRoute
          ? `No desktop route registered for "${attemptedRoute}"`
          : 'This route is not available in TNF Desktop'
      }
      actions={
        <>
          {history.length > 1 ? (
            <button type="button" className="secondary-button" onClick={() => goBack()}>
              Go back
            </button>
          ) : null}
          <button type="button" className="primary-button" onClick={() => navigate(DEFAULT_ROUTE)}>
            Open Dashboard
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate('/web-hub')}>
            Web Parity Hub
          </button>
        </>
      }
    >
      <div className="empty-state">
        <p>
          Use the sidebar, press <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>, or open Web Parity to reach
          web-only surfaces on thenewfuse.com.
        </p>
      </div>
    </PageShell>
  );
};

export default NotFound;

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  isKnownRoute,
  persistRoute,
  resolveBootRoute,
  resolveLegacyRedirect,
} from '../config/routes';

interface RouteHistoryEntry {
  route: string;
  params: Record<string, string>;
}

interface RouteContextType {
  currentRoute: string;
  params: Record<string, string>;
  navigate: (route: string, params?: Record<string, string>) => void;
  goBack: () => void;
  history: string[];
  isKnownRoute: (route: string) => boolean;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};

interface RouteProviderProps {
  children: ReactNode;
  initialRoute?: string;
}

export const RouteProvider: React.FC<RouteProviderProps> = ({
  children,
  initialRoute = '/dashboard',
}) => {
  // Resolve the boot route once; resolveBootRoute reads window.location, so we
  // must not recompute it on every render.
  const [bootRoute] = useState(() => resolveBootRoute(initialRoute));
  const [currentRoute, setCurrentRoute] = useState(bootRoute);
  const [params, setParams] = useState<Record<string, string>>({});
  const [historyStack, setHistoryStack] = useState<RouteHistoryEntry[]>([
    { route: bootRoute, params: {} },
  ]);

  // Mirror currentRoute into a ref so the hashchange listener can read the
  // latest value without re-subscribing on every navigation.
  const currentRouteRef = useRef(currentRoute);
  currentRouteRef.current = currentRoute;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.history?.replaceState) return;
    const rawHash = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : '';
    if (rawHash === bootRoute) return;
    // Boot can rewrite the requested path (legacy redirect) or restore a persisted
    // route when no hash was given. Sync the address bar in both cases so a deep
    // link never disagrees with the rendered view. replaceState does not emit
    // hashchange, so this cannot loop with the listener below.
    if (!rawHash && !isKnownRoute(bootRoute)) return;
    window.history.replaceState(null, '', `#${bootRoute}`);
  }, [bootRoute]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onHashChange = () => {
      const rawHash = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : '';
      const hashRoute = rawHash ? resolveLegacyRedirect(rawHash) : '';
      if (hashRoute && rawHash !== hashRoute && window.history?.replaceState) {
        window.history.replaceState(null, '', `#${hashRoute}`);
      }
      // Drive navigation for any non-empty hash, including unknown ones, so the
      // address bar and the rendered view never disagree. Unknown routes render
      // the 404 shell (handled by the router) but remain the current route.
      if (hashRoute && hashRoute !== currentRouteRef.current) {
        setCurrentRoute(hashRoute);
        setParams({});
        // Only persist real routes so a bad deep link isn't restored on relaunch.
        if (isKnownRoute(hashRoute)) {
          persistRoute(hashRoute);
        }
        setHistoryStack((prev) => {
          const last = prev[prev.length - 1];
          if (last?.route === hashRoute) return prev;
          const next = [...prev, { route: hashRoute, params: {} }];
          return next.length > 50 ? next.slice(-50) : next;
        });
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((route: string, newParams: Record<string, string> = {}) => {
    const target = resolveLegacyRedirect(route);
    setCurrentRoute(target);
    setParams(newParams);
    // Only persist real routes; a 404 target should not be restored on relaunch.
    if (isKnownRoute(target)) {
      persistRoute(target);
    }
    // Always sync the hash so the URL and rendered view stay consistent, even
    // when navigating to an unknown route (which renders the 404 shell).
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `#${target}`);
    }
    setHistoryStack((prev) => {
      const last = prev[prev.length - 1];
      if (last?.route === target) {
        return [...prev.slice(0, -1), { route: target, params: newParams }];
      }
      const next = [...prev, { route: target, params: newParams }];
      return next.length > 50 ? next.slice(-50) : next;
    });
  }, []);

  const goBack = useCallback(() => {
    setHistoryStack((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      const previous = next[next.length - 1];
      setCurrentRoute(previous.route);
      setParams(previous.params);
      if (isKnownRoute(previous.route)) {
        persistRoute(previous.route);
      }
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', `#${previous.route}`);
      }
      return next;
    });
  }, []);

  const history = useMemo(() => historyStack.map((entry) => entry.route), [historyStack]);

  const value = useMemo<RouteContextType>(
    () => ({ currentRoute, params, navigate, goBack, history, isKnownRoute }),
    [currentRoute, params, navigate, goBack, history]
  );

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
};

export default RouteProvider;

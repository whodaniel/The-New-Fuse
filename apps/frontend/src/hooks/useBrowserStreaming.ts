/**
 * Browser Streaming Hook
 *
 * React hook for managing browser streaming sessions
 */

import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '../config/ports';

const BACKEND_URL = getApiUrl();

interface BrowserSession {
  id: string;
  name: string;
  url: string;
  status: 'initializing' | 'running' | 'error' | 'stopped';
  lastUpdate: Date;
}

export const useBrowserStreaming = () => {
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all active sessions
   */
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/browser-streaming/sessions`);
      const data = await response.json();

      if (data.success) {
        setSessions(data.sessions);
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      console.error('[useBrowserStreaming] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  /**
   * Create a new browser session
   */
  const createSession = useCallback(
    async (id: string, name: string, url: string, viewportWidth = 800, viewportHeight = 600) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${BACKEND_URL}/api/browser-streaming/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            name,
            url,
            viewportWidth,
            viewportHeight,
          }),
        });

        const data = await response.json();

        if (data.success) {
          await fetchSessions();
          return data.session;
        } else {
          throw new Error(data.error || 'Failed to create session');
        }
      } catch (err) {
        console.error('[useBrowserStreaming] Create error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchSessions]
  );

  /**
   * Stop a session
   */
  const stopSession = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${BACKEND_URL}/api/browser-streaming/sessions/${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          await fetchSessions();
        } else {
          throw new Error(data.error || 'Failed to stop session');
        }
      } catch (err) {
        console.error('[useBrowserStreaming] Stop error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to stop session';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchSessions]
  );

  /**
   * Broadcast a message to all sessions (Master Clock)
   */
  const broadcast = useCallback(async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/browser-streaming/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to broadcast');
      }

      return data;
    } catch (err) {
      console.error('[useBrowserStreaming] Broadcast error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to broadcast';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get health status
   */
  const getHealth = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/browser-streaming/health`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('[useBrowserStreaming] Health check error:', err);
      return null;
    }
  }, []);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    createSession,
    stopSession,
    broadcast,
    fetchSessions,
    getHealth,
  };
};

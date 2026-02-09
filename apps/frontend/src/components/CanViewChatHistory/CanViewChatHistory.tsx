import React, { ReactNode, useEffect, useState } from "react";
import { FullScreenLoader } from "@/components/Preloader";
import System from "@/models/system";
import paths from "@/utils/paths";

interface CanViewChatHistoryProps {
  children: ReactNode;
}

interface CanViewChatHistoryProviderProps {
  children: (props: { viewable: boolean }) => ReactNode;
}

interface UseCanViewChatHistoryResult {
  loading: boolean;
  viewable: boolean;
}

/**
 * Hook that fetches the can view chat history state from local storage or the system settings.
 * @returns {UseCanViewChatHistoryResult} The loading and viewable states
 */
export function useCanViewChatHistory(): UseCanViewChatHistoryResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [viewable, setViewable] = useState<boolean>(false);

  useEffect(() => {
    async function fetchViewable() {
      const { viewable } = await System.fetchCanViewChatHistory();
      setViewable(viewable);
      setLoading(false);
    }
    fetchViewable();
  }, []);

  return { loading, viewable };
}

/**
 * Protects the view from system set ups who cannot view chat history.
 * If the user cannot view chat history, they are redirected to the home page.
 */
export function CanViewChatHistory({ children }: CanViewChatHistoryProps) {
  const { loading, viewable } = useCanViewChatHistory();
  
  if (loading) return <FullScreenLoader />;
  
  if (!viewable) {
    window.location.href = paths.home();
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

/**
 * Provides the `viewable` state to the children.
 */
export function CanViewChatHistoryProvider({ children }: CanViewChatHistoryProviderProps) {
  const { loading, viewable } = useCanViewChatHistory();
  
  if (loading) return null;
  
  return <>{children({ viewable })}</>;
}

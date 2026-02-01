import { useCallback, useEffect, useState } from 'react';
import { useRelay } from '../relay/RelayProvider';
import {
  BridgeState,
  createInitialBridgeState,
  createLoadingBridgeState,
  createSuccessBridgeState,
} from '../types/BridgeCommon';

export interface Extension {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  type: 'module' | 'workflow-node' | 'skill' | 'theme';
  status: 'installed' | 'enabled' | 'disabled' | 'error';
  permissions: string[];
}

export interface UseExtensionBridgeReturn {
  // Data
  extensions: BridgeState<Extension[]>;

  // Actions
  refreshExtensions: () => Promise<void>;
  installExtension: (extensionId: string) => Promise<void>;
  uninstallExtension: (extensionId: string) => Promise<void>;
  enableExtension: (extensionId: string) => Promise<void>;
  disableExtension: (extensionId: string) => Promise<void>;
}

/**
 * Bridge hook for Pillar V: The Unified Extension System.
 * Manages dynamic modules, workflow nodes, and agent skills.
 */
export function useExtensionBridge(): UseExtensionBridgeReturn {
  const { sendMessage, subscribeToMessages, connectionState } = useRelay();

  const [extensions, setExtensions] = useState<BridgeState<Extension[]>>(
    createInitialBridgeState()
  );

  const refreshExtensions = useCallback(async () => {
    setExtensions((prev) => createLoadingBridgeState(prev.data));
    await sendMessage('EXTENSION_LIST_REQUEST', {});
  }, [sendMessage]);

  const installExtension = useCallback(
    async (extensionId: string) => {
      await sendMessage('EXTENSION_INSTALL_REQUEST', { extensionId });
    },
    [sendMessage]
  );

  const uninstallExtension = useCallback(
    async (extensionId: string) => {
      await sendMessage('EXTENSION_UNINSTALL_REQUEST', { extensionId });
    },
    [sendMessage]
  );

  const enableExtension = useCallback(
    async (extensionId: string) => {
      await sendMessage('EXTENSION_ENABLE_REQUEST', { extensionId });
    },
    [sendMessage]
  );

  const disableExtension = useCallback(
    async (extensionId: string) => {
      await sendMessage('EXTENSION_DISABLE_REQUEST', { extensionId });
    },
    [sendMessage]
  );

  // Subscriptions
  useEffect(() => {
    if (connectionState.status !== 'connected') return;

    const sub = subscribeToMessages(
      { messageType: ['EXTENSION_LIST_UPDATE', 'EXTENSION_STATUS_UPDATE'] },
      (message) => {
        if (message.type === 'EXTENSION_LIST_UPDATE') {
          setExtensions(createSuccessBridgeState(message.payload as Extension[]));
        }
        // For individual updates we might want to just refresh the list or update locally
        if (message.type === 'EXTENSION_STATUS_UPDATE') {
          refreshExtensions();
        }
      }
    );

    // Initial load
    refreshExtensions();

    return () => {
      sub.unsubscribe();
    };
  }, [connectionState.status, subscribeToMessages, refreshExtensions]);

  return {
    extensions,
    refreshExtensions,
    installExtension,
    uninstallExtension,
    enableExtension,
    disableExtension,
  };
}

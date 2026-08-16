import { useCallback, useEffect, useState } from 'react';
import { verifyTnfGateDecisions } from '../../lib/verify-gate-decisions';

interface TnfUser {
  id: string;
  email: string;
  role: 'super-admin' | 'admin' | 'agent' | 'participant';
  capabilities: string[];
  permissions: Record<string, boolean>;
}

interface TnfAuthorizationState {
  user: TnfUser | null;
  loaded: boolean;
  permissions: Record<string, boolean>;
  gateDecisions: Record<string, boolean>;
}

const DEFAULT_PERMISSIONS: Record<string, boolean> = {
  'browser-control': true,
  'federation-connect': true,
  'channel-create': true,
  'agent-dispatch': true,
  'terminal-heartbeat': true,
  'slash-command-guard': true,
  'coordination-poll': true,
};

export function useTnfAuthorization() {
  const [state, setState] = useState<TnfAuthorizationState>({
    user: null,
    loaded: false,
    permissions: DEFAULT_PERMISSIONS,
    gateDecisions: {},
  });

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setState((prev) => ({
          ...prev,
          user: userData.user,
          permissions: { ...DEFAULT_PERMISSIONS, ...userData.user.permissions },
          loaded: true,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          user: null,
          permissions: DEFAULT_PERMISSIONS,
          loaded: true,
        }));
      }
    } catch (error) {
      console.error('[TnfAuthorization] Failed to load user:', error);
      setState((prev) => ({
        ...prev,
        user: null,
        permissions: DEFAULT_PERMISSIONS,
        loaded: true,
      }));
    }
  }, []);

  const verifyPermissions = useCallback(
    (required: string | string[]) => {
      const requiredList = Array.isArray(required) ? required : [required];

      return requiredList.every((permission) => state.permissions[permission] === true);
    },
    [state.permissions]
  );

  const checkGateDecision = useCallback(async (gate: string) => {
    const decision = await verifyTnfGateDecisions({
      gate,
      tenantScope: window.location.hostname,
      channelMembership: 'federation',
    });

    setState((prev) => ({
      ...prev,
      gateDecisions: { ...prev.gateDecisions, [gate]: decision.allowed },
    }));

    return decision;
  }, []);

  const refreshGateDecisions = useCallback(async () => {
    const gates = [
      'TENANT_SCOPE_GATE',
      'TRACE_CONTINUITY_GATE',
      'CHANNEL_MEMBERSHIP_GATE',
      'PERMISSION_GATE',
      'SECURITY_GATE',
    ];

    const results = await Promise.all(
      gates.map(async (gate) => ({
        gate,
        ...(await checkGateDecision(gate)),
      }))
    );

    return results;
  }, [checkGateDecision]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    ...state,
    user: state.user,
    loaded: state.loaded,
    permissions: state.permissions,
    verifyPermissions,
    checkGateDecision,
    refreshGateDecisions,
  };
}

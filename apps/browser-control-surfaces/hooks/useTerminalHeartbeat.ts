import { useCallback, useEffect, useState } from 'react';
import { createMessageEnvelope, verifyGateDecision } from '../lib/harness-protocol';

interface TerminalHeartbeatState {
  connected: boolean;
  lastPing: number;
  missedCount: number;
  status: 'healthy' | 'degraded' | 'failed';
  agentId?: string;
}

export function useTerminalHeartbeat(
  options: {
    circuitBreakerThreshold?: number;
    pingIntervalMs?: number;
    backoffMs?: number;
  } = {}
) {
  const [state, setState] = useState<TerminalHeartbeatState>({
    connected: false,
    lastPing: 0,
    missedCount: 0,
    status: 'failed',
  });

  const threshold = options.circuitBreakerThreshold ?? 3;
  const interval = options.pingIntervalMs ?? 30000;
  const backoff = options.backoffMs ?? 300000;

  const [heartbeatTimer, setHeartbeatTimer] = useState<NodeJS.Timeout | null>(null);
  const [holdUntil, setHoldUntil] = useState<number | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const gateCheck = useCallback(async () => {
    const decision = await verifyGateDecision('SECURITY_GATE', {
      tenantId: 'tnf-local',
      agentId: 'terminal-heartbeat',
      operationId: 'heartbeat-check',
    });
    return decision;
  }, []);

  const triggerPing = useCallback(async () => {
    const decision = await gateCheck();

    if (!decision.allowed) {
      console.warn('[Terminal Heartbeat] Gate decision denied:', decision.reason);
      return { denied: true, reason: decision.reason };
    }

    const envelope = createMessageEnvelope({
      type: 'TNF_HEARTBEAT',
      source: 'terminal-heartbeat',
      payload: {
        agentId: 'terminal-heartbeat',
        timestamp: Date.now(),
        operation: 'ping',
      },
      correlationId: `hb-${Date.now()}`,
    });

    try {
      if (typeof window !== 'undefined' && (window as any).tnfRelay) {
        (window as any).tnfRelay.send(envelope);
      }

      setState((prev) => ({
        ...prev,
        connected: true,
        lastPing: Date.now(),
        missedCount: 0,
        status: 'healthy',
      }));

      return { success: true };
    } catch (error) {
      console.error('[Terminal Heartbeat] Ping failed:', error);
      return { success: false, error };
    }
  }, [gateCheck]);

  const schedulePing = useCallback(() => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    const timer = setInterval(async () => {
      const currentTime = Date.now();

      if (holdUntil && currentTime < holdUntil) {
        console.log(`[Terminal Heartbeat] In backoff period, waiting until ${holdUntil}`);
        return;
      }

      const result = await triggerPing();

      if (!result.success) {
        const newFailures = consecutiveFailures + 1;
        setConsecutiveFailures(newFailures);

        if (newFailures >= threshold) {
          console.warn(
            `[Terminal Heartbeat] Circuit breaker triggered after ${newFailures} failures`
          );
          setHoldUntil(currentTime + backoff);
          setState((prev) => ({
            ...prev,
            status: 'failed',
            missedCount: newFailures,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            status: 'degraded',
            missedCount: newFailures,
          }));
        }
      } else if (result.denied) {
        console.warn('[Terminal Heartbeat] Ping denied:', result.reason);
      }
    }, interval);

    setHeartbeatTimer(timer);

    return () => clearInterval(timer);
  }, [
    gateCheck,
    interval,
    threshold,
    backoff,
    holdUntil,
    heartbeatTimer,
    triggerPing,
    consecutiveFailures,
  ]);

  useEffect(() => {
    schedulePing();
    return () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    };
  }, [schedulePing]);

  const reset = useCallback(() => {
    setConsecutiveFailures(0);
    setHoldUntil(null);
    setState({
      connected: false,
      lastPing: 0,
      missedCount: 0,
      status: 'failed',
    });
  }, []);

  const getCircuitBreakerState = useCallback(
    () => ({
      consecutiveFailures,
      holdUntil,
      inBackoff: holdUntil !== null && Date.now() < holdUntil,
      backoffEndTime: holdUntil,
    }),
    [consecutiveFailures, holdUntil]
  );

  return {
    ...state,
    triggerPing,
    reset,
    getCircuitBreakerState,
    circuitBreaker: getCircuitBreakerState(),
  };
}

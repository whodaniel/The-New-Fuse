/**
 * Shared utility functions
 */

type ControlPlaneLike =
  | {
      content?: unknown;
      type?: unknown;
      messageType?: unknown;
      metadata?: {
        eventType?: unknown;
        isRecoveryAttempt?: unknown;
        isSystemMessage?: unknown;
      } | null;
    }
  | null
  | undefined;

/**
 * Federated control-plane payloads (heartbeats, wake pings, activity).
 * These may be shown in the injectable panel, but must not steal composer focus
 * or be submitted into the host page's model input.
 */
export function isControlPlaneRelayMessage(msg: ControlPlaneLike): boolean {
  if (!msg) return false;

  const content = String(msg.content || '')
    .trim()
    .toLowerCase();
  const messageType = String(msg.messageType || msg.type || '').toLowerCase();
  const eventType = String(msg.metadata?.eventType || '').toLowerCase();

  if (msg.metadata?.isSystemMessage) return true;
  if (msg.metadata?.isRecoveryAttempt) return true;
  if (messageType === 'event' || messageType === 'heartbeat' || messageType === 'agent_heartbeat') {
    return true;
  }
  if (
    eventType === 'heartbeat' ||
    eventType === 'activity' ||
    eventType === 'wake_ping' ||
    eventType === 'wake_ack' ||
    eventType === 'monitor_idle' ||
    eventType === 'page_agent_registered' ||
    eventType === 'agent_registered'
  ) {
    return true;
  }
  if (content.includes('tnf heartbeat') || content.includes('[heartbeat]')) return true;
  if (
    content.startsWith('[activity]') ||
    content.startsWith('[wake_ping') ||
    content.startsWith('[wake_ack')
  ) {
    return true;
  }
  return false;
}

/**
 * Simple hash function for message deduplication
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

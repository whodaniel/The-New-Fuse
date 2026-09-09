/**
 * Chrome MV3 content-script runtime liveness.
 *
 * After an extension reload, orphaned content scripts still run but
 * `chrome.runtime.sendMessage` throws "Extension context invalidated".
 * A sleeping service worker instead yields "Receiving end does not exist",
 * which is transient and should be retried rather than forcing a page refresh.
 */

export function runtimeErrorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || '';
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || '');
  }
  return String(error);
}

export function isExtensionRuntimeAlive(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

export function isExtensionContextInvalidated(error?: unknown): boolean {
  const message = runtimeErrorMessage(error).toLowerCase();
  return message.includes('extension context invalidated') || message.includes('context invalidated');
}

export function isTransientRuntimeDisconnect(error?: unknown): boolean {
  const message = runtimeErrorMessage(error).toLowerCase();
  return (
    message.includes('receiving end does not exist') ||
    message.includes('message port closed') ||
    message.includes('could not establish connection')
  );
}

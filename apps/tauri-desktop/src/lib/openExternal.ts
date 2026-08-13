/**
 * Open URLs in the system browser — window.open() throws in Tauri WebView.
 * Uses tauri-plugin-opener (initialized in Rust); http(s) only.
 */
export async function openExternal(url: string): Promise<void> {
  const target = String(url || '').trim();
  if (!target) {
    return;
  }

  // Security check: Only allow http and https protocols
  try {
    const parsed = new URL(target);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.warn(
        `[Security] Blocked openExternal call for unsupported protocol: ${parsed.protocol}`
      );
      return;
    }
  } catch {
    console.warn(`[Security] Blocked openExternal call for invalid URL: ${target}`);
    return;
  }

  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(target);
    return;
  } catch {
    // Not in Tauri or plugin unavailable — try browser fallback
  }

  try {
    window.open(target, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Failed to open external URL:', target, error);
  }
}

export default openExternal;

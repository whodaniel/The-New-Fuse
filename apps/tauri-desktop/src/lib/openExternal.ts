/**
 * Open URLs in the system browser — window.open() throws in Tauri WebView.
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
      console.warn(`[Security] Blocked openExternal call for unsupported protocol: ${parsed.protocol}`);
      return;
    }
  } catch (err) {
    console.warn(`[Security] Blocked openExternal call for invalid URL: ${target}`);
    return;
  }

  try {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(target);
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

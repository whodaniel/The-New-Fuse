import { invoke } from '@tauri-apps/api/core';

/**
 * Auxiliary WebView helpers.
 *
 * These wrap Rust `browser_webview` commands that open a separate Tauri
 * WebviewWindow. That window is NOT the Chromium session controlled by TNF
 * Browser on :7331 — it has its own cookies and does not receive protocol
 * actions. Prefer screenshots / Discover for the controlled session.
 */

export function openTNFBrowserWebview(url: string): Promise<void> {
  return invoke('open_browser_webview', { url });
}

export function navigateTNFBrowserWebview(url: string): Promise<void> {
  return invoke('navigate_browser_webview', { url });
}

export function focusTNFBrowserWebview(): Promise<void> {
  return invoke('focus_browser_webview');
}

export function closeTNFBrowserWebview(): Promise<void> {
  return invoke('close_browser_webview');
}

export function tnfBrowserWebviewExists(): Promise<boolean> {
  return invoke('browser_webview_exists');
}

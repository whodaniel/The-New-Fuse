import { invoke } from '@tauri-apps/api/core';

/**
 * TNF Browser embedded WebView bridge.
 *
 * These wrap the Rust `browser_webview` commands that host a REAL Tauri child
 * WebView window (a native webview, not a sandboxed iframe) rendering the live
 * browser surface driven by the TNF Browser tool.
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

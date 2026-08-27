/**
 * Single owner of `BookmarkOrganizerSettings` (chrome.storage.local, key
 * STORAGE_KEYS.bookmarkSettings). Both the popup tab and the full-tab manager page
 * read/write settings only via BOOKMARKS_GET_SETTINGS/BOOKMARKS_SET_SETTINGS
 * messages to the background service worker, never chrome.storage.local directly —
 * this is what lets the real-time listener toggle react immediately no matter which
 * UI surface flipped it, without a storage-change-listener race.
 */

import { STORAGE_KEYS } from '../../shared/constants';
import type { BookmarkOrganizerSettings } from '../../shared/types';

export const DEFAULT_BOOKMARK_SETTINGS: BookmarkOrganizerSettings = {
  granularity: 'balanced',
  zeroFolderMode: false,
  realtimeEnabled: false,
  fullPageContentOptIn: false,
  privateDomains: [],
  targetAgentId: null,
  targetChannel: null,
};

class BookmarkSettingsService {
  async getSettings(): Promise<BookmarkOrganizerSettings> {
    const result = await chrome.storage.local.get([STORAGE_KEYS.bookmarkSettings]);
    const stored = result[STORAGE_KEYS.bookmarkSettings] as
      | Partial<BookmarkOrganizerSettings>
      | undefined;
    return { ...DEFAULT_BOOKMARK_SETTINGS, ...(stored || {}) };
  }

  async setSettings(
    partial: Partial<BookmarkOrganizerSettings>
  ): Promise<BookmarkOrganizerSettings> {
    const current = await this.getSettings();
    const next: BookmarkOrganizerSettings = { ...current, ...partial };
    await chrome.storage.local.set({ [STORAGE_KEYS.bookmarkSettings]: next });
    return next;
  }
}

const bookmarkSettingsService = new BookmarkSettingsService();
export default bookmarkSettingsService;

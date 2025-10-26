/**
 * Theme Service for The New Fuse Theia IDE
 * Manages themes, color schemes, and visual customization
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { ThemeService as TheiaThemeService } from '@theia/core/lib/browser/theming/theme-service';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { StorageService } from '@theia/core/lib/browser/storage-service';

export interface TNFTheme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'high-contrast';
  colors: Record<string, string>;
  metadata: {
    author: string;
    version: string;
    description: string;
    tags: string[];
  };
}

export interface ThemePreferences {
  currentTheme: string;
  autoSwitch: boolean;
  systemTheme: boolean;
  customColors: Record<string, string>;
  fontSize: number;
  fontFamily: string;
}

@injectable()
export class ThemeService {
  private themes: Map<string, TNFTheme> = new Map();
  private preferences: ThemePreferences;
  private themeChangeListeners: Set<(theme: TNFTheme) => void> = new Set();

  constructor(
    @inject(TheiaThemeService) private readonly theiaThemeService: TheiaThemeService,
    @inject(ColorRegistry) private readonly colorRegistry: ColorRegistry,
    @inject(StorageService) private readonly storageService: StorageService
  ) {
    this.initializeDefaultThemes();
    this.loadPreferences();
    this.setupThemeIntegration();
  }

  /**
   * Initialize default TNF themes
   */
  private initializeDefaultThemes(): void {
    const defaultThemes: TNFTheme[] = [
      {
        id: 'tnf-light',
        name: 'TNF Light',
        type: 'light',
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#000000',
          'editor.lineHighlightBackground': '#f0f0f0',
          'editor.selectionBackground': '#007acc40',
          'editorCursor.foreground': '#000000',
          'editorWhitespace.foreground': '#d3d3d3',
          'editorIndentGuide.background': '#d3d3d3',
          'editorLineNumber.foreground': '#237893',
          'editorLineNumber.activeForeground': '#0b216f',
          'sideBar.background': '#f3f3f3',
          'sideBar.foreground': '#000000',
          'activityBar.background': '#2c2c2c',
          'activityBar.foreground': '#ffffff',
          'statusBar.background': '#007acc',
          'statusBar.foreground': '#ffffff',
          'titleBar.activeBackground': '#3c3c3c',
          'titleBar.activeForeground': '#ffffff'
        },
        metadata: {
          author: 'The New Fuse',
          version: '1.0.0',
          description: 'Modern light theme optimized for development',
          tags: ['light', 'modern', 'development']
        }
      },
      {
        id: 'tnf-dark',
        name: 'TNF Dark',
        type: 'dark',
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
          'editor.lineHighlightBackground': '#2d2d30',
          'editor.selectionBackground': '#007acc40',
          'editorCursor.foreground': '#ffffff',
          'editorWhitespace.foreground': '#404040',
          'editorIndentGuide.background': '#404040',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#c6c6c6',
          'sideBar.background': '#252526',
          'sideBar.foreground': '#cccccc',
          'activityBar.background': '#2d2d30',
          'activityBar.foreground': '#ffffff',
          'statusBar.background': '#007acc',
          'statusBar.foreground': '#ffffff',
          'titleBar.activeBackground': '#3c3c3c',
          'titleBar.activeForeground': '#ffffff'
        },
        metadata: {
          author: 'The New Fuse',
          version: '1.0.0',
          description: 'Modern dark theme optimized for development',
          tags: ['dark', 'modern', 'development']
        }
      },
      {
        id: 'tnf-neon',
        name: 'TNF Neon',
        type: 'dark',
        colors: {
          'editor.background': '#0d0d0d',
          'editor.foreground': '#ffffff',
          'editor.lineHighlightBackground': '#1a1a1a',
          'editor.selectionBackground': '#00ff8840',
          'editorCursor.foreground': '#00ff88',
          'editorWhitespace.foreground': '#333333',
          'editorIndentGuide.background': '#333333',
          'editorLineNumber.foreground': '#666666',
          'editorLineNumber.activeForeground': '#00ff88',
          'sideBar.background': '#1a1a1a',
          'sideBar.foreground': '#ffffff',
          'activityBar.background': '#0d0d0d',
          'activityBar.foreground': '#00ff88',
          'statusBar.background': '#00ff88',
          'statusBar.foreground': '#000000',
          'titleBar.activeBackground': '#00ff88',
          'titleBar.activeForeground': '#000000'
        },
        metadata: {
          author: 'The New Fuse',
          version: '1.0.0',
          description: 'High-contrast neon theme for extended coding sessions',
          tags: ['dark', 'neon', 'high-contrast', 'coding']
        }
      }
    ];

    defaultThemes.forEach(theme => this.themes.set(theme.id, theme));
  }

  /**
   * Load user preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await this.storageService.getData('tnf-theme-preferences');
      this.preferences = stored || this.getDefaultPreferences();
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  /**
   * Get default theme preferences
   */
  private getDefaultPreferences(): ThemePreferences {
    return {
      currentTheme: 'tnf-dark',
      autoSwitch: false,
      systemTheme: false,
      customColors: {},
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace'
    };
  }

  /**
   * Setup integration with Theia's theme system
   */
  private setupThemeIntegration(): void {
    // Listen to Theia theme changes
    this.theiaThemeService.onDidChangeTheme(() => {
      this.syncWithTheiaTheme();
    });

    // Apply initial theme
    this.applyTheme(this.preferences.currentTheme);
  }

  /**
   * Sync with Theia's current theme
   */
  private syncWithTheiaTheme(): void {
    const theiaTheme = this.theiaThemeService.getCurrentTheme();
    const tnfTheme = this.findCompatibleTNFTheme(theiaTheme.id);

    if (tnfTheme && tnfTheme.id !== this.preferences.currentTheme) {
      this.setCurrentTheme(tnfTheme.id);
    }
  }

  /**
   * Find TNF theme compatible with Theia theme
   */
  private findCompatibleTNFTheme(theiaThemeId: string): TNFTheme | null {
    // Map common Theia themes to TNF themes
    const themeMapping: Record<string, string> = {
      'dark': 'tnf-dark',
      'light': 'tnf-light',
      'hc-black': 'tnf-neon',
      'hc-light': 'tnf-light'
    };

    const tnfThemeId = themeMapping[theiaThemeId] || themeMapping['dark'];
    return this.themes.get(tnfThemeId) || null;
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): TNFTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): TNFTheme | null {
    return this.themes.get(this.preferences.currentTheme) || null;
  }

  /**
   * Set current theme
   */
  async setCurrentTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    this.preferences.currentTheme = themeId;
    await this.savePreferences();
    await this.applyTheme(themeId);

    // Notify listeners
    this.themeChangeListeners.forEach(listener => listener(theme));
  }

  /**
   * Apply theme to the editor and UI
   */
  private async applyTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) return;

    try {
      // Apply colors to Theia's color registry
      Object.entries(theme.colors).forEach(([key, value]) => {
        this.colorRegistry.register(key, value);
      });

      // Apply custom colors
      Object.entries(this.preferences.customColors).forEach(([key, value]) => {
        this.colorRegistry.register(key, value);
      });

      // Apply font preferences
      this.applyFontPreferences();

      console.log(`🎨 Applied TNF theme: ${theme.name}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }

  /**
   * Apply font preferences
   */
  private applyFontPreferences(): void {
    const style = document.createElement('style');
    style.id = 'tnf-theme-fonts';
    style.textContent = `
      .monaco-editor {
        font-family: ${this.preferences.fontFamily} !important;
        font-size: ${this.preferences.fontSize}px !important;
      }
      .theia-editor {
        font-family: ${this.preferences.fontFamily} !important;
        font-size: ${this.preferences.fontSize}px !important;
      }
    `;

    // Remove existing style if present
    const existing = document.getElementById('tnf-theme-fonts');
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(style);
  }

  /**
   * Update theme preferences
   */
  async updatePreferences(updates: Partial<ThemePreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...updates };
    await this.savePreferences();

    // Re-apply theme if necessary
    if (updates.currentTheme || updates.customColors || updates.fontSize || updates.fontFamily) {
      await this.applyTheme(this.preferences.currentTheme);
    }
  }

  /**
   * Save preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      await this.storageService.setData('tnf-theme-preferences', this.preferences);
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }

  /**
   * Add theme change listener
   */
  onThemeChange(listener: (theme: TNFTheme) => void): () => void {
    this.themeChangeListeners.add(listener);
    return () => this.themeChangeListeners.delete(listener);
  }

  /**
   * Create custom theme
   */
  async createCustomTheme(theme: Omit<TNFTheme, 'id'>): Promise<string> {
    const themeId = `custom-${Date.now()}`;
    const customTheme: TNFTheme = {
      ...theme,
      id: themeId,
      metadata: {
        ...theme.metadata,
        author: 'Custom',
        version: '1.0.0'
      }
    };

    this.themes.set(themeId, customTheme);
    return themeId;
  }

  /**
   * Delete custom theme
   */
  async deleteCustomTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    if (!theme.metadata.author.includes('Custom')) {
      throw new Error('Cannot delete built-in themes');
    }

    this.themes.delete(themeId);

    // Switch to default theme if current theme was deleted
    if (this.preferences.currentTheme === themeId) {
      await this.setCurrentTheme('tnf-dark');
    }
  }

  /**
   * Export theme configuration
   */
  exportTheme(themeId: string): string {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme configuration
   */
  async importTheme(themeJson: string): Promise<string> {
    try {
      const theme: TNFTheme = JSON.parse(themeJson);

      // Validate theme structure
      if (!theme.id || !theme.name || !theme.colors) {
        throw new Error('Invalid theme format');
      }

      // Ensure unique ID for imported themes
      if (this.themes.has(theme.id)) {
        theme.id = `${theme.id}-imported-${Date.now()}`;
      }

      this.themes.set(theme.id, theme);
      return theme.id;
    } catch (error) {
      throw new Error(`Failed to import theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get theme statistics
   */
  getThemeStats(): {
    totalThemes: number;
    customThemes: number;
    currentTheme: string;
    preferences: ThemePreferences;
  } {
    const customThemes = Array.from(this.themes.values())
      .filter(theme => theme.metadata.author.includes('Custom')).length;

    return {
      totalThemes: this.themes.size,
      customThemes,
      currentTheme: this.preferences.currentTheme,
      preferences: { ...this.preferences }
    };
  }
}

export default ThemeService;
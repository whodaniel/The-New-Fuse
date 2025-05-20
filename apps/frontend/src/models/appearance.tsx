interface AppearanceSettings {
  showScrollbar?: boolean;
  theme?: string;
}

const SETTINGS_KEY = 'appearance_settings';
const DEFAULT_SETTINGS: AppearanceSettings = {
  showScrollbar: true,
  theme: 'dark',
};

class Appearance {
  private static instance: Appearance;
  private settings: AppearanceSettings;

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): Appearance {
    if (!Appearance.instance) {
      Appearance.instance = new Appearance();
    }
    return Appearance.instance;
  }

  private loadSettings(): AppearanceSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (!savedSettings) return DEFAULT_SETTINGS;

    try {
      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(savedSettings),
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }
  }

  static getSettings(): AppearanceSettings {
    return Appearance.getInstance().settings;
  }

  static updateSettings(newSettings: Partial<AppearanceSettings>): void {
    const instance = Appearance.getInstance();
    instance.settings = {
      ...instance.settings,
      ...newSettings,
    };
    instance.saveSettings();
  }

  static toggleScrollbar(): void {
    const instance = Appearance.getInstance();
    instance.settings.showScrollbar = !instance.settings.showScrollbar;
    instance.saveSettings();
  }

  static setTheme(theme: string): void {
    const instance = Appearance.getInstance();
    instance.settings.theme = theme;
    instance.saveSettings();
  }

  static getTheme(): string {
    return Appearance.getInstance().settings.theme || DEFAULT_SETTINGS.theme;
  }
}

export default Appearance;
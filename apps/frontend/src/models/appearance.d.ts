interface AppearanceSettings {
    showScrollbar?: boolean;
    theme?: string;
}
declare class Appearance {
    private static instance;
    private settings;
    private constructor();
    static getInstance(): Appearance;
    private loadSettings;
    private saveSettings;
    static getSettings(): AppearanceSettings;
    static updateSettings(newSettings: Partial<AppearanceSettings>): void;
    static toggleScrollbar(): void;
    static setTheme(theme: string): void;
    static getTheme(): string;
}
export default Appearance;

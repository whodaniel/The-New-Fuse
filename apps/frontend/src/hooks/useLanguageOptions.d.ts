export declare function useLanguageOptions(): any {
    currentLanguage: any;
    supportedLanguages: string[];
    getLanguageName: (lang?: string) => string | undefined;
    changeLanguage: (newLang?: string) => false | undefined;
};

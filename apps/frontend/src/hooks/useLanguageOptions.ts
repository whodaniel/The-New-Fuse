import { resources as languages } from "@/locales/resources";
export function useLanguageOptions(): any {
    const supportedLanguages = Object.keys(languages);
    const languageNames = new Intl.DisplayNames(supportedLanguages, {
        type: "language",
    });
    const changeLanguage = (newLang = "en"): any => {
        if (!Object.keys(languages).includes(newLang))
            return false;
        i18n.changeLanguage(newLang);
    };
    return {
        currentLanguage: i18n.language || "en",
        supportedLanguages,
        getLanguageName: (lang = "en") => languageNames.of(lang),
        changeLanguage,
    };
}
//# sourceMappingURL=useLanguageOptions.js.map
import { resources as languages } from "@/locales/resources";
export function useLanguageOptions() {
    var supportedLanguages = Object.keys(languages);
    var languageNames = new Intl.DisplayNames(supportedLanguages, {
        type: "language",
    });
    var changeLanguage = function (newLang) {
        if (newLang === void 0) { newLang = "en"; }
        if (!Object.keys(languages).includes(newLang))
            return false;
        i18n.changeLanguage(newLang);
    };
    return {
        currentLanguage: i18n.language || "en",
        supportedLanguages: supportedLanguages,
        getLanguageName: function (lang) {
            if (lang === void 0) { lang = "en"; }
            return languageNames.of(lang);
        },
        changeLanguage: changeLanguage,
    };
}

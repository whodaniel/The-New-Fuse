var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var SETTINGS_KEY = 'appearance_settings';
var DEFAULT_SETTINGS = {
    showScrollbar: true,
    theme: 'dark',
};
var Appearance = /** @class */ (function () {
    function Appearance() {
        this.settings = this.loadSettings();
    }
    Appearance.getInstance = function () {
        if (!Appearance.instance) {
            Appearance.instance = new Appearance();
        }
        return Appearance.instance;
    };
    Appearance.prototype.loadSettings = function () {
        if (typeof window === 'undefined')
            return DEFAULT_SETTINGS;
        var savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (!savedSettings)
            return DEFAULT_SETTINGS;
        try {
            return __assign(__assign({}, DEFAULT_SETTINGS), JSON.parse(savedSettings));
        }
        catch (_a) {
            return DEFAULT_SETTINGS;
        }
    };
    Appearance.prototype.saveSettings = function () {
        if (typeof window !== 'undefined') {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
        }
    };
    Appearance.getSettings = function () {
        return Appearance.getInstance().settings;
    };
    Appearance.updateSettings = function (newSettings) {
        var instance = Appearance.getInstance();
        instance.settings = __assign(__assign({}, instance.settings), newSettings);
        instance.saveSettings();
    };
    Appearance.toggleScrollbar = function () {
        var instance = Appearance.getInstance();
        instance.settings.showScrollbar = !instance.settings.showScrollbar;
        instance.saveSettings();
    };
    Appearance.setTheme = function (theme) {
        var instance = Appearance.getInstance();
        instance.settings.theme = theme;
        instance.saveSettings();
    };
    Appearance.getTheme = function () {
        return Appearance.getInstance().settings.theme || DEFAULT_SETTINGS.theme;
    };
    return Appearance;
}());
export default Appearance;

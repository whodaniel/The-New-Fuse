// apps/frontend/src/shared/theme/themes.ts
// Migrated from Chakra UI to Tailwind CSS theme configuration
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
export var themeColors = {
    brand: {
        50: "#e3f2fd",
        100: "#bbdefb",
        200: "#90caf9",
        300: "#64b5f6",
        400: "#42a5f5",
        500: "#2196f3",
        600: "#1e88e5",
        700: "#1976d2",
        800: "#1565c0",
        900: "#0d47a1",
    },
    dark: {
        brand: {
            50: "#ececec",
            100: "#cfcfcf",
            200: "#b1b1b1",
            300: "#949494",
            400: "#767676",
            500: "#595959",
            600: "#444444",
            700: "#303030",
            800: "#1b1b1b",
            900: "#050505",
        },
        background: "#181818",
    },
};
export var themeConfig = {
    initialColorMode: "light",
    useSystemColorMode: false,
};
// Export for Tailwind config if needed
export var baseTheme = {
    colors: themeColors,
    config: themeConfig,
};
export var darkTheme = {
    colors: themeColors.dark,
    config: __assign(__assign({}, themeConfig), { initialColorMode: "dark" }),
};

export default function usePrefersDarkMode(): any {
    var _a;
    if (window === null || window === void 0 ? void 0 : window.matchMedia) {
        if ((_a = window === null || window === void 0 ? void 0 : window.matchMedia("(prefers-color-scheme: dark)")) === null || _a === void 0 ? void 0 : _a.matches) {
            return true;
        }
        return false;
    }
    return false;
}
//# sourceMappingURL=usePrefersDarkMode.js.map
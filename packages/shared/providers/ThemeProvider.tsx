var __rest = (this && this.__rest) || function (s, e): any {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
export {}
exports.ThemeProvider = ThemeProvider;
import react_1 from 'react';
import next_themes_1 from 'next-themes';
function ThemeProvider(_a): any {
    var { children } = _a, props = __rest(_a, ["children"]);
    return (<next_themes_1.ThemeProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </next_themes_1.ThemeProvider>);
}
exports.default = ThemeProvider;
export {};
//# sourceMappingURL=ThemeProvider.js.map
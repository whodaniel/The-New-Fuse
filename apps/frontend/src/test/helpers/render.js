import { jsx as _jsx } from "react/jsx-runtime";
import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider } from '@/shared/providers/theme/ThemeProvider';
function render(ui, options) {
    if (options === void 0) { options = {}; }
    return rtlRender(ui, Object.assign({ wrapper: function (_a) {
            var children = _a.children;
            return (_jsx(ThemeProvider, { defaultTheme: "light", storageKey: "test-theme", children: children }));
        } }, options));
}
export * from '@testing-library/react';
export { render };

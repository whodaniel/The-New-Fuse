import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useA11y } from '@/hooks/useA11y';
import { ScreenReaderSupport } from './ScreenReaderSupport';
import { KeyboardNavigation } from './KeyboardNavigation';
export var A11yProvider = function (_a) {
    var children = _a.children;
    var preferences = useA11y().preferences;
    return (_jsxs("div", { role: "application", children: [_jsx(ScreenReaderSupport, { enabled: preferences.screenReader }), _jsx(KeyboardNavigation, { enabled: preferences.keyboard }), children] }));
};

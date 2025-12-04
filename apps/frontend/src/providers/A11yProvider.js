import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
var A11yContext = createContext(undefined);
export function A11yProvider(_a) {
    var children = _a.children;
    var _b = useState(false), highContrast = _b[0], setHighContrast = _b[1];
    var toggleHighContrast = function () {
        setHighContrast(function (prev) { return !prev; });
    };
    var value = {
        highContrast: highContrast,
        toggleHighContrast: toggleHighContrast,
    };
    return (_jsx(A11yContext.Provider, { value: value, children: children }));
}
export function useA11y() {
    var context = useContext(A11yContext);
    if (context === undefined) {
        throw new Error('useA11y must be used within an A11yProvider');
    }
    return context;
}

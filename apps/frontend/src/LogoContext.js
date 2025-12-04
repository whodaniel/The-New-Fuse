import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useState } from 'react';
export var LogoContext = createContext({
    logo: null,
    setLogo: function () { },
    loginLogo: null,
    isCustomLogo: false,
});
export var LogoProvider = function (_a) {
    var children = _a.children;
    var _b = useState(null), logo = _b[0], setLogo = _b[1];
    var loginLogo = useState(null)[0];
    var isCustomLogo = useState(false)[0];
    var contextValue = {
        logo: logo,
        setLogo: setLogo,
        loginLogo: loginLogo,
        isCustomLogo: isCustomLogo,
    };
    return (_jsx(LogoContext.Provider, { value: contextValue, children: children }));
};
export default LogoContext;

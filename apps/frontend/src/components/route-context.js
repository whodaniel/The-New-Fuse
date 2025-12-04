import { jsx as _jsx } from "react/jsx-runtime";
exports.RouteProvider = RouteProvider;
exports.useRoute = useRoute;
import react_1 from 'react';
var RouteContext = (0, react_1.createContext)(undefined);
function RouteProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)('Dashboard'), pageTitle = _b[0], setPageTitle = _b[1];
    return (_jsx(RouteContext.Provider, { value: { pageTitle: pageTitle, setPageTitle: setPageTitle }, children: children }));
}
function useRoute() {
    var context = (0, react_1.useContext)(RouteContext);
    if (context === undefined) {
        throw new Error('useRoute must be used within a RouteProvider');
    }
    return context;
}

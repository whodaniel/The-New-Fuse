export {}
exports.RouteProvider = RouteProvider;
exports.useRoute = useRoute;
import react_1 from 'react';
const RouteContext = (0, react_1.createContext)(undefined);
function RouteProvider({ children }): any {
    const [pageTitle, setPageTitle] = (0, react_1.useState)('Dashboard');
    return (<RouteContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </RouteContext.Provider>);
}
function useRoute(): any {
    const context = (0, react_1.useContext)(RouteContext);
    if (context === undefined) {
        throw new Error('useRoute must be used within a RouteProvider');
    }
    return context;
}
export {};
//# sourceMappingURL=route-context.js.map
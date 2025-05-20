Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import useAuth_1 from '@/hooks/useAuth';
const SSO = () => {
    const { provider } = (0, react_router_dom_1.useParams)();
    const [searchParams] = (0, react_router_dom_1.useSearchParams)();
    const { handleSSOCallback } = (0, useAuth_1.useAuth)();
    (0, react_1.useEffect)(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');
        if (code && provider) {
            handleSSOCallback(provider, code, state);
        }
        else if (error) {
            console.error('SSO authentication failed:', error);
        }
    }, [provider, searchParams, handleSSOCallback]);
    return (<div className="space-y-4 text-center">
      <h3 className="text-lg font-medium">Processing {provider} login...</h3>
      <p className="text-sm text-muted-foreground">
        Please wait while we authenticate you.
      </p>
    </div>);
};
exports.default = SSO;
export {};
//# sourceMappingURL=SSO.js.map
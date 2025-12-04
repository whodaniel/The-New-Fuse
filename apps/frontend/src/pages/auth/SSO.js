import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';
var SSO = function () {
    var provider = useParams().provider;
    var searchParams = useSearchParams()[0];
    var handleSSOCallback = useAuth().handleSSOCallback;
    useEffect(function () {
        var code = searchParams.get('code');
        var error = searchParams.get('error');
        var state = searchParams.get('state');
        if (code && provider) {
            handleSSOCallback(provider, code, state);
        }
        else if (error) {
            console.error('SSO authentication failed:', error);
        }
    }, [provider, searchParams, handleSSOCallback]);
    return (_jsxs("div", { className: "space-y-4 text-center", children: [_jsxs("h3", { className: "text-lg font-medium", children: ["Processing ", provider, " login..."] }), _jsx(Loader, { className: "animate-spin h-8 w-8 text-blue-600 mx-auto" }), _jsx("p", { className: "text-sm text-gray-600", children: "Please wait while we authenticate your account." })] }));
};
export default SSO;

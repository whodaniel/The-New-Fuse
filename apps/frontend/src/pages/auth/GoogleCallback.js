import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
var GoogleCallback = function () {
    var searchParams = useSearchParams()[0];
    var navigate = useNavigate();
    var setToken = useAuth().setToken;
    useEffect(function () {
        var token = searchParams.get('token');
        if (token) {
            setToken(token);
            navigate('/dashboard');
        }
        else {
            var error = searchParams.get('error');
            console.error('Authentication error:', error);
            navigate('/login?error=' + (error || 'auth_failed'));
        }
    }, [searchParams, navigate, setToken]);
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: "Processing authentication..." }), _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" })] }) }));
};
export default GoogleCallback;

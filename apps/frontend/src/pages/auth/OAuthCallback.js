import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
var OAuthCallback = function () {
    var navigate = useNavigate();
    var location = useLocation();
    var login = useAuth().login;
    useEffect(function () {
        var params = new URLSearchParams(location.search);
        var token = params.get('token');
        var error = params.get('error');
        if (error) {
            console.error('Authentication failed:', error);
            navigate('/login?error=auth_failed');
            return;
        }
        if (token) {
            login(token);
            navigate('/dashboard');
        }
        else {
            navigate('/login');
        }
    }, [location, navigate, login]);
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "Processing..." }), _jsx("p", { children: "Please wait while we complete your authentication." })] }) }));
};
export default OAuthCallback;

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import { auth, googleProvider } from '../../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { Loader } from 'lucide-react';
var RegisterPage = function () {
    var navigate = useNavigate();
    var setToken = useAuth().setToken;
    var _a = useState(null), error = _a[0], setError = _a[1];
    var _b = useState(false), isLoading = _b[0], setIsLoading = _b[1];
    var handleGoogleRegister = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, token, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setError(null);
                    setIsLoading(true);
                    return [4 /*yield*/, signInWithPopup(auth, googleProvider)];
                case 1:
                    result = _a.sent();
                    return [4 /*yield*/, result.user.getIdToken()];
                case 2:
                    token = _a.sent();
                    setToken(token);
                    navigate('/workspace');
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error('Registration error:', err_1);
                    setError('Failed to register with Google. Please try again.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow", children: [_jsxs("div", { children: [_jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "Create your account" }), _jsxs("p", { className: "mt-2 text-center text-sm text-gray-600", children: ["Or", ' ', _jsx("button", { onClick: function () { return navigate('/login'); }, className: "font-medium text-blue-600 hover:text-blue-500", children: "sign in to your existing account" })] })] }), error && (_jsx("div", { className: "rounded-md bg-red-50 p-4 mb-4", children: _jsx("div", { className: "flex", children: _jsx("div", { className: "ml-3", children: _jsx("h3", { className: "text-sm font-medium text-red-800", children: error }) }) }) })), _jsx("div", { children: _jsx("button", { onClick: handleGoogleRegister, disabled: isLoading, className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ".concat(isLoading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500', " transition-colors duration-200"), children: isLoading ? (_jsxs("div", { className: "flex items-center", children: [_jsx(Loader, { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white" }), "Registering..."] })) : ('Sign up with Google') }) })] }) }));
};
export default RegisterPage;

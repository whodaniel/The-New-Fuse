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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { auth, googleProvider, signInWithPopup } from '../../lib/firebase';
var LoginPage = function () {
    var navigate = useNavigate();
    var setToken = useAuth().setToken;
    var _a = useState(null), error = _a[0], setError = _a[1];
    var _b = useState(false), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(false), requires2FA = _c[0], setRequires2FA = _c[1];
    var _d = useState(''), userId = _d[0], setUserId = _d[1];
    var handleGoogleLogin = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, user, idTokenResult, token, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    setError(null);
                    setIsLoading(true);
                    return [4 /*yield*/, signInWithPopup(auth, googleProvider)];
                case 1:
                    result = _a.sent();
                    user = result.user;
                    return [4 /*yield*/, user.getIdTokenResult()];
                case 2:
                    idTokenResult = _a.sent();
                    if (idTokenResult.claims['2faEnabled']) {
                        setUserId(user.uid);
                        setRequires2FA(true);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, user.getIdToken()];
                case 3:
                    token = _a.sent();
                    setToken(token);
                    navigate('/workspace');
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    setError(err_1.message);
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handle2FASubmit = function (code) { return __awaiter(void 0, void 0, void 0, function () {
        var response, token, err_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, 4, 5]);
                    setError(null);
                    setIsLoading(true);
                    return [4 /*yield*/, fetch('/api/auth/verify-2fa', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: userId, code: code })
                        })];
                case 1:
                    response = _b.sent();
                    if (!response.ok) {
                        throw new Error('Invalid 2FA code');
                    }
                    return [4 /*yield*/, ((_a = auth.currentUser) === null || _a === void 0 ? void 0 : _a.getIdToken())];
                case 2:
                    token = _b.sent();
                    setToken(token);
                    navigate('/workspace');
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _b.sent();
                    setError(err_2.message);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow", children: [_jsx("div", { children: _jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "Sign in to your account" }) }), error && (_jsx("div", { className: "rounded-md bg-red-50 p-4 mb-4", children: _jsx("div", { className: "flex", children: _jsx("div", { className: "ml-3", children: _jsx("h3", { className: "text-sm font-medium text-red-800", children: error }) }) }) })), requires2FA ? (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Enter 2FA Code" }), _jsx("input", { type: "text", className: "w-full p-2 border rounded mb-4", placeholder: "Enter 2FA code", maxLength: 6, onInput: function (e) {
                                var value = e.target.value;
                                if (/^\d{0,6}$/.test(value)) {
                                    e.target.value = value;
                                }
                                else {
                                    e.target.value = value.slice(0, -1);
                                }
                            }, onKeyPress: function (e) {
                                if (e.key === 'Enter') {
                                    handle2FASubmit(e.target.value);
                                }
                            } }), _jsx("button", { onClick: function () { return handle2FASubmit(userId); }, disabled: isLoading, className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ".concat(isLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500', " transition-colors duration-200"), children: isLoading ? (_jsxs("div", { className: "flex items-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Verifying..."] })) : ('Verify 2FA') })] })) : (_jsx("div", { children: _jsx("button", { onClick: handleGoogleLogin, disabled: isLoading, className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ".concat(isLoading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500', " transition-colors duration-200"), children: isLoading ? (_jsxs("div", { className: "flex items-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Signing in..."] })) : ('Sign in with Google') }) }))] }) }));
};
export default LoginPage;

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
import { jsx as _jsx } from "react/jsx-runtime";
/* global localStorage */
import { createContext, useContext, useState, useEffect } from 'react';
import { authHelpers, supabase } from './lib/supabase';
var AuthContext = createContext({
    isAuthenticated: false,
    token: null,
    user: null,
    setToken: function () { },
    isInitialized: false
});
export var AuthProvider = function (_a) {
    var children = _a.children;
    var _b = useState(localStorage.getItem('auth_token')), token = _b[0], setToken = _b[1];
    var _c = useState(null), user = _c[0], setUser = _c[1];
    var _d = useState(false), isInitialized = _d[0], setIsInitialized = _d[1];
    useEffect(function () {
        // Get initial session
        var initAuth = function () { return __awaiter(void 0, void 0, void 0, function () {
            var session, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        return [4 /*yield*/, authHelpers.getCurrentSession()];
                    case 1:
                        session = _a.sent();
                        if (session === null || session === void 0 ? void 0 : session.user) {
                            setUser(session.user);
                            setToken(session.access_token);
                        }
                        return [3 /*break*/, 4];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Auth initialization error:', error_1);
                        return [3 /*break*/, 4];
                    case 3:
                        setIsInitialized(true);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        initAuth();
        // Listen for auth changes
        var subscription = supabase.auth.onAuthStateChange(function (event, session) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('Auth state change:', event);
                if (session === null || session === void 0 ? void 0 : session.user) {
                    setUser(session.user);
                    setToken(session.access_token);
                }
                else {
                    setUser(null);
                    setToken(null);
                }
                return [2 /*return*/];
            });
        }); }).data.subscription;
        return function () {
            subscription.unsubscribe();
        };
    }, []);
    var value = {
        isAuthenticated: !!token && !!user,
        token: token,
        user: user,
        isInitialized: isInitialized,
        setToken: function (newToken) {
            setToken(newToken);
            if (newToken) {
                localStorage.setItem('auth_token', newToken);
            }
            else {
                localStorage.removeItem('auth_token');
            }
        }
    };
    if (!isInitialized) {
        return _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { role: "status", className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" }) });
    }
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
};
export var useAuth = function () { return useContext(AuthContext); };
export default AuthContext;

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { authHelpers } from '../lib/supabase';
// Get API URL from environment
var API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Production-ready API client
var createApiClient = function () { return ({
    setToken: function (token) {
        localStorage.setItem('auth_token', token);
    },
    clearToken: function () {
        localStorage.removeItem('auth_token');
    },
    request: function (endpoint_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([endpoint_1], args_1, true), void 0, function (endpoint, options) {
            var token, response, errorData;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = localStorage.getItem('auth_token');
                        return [4 /*yield*/, fetch("".concat(API_URL).concat(endpoint), __assign(__assign({}, options), { headers: __assign(__assign({ 'Content-Type': 'application/json' }, (token && { Authorization: "Bearer ".concat(token) })), options.headers) }))];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json().catch(function () { return ({ message: 'Request failed' }); })];
                    case 2:
                        errorData = _a.sent();
                        throw new Error(errorData.message || "HTTP ".concat(response.status, ": ").concat(response.statusText));
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        });
    },
}); };
// Production-ready auth service
var createAuthService = function () {
    var api = createApiClient();
    return {
        getCurrentUser: function () { return __awaiter(void 0, void 0, void 0, function () {
            var user, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, authHelpers.getCurrentUser()];
                    case 1:
                        user = _c.sent();
                        if (!user) {
                            throw new Error('No authenticated user found');
                        }
                        return [2 /*return*/, {
                                data: {
                                    id: user.id,
                                    email: user.email,
                                    name: ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || user.email,
                                    role: ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.role) || 'user'
                                }
                            }];
                    case 2:
                        error_1 = _c.sent();
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        login: function (email, password) { return __awaiter(void 0, void 0, void 0, function () {
            var result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, authHelpers.signIn(email, password)];
                    case 1:
                        result = _a.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Login failed');
                        }
                        return [2 /*return*/, { data: result.data }];
                    case 2:
                        error_2 = _a.sent();
                        // Remove mock authentication - no more demo bypass
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        register: function (name, email, password) { return __awaiter(void 0, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, authHelpers.signUp(email, password, { name: name })];
                    case 1:
                        result = _a.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Registration failed');
                        }
                        return [2 /*return*/, { data: result.data }];
                    case 2:
                        error_3 = _a.sent();
                        // Remove mock registration
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        logout: function () { return __awaiter(void 0, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api.request('/api/auth/logout', { method: 'POST' })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.warn('Logout API failed, clearing local storage');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        refreshToken: function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api.request('/api/auth/refresh', { method: 'POST' })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.token];
                    case 2:
                        error_5 = _a.sent();
                        throw new Error('Token refresh failed');
                    case 3: return [2 /*return*/];
                }
            });
        }); },
    };
};
// Create production-ready services
var authService = createAuthService();
// Create auth context
var AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    register: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    logout: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    error: null,
});
/**
 * Auth provider component
 */
export function AuthProvider(_a) {
    var _this = this;
    var children = _a.children;
    var _b = useState(null), user = _b[0], setUser = _b[1];
    var _c = useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    // Check if user is authenticated
    var checkAuth = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var isAuth, data, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, authHelpers.isAuthenticated()];
                case 1:
                    isAuth = _a.sent();
                    if (!isAuth) {
                        setIsLoading(false);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, authService.getCurrentUser()];
                case 2:
                    data = (_a.sent()).data;
                    setUser(data);
                    setError(null); // Clear any previous errors
                    return [3 /*break*/, 5];
                case 3:
                    error_6 = _a.sent();
                    console.error('Auth check failed:', error_6);
                    setUser(null);
                    setError(error_6.message || 'Authentication failed');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Login user
    var login = useCallback(function (email, password) { return __awaiter(_this, void 0, void 0, function () {
        var data, supabaseUser, error_7;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setError(null);
                    setIsLoading(true);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, authService.login(email, password)];
                case 2:
                    data = (_d.sent()).data;
                    if ((_a = data === null || data === void 0 ? void 0 : data.session) === null || _a === void 0 ? void 0 : _a.user) {
                        supabaseUser = data.session.user;
                        setUser({
                            id: supabaseUser.id,
                            email: supabaseUser.email,
                            name: ((_b = supabaseUser.user_metadata) === null || _b === void 0 ? void 0 : _b.name) || supabaseUser.email,
                            role: ((_c = supabaseUser.user_metadata) === null || _c === void 0 ? void 0 : _c.role) || 'user'
                        });
                    }
                    else {
                        throw new Error('Invalid response from server');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_7 = _d.sent();
                    setError(error_7.message || 'Failed to login');
                    throw error_7;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Register user
    var register = useCallback(function (name, email, password) { return __awaiter(_this, void 0, void 0, function () {
        var data, supabaseUser, error_8;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setError(null);
                    setIsLoading(true);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, authService.register(name, email, password)];
                case 2:
                    data = (_d.sent()).data;
                    if ((_a = data === null || data === void 0 ? void 0 : data.session) === null || _a === void 0 ? void 0 : _a.user) {
                        supabaseUser = data.session.user;
                        setUser({
                            id: supabaseUser.id,
                            email: supabaseUser.email,
                            name: ((_b = supabaseUser.user_metadata) === null || _b === void 0 ? void 0 : _b.name) || supabaseUser.email,
                            role: ((_c = supabaseUser.user_metadata) === null || _c === void 0 ? void 0 : _c.role) || 'user'
                        });
                    }
                    else {
                        throw new Error('Invalid response from server');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_8 = _d.sent();
                    setError(error_8.message || 'Failed to register');
                    throw error_8;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Logout user
    var logout = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, authService.logout()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    error_9 = _a.sent();
                    console.error('Logout error:', error_9);
                    return [3 /*break*/, 5];
                case 4:
                    setUser(null);
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Check auth on mount
    useEffect(function () {
        checkAuth();
    }, [checkAuth]);
    return (_jsx(AuthContext.Provider, { value: {
            user: user,
            isAuthenticated: !!user,
            isLoading: isLoading,
            login: login,
            register: register,
            logout: logout,
            error: error,
        }, children: children }));
}
/**
 * Hook for accessing the auth context
 */
export function useAuth() {
    var context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

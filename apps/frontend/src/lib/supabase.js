/**
 * Simple Auth System for Railway Backend
 * This replaces Supabase authentication with a simple JWT-based auth system
 */
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
// Get API URL from environment
var API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
/**
 * Simple auth helpers that work with Railway backend
 */
export var authHelpers = {
    /**
     * Sign in with email and password
     */
    signIn: function (email, password) {
        return __awaiter(this, void 0, void 0, function () {
            var mockUser, mockSession;
            return __generator(this, function (_a) {
                try {
                    mockUser = {
                        id: 'mock-user-id',
                        email: email,
                        user_metadata: {
                            name: email.split('@')[0],
                            role: 'user'
                        },
                        created_at: new Date().toISOString()
                    };
                    mockSession = {
                        access_token: 'mock-jwt-token-' + Date.now(),
                        refresh_token: 'mock-refresh-token',
                        user: mockUser
                    };
                    // Store in localStorage
                    localStorage.setItem('auth_session', JSON.stringify(mockSession));
                    localStorage.setItem('auth_token', mockSession.access_token);
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                session: mockSession,
                                user: mockUser
                            }
                        }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            success: false,
                            error: error.message || 'Sign in failed'
                        }];
                }
                return [2 /*return*/];
            });
        });
    },
    /**
     * Sign up with email and password
     */
    signUp: function (email, password, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var mockUser, mockSession;
            return __generator(this, function (_a) {
                try {
                    mockUser = {
                        id: 'mock-user-' + Date.now(),
                        email: email,
                        user_metadata: {
                            name: (metadata === null || metadata === void 0 ? void 0 : metadata.name) || email.split('@')[0],
                            role: (metadata === null || metadata === void 0 ? void 0 : metadata.role) || 'user'
                        },
                        created_at: new Date().toISOString()
                    };
                    mockSession = {
                        access_token: 'mock-jwt-token-' + Date.now(),
                        refresh_token: 'mock-refresh-token',
                        user: mockUser
                    };
                    // Store in localStorage
                    localStorage.setItem('auth_session', JSON.stringify(mockSession));
                    localStorage.setItem('auth_token', mockSession.access_token);
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                session: mockSession,
                                user: mockUser
                            }
                        }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            success: false,
                            error: error.message || 'Sign up failed'
                        }];
                }
                return [2 /*return*/];
            });
        });
    },
    /**
     * Sign out
     */
    signOut: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // Clear localStorage
                    localStorage.removeItem('auth_session');
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                session: null,
                                user: null
                            }
                        }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            success: false,
                            error: error.message || 'Sign out failed'
                        }];
                }
                return [2 /*return*/];
            });
        });
    },
    /**
     * Get current user
     */
    getCurrentUser: function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionStr, session;
            return __generator(this, function (_a) {
                try {
                    sessionStr = localStorage.getItem('auth_session');
                    if (!sessionStr)
                        return [2 /*return*/, null];
                    session = JSON.parse(sessionStr);
                    return [2 /*return*/, session.user];
                }
                catch (error) {
                    console.error('Failed to get current user:', error);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
            });
        });
    },
    /**
     * Get current session
     */
    getCurrentSession: function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionStr;
            return __generator(this, function (_a) {
                try {
                    sessionStr = localStorage.getItem('auth_session');
                    if (!sessionStr)
                        return [2 /*return*/, null];
                    return [2 /*return*/, JSON.parse(sessionStr)];
                }
                catch (error) {
                    console.error('Failed to get current session:', error);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
            });
        });
    },
    /**
     * Check if user is authenticated
     */
    isAuthenticated: function () {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCurrentSession()];
                    case 1:
                        session = _a.sent();
                        return [2 /*return*/, !!session && !!session.access_token];
                }
            });
        });
    },
    /**
     * Get access token
     */
    getAccessToken: function () {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCurrentSession()];
                    case 1:
                        session = _a.sent();
                        return [2 /*return*/, (session === null || session === void 0 ? void 0 : session.access_token) || null];
                }
            });
        });
    }
};
/**
 * Mock supabase client for compatibility
 * Only implements the minimal auth functionality needed
 */
export var supabase = {
    auth: {
        onAuthStateChange: function (callback) {
            // Listen for storage events to sync auth state across tabs
            var handleStorageChange = function (e) {
                if (e.key === 'auth_session') {
                    var session = e.newValue ? JSON.parse(e.newValue) : null;
                    callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
                }
            };
            window.addEventListener('storage', handleStorageChange);
            return {
                data: {
                    subscription: {
                        unsubscribe: function () {
                            window.removeEventListener('storage', handleStorageChange);
                        }
                    }
                }
            };
        }
    }
};

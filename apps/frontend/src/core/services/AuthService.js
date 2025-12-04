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
import { StateManager } from '../../domain/core/stateManager';
import { LoggingService } from '../../services/logging';
import { authHelpers } from '../../lib/supabase';
var API_BASE_URL = '/api';
var AuthService = /** @class */ (function () {
    function AuthService() {
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
    }
    AuthService.getInstance = function () {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    };
    AuthService.prototype.login = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var result, data, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, authHelpers.signIn(credentials.email, credentials.password)];
                    case 1:
                        result = _c.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Login failed');
                        }
                        data = result.data;
                        this.setTokens({
                            accessToken: (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token,
                            refreshToken: (_b = data.session) === null || _b === void 0 ? void 0 : _b.refresh_token
                        });
                        return [4 /*yield*/, this.fetchAndSetUserProfile()];
                    case 2:
                        _c.sent();
                        this.eventBus.emit('auth_login', { email: credentials.email }, 'AuthService');
                        return [2 /*return*/, { success: true, data: data.session }];
                    case 3:
                        error_1 = _c.sent();
                        this.logger.error('Login failed', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'LOGIN_FAILED',
                                    message: 'Failed to login',
                                    details: error_1
                                }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.logout = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, authHelpers.signOut()];
                    case 1:
                        result = _a.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Logout failed');
                        }
                        this.clearTokens();
                        this.stateManager.setState(['auth', 'user'], null);
                        this.eventBus.emit('auth_logout', null, 'AuthService');
                        return [2 /*return*/, { success: true, data: undefined }];
                    case 2:
                        error_2 = _a.sent();
                        this.logger.error('Logout failed', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'LOGOUT_FAILED',
                                    message: 'Failed to logout',
                                    details: error_2
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.register = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var result, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, authHelpers.signUp(credentials.email, credentials.password, {
                                name: credentials.name,
                                role: credentials.role || 'user'
                            })];
                    case 1:
                        result = _a.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Registration failed');
                        }
                        data = result.data;
                        if (!data.session) return [3 /*break*/, 3];
                        this.setTokens({
                            accessToken: data.session.access_token,
                            refreshToken: data.session.refresh_token
                        });
                        return [4 /*yield*/, this.fetchAndSetUserProfile()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        this.eventBus.emit('auth_register', { email: credentials.email }, 'AuthService');
                        return [2 /*return*/, { success: true, data: data.session }];
                    case 4:
                        error_3 = _a.sent();
                        this.logger.error('Registration failed', error_3);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'REGISTRATION_FAILED',
                                    message: 'Failed to register',
                                    details: error_3
                                }
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.refreshToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var refreshToken, response, tokens, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        refreshToken = this.getRefreshToken();
                        if (!refreshToken) {
                            throw new Error('No refresh token available');
                        }
                        return [4 /*yield*/, fetch("".concat(API_BASE_URL, "/api/auth/refresh"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ refreshToken: refreshToken })
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Token refresh failed');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        tokens = _a.sent();
                        this.setTokens(tokens);
                        return [2 /*return*/, { success: true, data: tokens }];
                    case 3:
                        error_4 = _a.sent();
                        this.logger.error('Token refresh failed', error_4);
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'TOKEN_REFRESH_FAILED',
                                    message: 'Failed to refresh token',
                                    details: error_4
                                }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.fetchAndSetUserProfile = function () {
        return __awaiter(this, void 0, void 0, function () {
            var user, profile, error_5;
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
                        profile = {
                            id: user.id,
                            email: user.email,
                            name: ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || user.email,
                            role: ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.role) || 'user',
                            created_at: user.created_at
                        };
                        this.stateManager.setState(['auth', 'user'], profile);
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _c.sent();
                        this.logger.error('Failed to fetch user profile', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.isAuthenticated = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, authHelpers.isAuthenticated()];
                    case 1: 
                    // Use Supabase Auth for proper session validation
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthService.prototype.getCurrentUser = function () {
        return this.stateManager.getState(['auth', 'user']);
    };
    AuthService.prototype.setTokens = function (tokens) {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
    };
    AuthService.prototype.clearTokens = function () {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };
    AuthService.prototype.getAccessToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, authHelpers.getAccessToken()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthService.prototype.getRefreshToken = function () {
        return localStorage.getItem('refreshToken');
    };
    AuthService.prototype.subscribeToAuthState = function (callback) {
        return this.stateManager.subscribe(['auth', 'user'], callback);
    };
    return AuthService;
}());
export { AuthService };

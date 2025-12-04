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
/* global describe, beforeEach, it, expect, localStorage, screen */
import '@testing-library/jest-dom/extend-expect';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { auth } from '../lib/firebase';
import { vi } from 'vitest';
// Mock Firebase auth
vi.mock('../lib/firebase', function () { return ({
    auth: {
        onAuthStateChanged: vi.fn(),
        currentUser: null
    }
}); });
// Mock component to test useAuth hook
var TestComponent = function () {
    var _a = useAuth(), isAuthenticated = _a.isAuthenticated, token = _a.token, user = _a.user, isInitialized = _a.isInitialized;
    if (!isInitialized) {
        return _jsx("div", { role: "status", className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" });
    }
    return (_jsxs("div", { children: [_jsx("div", { "data-testid": "auth-status", children: isAuthenticated ? 'authenticated' : 'not-authenticated' }), _jsx("div", { "data-testid": "token", children: token || 'no-token' }), _jsx("div", { "data-testid": "user", children: user ? 'user-exists' : 'no-user' })] }));
};
describe('AuthContext', function () {
    beforeEach(function () {
        vi.clearAllMocks();
        localStorage.clear();
    });
    it('should initialize with not authenticated state', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockAuthStateChanged;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockAuthStateChanged = vi.fn(function (callback) {
                        act(function () {
                            callback(null);
                        });
                        return function () { };
                    });
                    auth.onAuthStateChanged = mockAuthStateChanged;
                    render(_jsx(AuthProvider, { children: _jsx(TestComponent, {}) }));
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
                            expect(screen.getByTestId('token')).toHaveTextContent('no-token');
                            expect(screen.getByTestId('user')).toHaveTextContent('no-user');
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should update state when user authenticates', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockUser, mockAuthStateChanged;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockUser = { getIdToken: function () { return Promise.resolve('test-token'); } };
                    mockAuthStateChanged = vi.fn(function (callback) {
                        act(function () {
                            callback(mockUser);
                        });
                        return function () { };
                    });
                    auth.onAuthStateChanged = mockAuthStateChanged;
                    render(_jsx(AuthProvider, { children: _jsx(TestComponent, {}) }));
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
                            expect(screen.getByTestId('token')).toHaveTextContent('test-token');
                            expect(screen.getByTestId('user')).toHaveTextContent('user-exists');
                        })];
                case 1:
                    _a.sent();
                    expect(localStorage.getItem('auth_token')).toBe('test-token');
                    return [2 /*return*/];
            }
        });
    }); });
    it('should handle user logout', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockAuthStateChanged;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockAuthStateChanged = vi.fn(function (callback) {
                        act(function () {
                            callback(null);
                        });
                        return function () { };
                    });
                    auth.onAuthStateChanged = mockAuthStateChanged;
                    render(_jsx(AuthProvider, { children: _jsx(TestComponent, {}) }));
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
                            expect(screen.getByTestId('token')).toHaveTextContent('no-token');
                            expect(screen.getByTestId('user')).toHaveTextContent('no-user');
                        })];
                case 1:
                    _a.sent();
                    expect(localStorage.getItem('auth_token')).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should show loading state before initialization', function () { return __awaiter(void 0, void 0, void 0, function () {
        var authCallback, mockAuthStateChanged;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    authCallback = null;
                    mockAuthStateChanged = vi.fn(function (callback) {
                        authCallback = callback;
                        return function () { };
                    });
                    auth.onAuthStateChanged = mockAuthStateChanged;
                    render(_jsx(AuthProvider, { children: _jsx(TestComponent, {}) }));
                    expect(screen.getByRole('status')).toBeInTheDocument();
                    if (!authCallback) return [3 /*break*/, 2];
                    act(function () {
                        authCallback(null);
                    });
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByRole('status')).not.toBeInTheDocument();
                        })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); });
    it('should cleanup auth listener on unmount', function () {
        var unsubscribe = vi.fn();
        var mockAuthStateChanged = vi.fn(function () { return unsubscribe; });
        auth.onAuthStateChanged = mockAuthStateChanged;
        var unmount = render(_jsx(AuthProvider, { children: _jsx(TestComponent, {}) })).unmount;
        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });
});

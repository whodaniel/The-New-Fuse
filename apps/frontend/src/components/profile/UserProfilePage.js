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
import { useState, useEffect } from 'react';
var UserProfilePage = function () {
    var _a = useState(null), profile = _a[0], setProfile = _a[1];
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState(null), successMessage = _d[0], setSuccessMessage = _d[1];
    // Form state
    var _e = useState(''), displayName = _e[0], setDisplayName = _e[1];
    var _f = useState(''), bio = _f[0], setBio = _f[1];
    var _g = useState('system'), theme = _g[0], setTheme = _g[1];
    var _h = useState(false), notifications = _h[0], setNotifications = _h[1];
    var API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'; // Using Vite environment variables
    useEffect(function () {
        var fetchProfile = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, data, err_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setIsLoading(true);
                        setError(null);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch("".concat(API_BASE_URL, "/api/users/profile"))];
                    case 2:
                        response = _c.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch profile: ".concat(response.statusText, " (Status: ").concat(response.status, ")"));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _c.sent();
                        setProfile(data);
                        // Initialize form fields
                        setDisplayName(data.displayName || '');
                        setBio(data.bio || '');
                        setTheme(((_a = data.preferences) === null || _a === void 0 ? void 0 : _a.theme) || 'system');
                        setNotifications(((_b = data.preferences) === null || _b === void 0 ? void 0 : _b.notifications) || false);
                        return [3 /*break*/, 6];
                    case 4:
                        err_1 = _c.sent();
                        setError(err_1 instanceof Error ? err_1.message : 'An unknown error occurred');
                        console.error("Fetch profile error:", err_1);
                        return [3 /*break*/, 6];
                    case 5:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        fetchProfile();
    }, [API_BASE_URL]);
    var handleSubmit = function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var updatedProfileData, response_1, errorData, updatedProfile, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    setError(null);
                    setSuccessMessage(null);
                    setIsLoading(true);
                    updatedProfileData = {
                        displayName: displayName,
                        bio: bio,
                        preferences: {
                            theme: theme,
                            notifications: notifications,
                        },
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("".concat(API_BASE_URL, "/api/users/profile"), {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                // Add Authorization header if needed: 'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(updatedProfileData),
                        })];
                case 2:
                    response_1 = _a.sent();
                    if (!!response_1.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response_1.json().catch(function () { return ({ message: "Failed to update profile: ".concat(response_1.statusText) }); })];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.message || "Failed to update profile: ".concat(response_1.statusText, " (Status: ").concat(response_1.status, ")"));
                case 4: return [4 /*yield*/, response_1.json()];
                case 5:
                    updatedProfile = _a.sent();
                    setProfile(updatedProfile);
                    setSuccessMessage('Profile updated successfully!');
                    return [3 /*break*/, 8];
                case 6:
                    err_2 = _a.sent();
                    setError(err_2 instanceof Error ? err_2.message : 'An unknown error occurred while updating');
                    console.error("Update profile error:", err_2);
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    if (isLoading && !profile) { // Show loading only on initial load
        return _jsx("p", { children: "Loading profile..." });
    }
    if (error && !profile) { // Show error if initial load failed
        return _jsxs("p", { style: { color: 'red' }, children: ["Error loading profile: ", error] });
    }
    if (!profile) {
        return _jsx("p", { children: "No profile data available." });
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "User Profile" }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", profile.email] }), error && _jsxs("p", { style: { color: 'red' }, children: ["Error: ", error] }), successMessage && _jsx("p", { style: { color: 'green' }, children: successMessage }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "displayName", children: "Display Name:" }), _jsx("input", { type: "text", id: "displayName", value: displayName, onChange: function (e) { return setDisplayName(e.target.value); }, disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "bio", children: "Bio:" }), _jsx("textarea", { id: "bio", value: bio, onChange: function (e) { return setBio(e.target.value); }, disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "theme", children: "Theme:" }), _jsxs("select", { id: "theme", value: theme, onChange: function (e) { return setTheme(e.target.value); }, disabled: isLoading, children: [_jsx("option", { value: "light", children: "Light" }), _jsx("option", { value: "dark", children: "Dark" }), _jsx("option", { value: "system", children: "System" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "notifications", children: "Enable Notifications:" }), _jsx("input", { type: "checkbox", id: "notifications", checked: notifications, onChange: function (e) { return setNotifications(e.target.checked); }, disabled: isLoading })] }), _jsx("button", { type: "submit", disabled: isLoading, children: isLoading ? 'Saving...' : 'Save Profile' })] })] }));
};
export default UserProfilePage;

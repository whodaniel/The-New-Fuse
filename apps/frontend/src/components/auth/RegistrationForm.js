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
// apps/frontend/src/components/auth/RegistrationForm.tsx
import { useState } from 'react';
var RegistrationForm = function () {
    var _a = useState(''), username = _a[0], setUsername = _a[1];
    var _b = useState(''), email = _b[0], setEmail = _b[1];
    var _c = useState(''), password = _c[0], setPassword = _c[1];
    var _d = useState(''), confirmPassword = _d[0], setConfirmPassword = _d[1];
    var _e = useState(null), message = _e[0], setMessage = _e[1];
    var _f = useState(null), error = _f[0], setError = _f[1];
    var handleSubmit = function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    setError(null);
                    setMessage(null);
                    if (password !== confirmPassword) {
                        setError("Passwords do not match");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch('/api/auth/register', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username: username, email: email, password: password }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (response.ok) {
                        setMessage(data.message || 'Registration successful!');
                        // Optionally clear form or redirect
                        setUsername('');
                        setEmail('');
                        setPassword('');
                        setConfirmPassword('');
                    }
                    else {
                        setError(data.message || 'Registration failed. Please try again.');
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    console.error('Registration request failed:', err_1);
                    setError('An unexpected error occurred. Please try again later.');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { style: { maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }, children: [_jsx("h2", { children: "Register" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("label", { htmlFor: "username", children: "Username:" }), _jsx("input", { type: "text", id: "username", value: username, onChange: function (e) { return setUsername(e.target.value); }, required: true, style: { width: '100%', padding: '8px', boxSizing: 'border-box' } })] }), _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("label", { htmlFor: "email", children: "Email:" }), _jsx("input", { type: "email", id: "email", value: email, onChange: function (e) { return setEmail(e.target.value); }, required: true, style: { width: '100%', padding: '8px', boxSizing: 'border-box' } })] }), _jsxs("div", { style: { marginBottom: '10px' }, children: [_jsx("label", { htmlFor: "password", children: "Password:" }), _jsx("input", { type: "password", id: "password", value: password, onChange: function (e) { return setPassword(e.target.value); }, required: true, style: { width: '100%', padding: '8px', boxSizing: 'border-box' } })] }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { htmlFor: "confirmPassword", children: "Confirm Password:" }), _jsx("input", { type: "password", id: "confirmPassword", value: confirmPassword, onChange: function (e) { return setConfirmPassword(e.target.value); }, required: true, style: { width: '100%', padding: '8px', boxSizing: 'border-box' } })] }), _jsx("button", { type: "submit", style: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }, children: "Register" })] }), message && _jsx("p", { style: { color: 'green', marginTop: '10px' }, children: message }), error && _jsx("p", { style: { color: 'red', marginTop: '10px' }, children: error })] }));
};
export default RegistrationForm;

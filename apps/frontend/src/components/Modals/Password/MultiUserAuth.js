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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import System from "../../../models/system";
import { AUTH_TOKEN, AUTH_USER } from "../../../utils/constants";
import paths from "../../../utils/paths";
import showToast from "@/utils/toast";
import { useModal } from "@/hooks/useModal";
import RecoveryCodeModal from "@/components/Modals/DisplayRecoveryCodeModal";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
var RecoveryForm = function (_a) {
    var onSubmit = _a.onSubmit, setShowRecoveryForm = _a.setShowRecoveryForm;
    var t = useTranslation().t;
    var _b = useState(""), username = _b[0], setUsername = _b[1];
    var _c = useState(Array(2).fill("")), recoveryCodeInputs = _c[0], setRecoveryCodeInputs = _c[1];
    var handleRecoveryCodeChange = function (index, value) {
        var updatedCodes = __spreadArray([], recoveryCodeInputs, true);
        updatedCodes[index] = value;
        setRecoveryCodeInputs(updatedCodes);
    };
    var handleSubmit = function (e) {
        e.preventDefault();
        var recoveryCodes = recoveryCodeInputs.filter(function (code) { return code.trim() !== ""; });
        onSubmit(username, recoveryCodes);
    };
    return (_jsxs("div", { className: "w-full max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t("login.password-reset.title") }), _jsx(DialogDescription, { children: t("login.password-reset.description") })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "username", className: "text-sm font-medium", children: t("login.multi-user.placeholder-username") }), _jsx(Input, { id: "username", name: "username", type: "text", placeholder: t("login.multi-user.placeholder-username"), value: username, onChange: function (e) { return setUsername(e.target.value); }, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t("login.password-reset.recovery-codes") }), recoveryCodeInputs.map(function (code, index) { return (_jsx(Input, { type: "text", name: "recoveryCode".concat(index + 1), placeholder: t("login.password-reset.recovery-code", {
                                    index: index + 1,
                                }), value: code, onChange: function (e) {
                                    return handleRecoveryCodeChange(index, e.target.value);
                                }, required: true }, index)); })] }), _jsxs(DialogFooter, { className: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", children: [_jsx(Button, { type: "submit", children: t("login.password-reset.title") }), _jsx(Button, { type: "button", variant: "ghost", onClick: function () { return setShowRecoveryForm(false); }, children: t("login.password-reset.back") })] })] })] }));
};
var ResetPasswordForm = function (_a) {
    var onSubmit = _a.onSubmit;
    var _b = useState(""), newPassword = _b[0], setNewPassword = _b[1];
    var _c = useState(""), confirmPassword = _c[0], setConfirmPassword = _c[1];
    var handleSubmit = function (e) {
        e.preventDefault();
        onSubmit(newPassword, confirmPassword);
    };
    return (_jsxs("div", { className: "w-full max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Reset Password" }), _jsx(DialogDescription, { children: "Enter your new password." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "newPassword", children: "New Password" }), _jsx(Input, { id: "newPassword", type: "password", name: "newPassword", placeholder: "New Password", value: newPassword, onChange: function (e) { return setNewPassword(e.target.value); }, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "confirmPassword", children: "Confirm Password" }), _jsx(Input, { id: "confirmPassword", type: "password", name: "confirmPassword", placeholder: "Confirm Password", value: confirmPassword, onChange: function (e) { return setConfirmPassword(e.target.value); }, required: true })] }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", children: "Reset Password" }) })] })] }));
};
export default function MultiUserAuth() {
    var _this = this;
    var t = useTranslation().t;
    var _a = useModal(), isRecoveryModalOpen = _a.isOpen, openRecoveryModal = _a.openModal, closeRecoveryModal = _a.closeModal;
    var _b = useState(""), username = _b[0], setUsername = _b[1];
    var _c = useState(""), password = _c[0], setPassword = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(null), appName = _e[0], setAppName = _e[1];
    var _f = useState(null), recoveryCodes = _f[0], setRecoveryCodes = _f[1];
    var _g = useState(false), showRecoveryForm = _g[0], setShowRecoveryForm = _g[1];
    var _h = useState(false), showResetPasswordForm = _h[0], setShowResetPasswordForm = _h[1];
    var _j = useState(null), resetToken = _j[0], setResetToken = _j[1];
    useEffect(function () {
        var fetchAppName = function () { return __awaiter(_this, void 0, void 0, function () {
            var appName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, System.keys()];
                    case 1:
                        appName = (_a.sent()).appName;
                        setAppName(appName);
                        return [2 /*return*/];
                }
            });
        }); };
        fetchAppName();
    }, []);
    var handleLogin = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var _a, valid, user, token, message, recoveryCodes;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    setError(null);
                    return [4 /*yield*/, System.login(username, password)];
                case 1:
                    _a = _b.sent(), valid = _a.valid, user = _a.user, token = _a.token, message = _a.message, recoveryCodes = _a.recoveryCodes;
                    if (valid && !!token) {
                        if (recoveryCodes) {
                            setRecoveryCodes(recoveryCodes);
                            openRecoveryModal();
                        }
                        window.localStorage.setItem(AUTH_TOKEN, token);
                        window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
                        window.location.replace(paths.home());
                    }
                    else {
                        setError(message);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleRecovery = function (username, recoveryCodes) { return __awaiter(_this, void 0, void 0, function () {
        var _a, success, resetToken, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, System.recoverPassword(username, recoveryCodes)];
                case 1:
                    _a = (_b.sent()), success = _a.success, resetToken = _a.resetToken, error = _a.error;
                    if (success && resetToken) {
                        setResetToken(resetToken);
                        setShowRecoveryForm(false);
                        setShowResetPasswordForm(true);
                    }
                    else {
                        showToast(error, "error");
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleResetPassword = function (newPassword, confirmPassword) { return __awaiter(_this, void 0, void 0, function () {
        var _a, success, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (newPassword !== confirmPassword) {
                        showToast("Passwords do not match", "error");
                        return [2 /*return*/];
                    }
                    if (!resetToken)
                        return [2 /*return*/];
                    return [4 /*yield*/, System.resetPassword(resetToken, newPassword)];
                case 1:
                    _a = (_b.sent()), success = _a.success, error = _a.error;
                    if (success) {
                        setShowResetPasswordForm(false);
                        showToast("Password reset successfully. You can now log in.", "success");
                    }
                    else {
                        showToast(error, "error");
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(Dialog, { open: true, onOpenChange: function () { }, children: [_jsx(DialogContent, { className: "w-full max-w-md", children: showRecoveryForm ? (_jsx(RecoveryForm, { onSubmit: handleRecovery, setShowRecoveryForm: setShowRecoveryForm })) : showResetPasswordForm ? (_jsx(ResetPasswordForm, { onSubmit: handleResetPassword })) : (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-x-2", children: [_jsx("span", { className: "text-2xl font-bold text-white", children: t("login.multi-user.title") }), _jsx("span", { className: "text-2xl font-bold bg-gradient-to-r from-[#75D6FF] to-[#FFFFFF] bg-clip-text text-transparent", children: appName })] }), _jsx(DialogDescription, { children: t("login.multi-user.description") })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "username", children: t("login.multi-user.placeholder-username") }), _jsx(Input, { id: "username", name: "username", type: "text", placeholder: t("login.multi-user.placeholder-username"), value: username, onChange: function (e) { return setUsername(e.target.value); }, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "password", children: t("login.multi-user.placeholder-password") }), _jsx(Input, { id: "password", name: "password", type: "password", placeholder: t("login.multi-user.placeholder-password"), value: password, onChange: function (e) { return setPassword(e.target.value); }, required: true })] }), error && _jsx("p", { className: "text-sm text-red-500", children: error }), _jsxs(DialogFooter, { className: "flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center", children: [_jsx(Button, { type: "button", variant: "link", onClick: function () { return setShowRecoveryForm(true); }, className: "p-0 h-auto", children: t("login.password-reset.title") }), _jsx(Button, { type: "submit", children: t("login.multi-user.login-button") })] })] })] })) }), isRecoveryModalOpen && recoveryCodes && (_jsx(RecoveryCodeModal, { newRecoveryCodes: recoveryCodes, closeModal: closeRecoveryModal }))] }));
}
div >
;
div >
;
div >
    _jsx("div", { className: STYLES.buttonContainer, children: _jsx("button", { type: "submit", className: STYLES.button, children: "Reset Password" }) });
form >
;
;
;
export function MultiUserAuth() {
    var _this = this;
    var t = useTranslation().t;
    var _a = useState(false), loading = _a[0], setLoading = _a[1];
    var _b = useState(null), error = _b[0], setError = _b[1];
    var _c = useState([]), recoveryCodes = _c[0], setRecoveryCodes = _c[1];
    var _d = useState(false), downloadComplete = _d[0], setDownloadComplete = _d[1];
    var _e = useState(null), user = _e[0], setUser = _e[1];
    var _f = useState(null), token = _f[0], setToken = _f[1];
    var _g = useState(false), showRecoveryForm = _g[0], setShowRecoveryForm = _g[1];
    var _h = useState(false), showResetPasswordForm = _h[0], setShowResetPasswordForm = _h[1];
    var _j = useState(null), customAppName = _j[0], setCustomAppName = _j[1];
    var _k = useModal(), isRecoveryCodeModalOpen = _k.isOpen, openRecoveryCodeModal = _k.openModal, closeRecoveryCodeModal = _k.closeModal;
    var handleLogin = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var data, form, _i, _a, _b, key, value, _c, valid, user, token, message, recoveryCodes;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setError(null);
                    setLoading(true);
                    e.preventDefault();
                    data = {};
                    form = new FormData(e.currentTarget);
                    for (_i = 0, _a = form.entries(); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        data[key] = value.toString();
                    }
                    return [4 /*yield*/, System.requestToken(data)];
                case 1:
                    _c = _d.sent(), valid = _c.valid, user = _c.user, token = _c.token, message = _c.message, recoveryCodes = _c.recoveryCodes;
                    if (valid && token && user) {
                        setUser(user);
                        setToken(token);
                        if (recoveryCodes) {
                            setRecoveryCodes(recoveryCodes);
                            openRecoveryCodeModal();
                        }
                        else {
                            window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
                            window.localStorage.setItem(AUTH_TOKEN, token);
                            window.location.href = paths.home();
                        }
                    }
                    else {
                        setError(message || "An error occurred during login");
                        setLoading(false);
                    }
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDownloadComplete = function () { return setDownloadComplete(true); };
    var handleResetPassword = function () { return setShowRecoveryForm(true); };
    var handleRecoverySubmit = function (username, recoveryCodes) { return __awaiter(_this, void 0, void 0, function () {
        var _a, success, resetToken, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, System.recoverAccount(username, recoveryCodes)];
                case 1:
                    _a = _b.sent(), success = _a.success, resetToken = _a.resetToken, error = _a.error;
                    if (success && resetToken) {
                        window.localStorage.setItem("resetToken", resetToken);
                        setShowRecoveryForm(false);
                        setShowResetPasswordForm(true);
                    }
                    else {
                        showToast(error || "Recovery failed", "error", { clear: true });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleResetSubmit = function (newPassword, confirmPassword) { return __awaiter(_this, void 0, void 0, function () {
        var resetToken, _a, success, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    resetToken = window.localStorage.getItem("resetToken");
                    if (!resetToken) return [3 /*break*/, 2];
                    return [4 /*yield*/, System.resetPassword(resetToken, newPassword, confirmPassword)];
                case 1:
                    _a = _b.sent(), success = _a.success, error_1 = _a.error;
                    if (success) {
                        window.localStorage.removeItem("resetToken");
                        setShowResetPasswordForm(false);
                        showToast("Password reset successful", "success", { clear: true });
                    }
                    else {
                        showToast(error_1 || "Password reset failed", "error", { clear: true });
                    }
                    return [3 /*break*/, 3];
                case 2:
                    showToast("Invalid reset token", "error", { clear: true });
                    _b.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        if (downloadComplete && user && token) {
            window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
            window.localStorage.setItem(AUTH_TOKEN, token);
            window.location.href = paths.home();
        }
    }, [downloadComplete, user, token]);
    useEffect(function () {
        var fetchCustomAppName = function () { return __awaiter(_this, void 0, void 0, function () {
            var appName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, System.fetchCustomAppName()];
                    case 1:
                        appName = (_a.sent()).appName;
                        setCustomAppName(appName || "");
                        setLoading(false);
                        return [2 /*return*/];
                }
            });
        }); };
        fetchCustomAppName();
    }, []);
    if (showRecoveryForm) {
        return (_jsx(RecoveryForm, { onSubmit: handleRecoverySubmit, setShowRecoveryForm: setShowRecoveryForm }));
    }
    if (showResetPasswordForm) {
        return _jsx(ResetPasswordForm, { onSubmit: handleResetSubmit });
    }
    return (_jsx(_Fragment, { children: _jsxs("form", { onSubmit: handleLogin, children: [_jsxs("div", { className: STYLES.container, children: [_jsx("div", { className: STYLES.header, children: _jsxs("div", { className: STYLES.headerContent, children: [_jsxs("div", { className: STYLES.titleContainer, children: [_jsx("h3", { className: STYLES.title, children: t("login.multi-user.welcome") }), _jsx("p", { className: STYLES.appName, children: customAppName || "AnythingLLM" })] }), _jsxs("p", { className: STYLES.subtitle, children: [t("login.sign-in.start"), " ", customAppName || "AnythingLLM", " ", t("login.sign-in.end")] }), _jsx("div", { className: STYLES.formContent, children: _jsxs("div", { className: STYLES.inputContainer, children: [_jsx("div", { className: STYLES.inputWrapper, children: _jsx("input", { name: "username", type: "text", placeholder: t("login.multi-user.placeholder-username"), className: STYLES.input, required: true, autoComplete: "off" }) }), _jsx("div", { className: STYLES.inputWrapper, children: _jsx("input", { name: "password", type: "password", placeholder: t("login.multi-user.placeholder-password"), className: STYLES.input, required: true, autoComplete: "off" }) }), error && _jsxs("p", { className: STYLES.error, children: ["Error: ", error] })] }) }), _jsxs("div", { className: STYLES.buttonContainer, children: [_jsx("button", { disabled: loading, type: "submit", className: STYLES.button, children: loading
                                                    ? t("login.multi-user.validating")
                                                    : t("login.multi-user.login") }), _jsxs("button", { type: "button", className: STYLES.resetButton, onClick: handleResetPassword, children: [t("login.multi-user.forgot-pass"), "?", _jsx("b", { children: t("login.multi-user.reset") })] })] })] }) }), _jsx(ModalWrapper, { isOpen: isRecoveryCodeModalOpen, noPortal: true, children: _jsx(RecoveryCodeModal, { recoveryCodes: recoveryCodes, onDownloadComplete: handleDownloadComplete, onClose: closeRecoveryCodeModal }) })] }), "); }"] }) }));
}

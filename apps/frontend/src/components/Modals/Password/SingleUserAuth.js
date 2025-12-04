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
import { useEffect, useState } from "react";
import System from "../../../models/system";
import { AUTH_TOKEN } from "../../../utils/constants";
import paths from "../../../utils/paths";
import { useModal } from "@/hooks/useModal";
import RecoveryCodeModal from "@/components/Modals/DisplayRecoveryCodeModal";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function SingleUserAuth() {
    var _this = this;
    var t = useTranslation().t;
    var _a = useState(false), loading = _a[0], setLoading = _a[1];
    var _b = useState(null), error = _b[0], setError = _b[1];
    var _c = useState([]), recoveryCodes = _c[0], setRecoveryCodes = _c[1];
    var _d = useState(false), downloadComplete = _d[0], setDownloadComplete = _d[1];
    var _e = useState(null), token = _e[0], setToken = _e[1];
    var _f = useState(null), customAppName = _f[0], setCustomAppName = _f[1];
    var _g = useModal(), isRecoveryCodeModalOpen = _g.isOpen, openRecoveryCodeModal = _g.openModal, closeRecoveryCodeModal = _g.closeModal;
    var handleLogin = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var data, form, _i, _a, _b, key, value, _c, valid, token, message, recoveryCodes;
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
                    _c = _d.sent(), valid = _c.valid, token = _c.token, message = _c.message, recoveryCodes = _c.recoveryCodes;
                    if (valid && token) {
                        setToken(token);
                        if (recoveryCodes) {
                            setRecoveryCodes(recoveryCodes);
                            openRecoveryCodeModal();
                        }
                        else {
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
    var handleDownloadComplete = function () {
        setDownloadComplete(true);
    };
    useEffect(function () {
        if (downloadComplete && token) {
            window.localStorage.setItem(AUTH_TOKEN, token);
            window.location.href = paths.home();
        }
    }, [downloadComplete, token]);
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
    return (_jsxs(Dialog, { open: true, onOpenChange: function () { }, children: [_jsxs(DialogContent, { className: "w-full max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center flex-col gap-y-4", children: [_jsxs("div", { className: "flex gap-x-1", children: [_jsx("h3", { className: "text-md md:text-2xl font-bold text-white text-center whitespace-nowrap hidden md:block", children: t("login.multi-user.welcome") }), _jsx("p", { className: "text-4xl md:text-2xl font-bold bg-gradient-to-r from-[#75D6FF] via-[#FFFFFF] light:via-[#75D6FF] to-[#FFFFFF] light:to-[#75D6FF] bg-clip-text text-transparent", children: customAppName || "AnythingLLM" })] }), _jsxs("p", { className: "text-sm text-theme-text-secondary text-center", children: [t("login.sign-in.start"), " ", customAppName || "AnythingLLM", " ", t("login.sign-in.end")] })] }) }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4 py-4", children: [_jsx("div", { className: "space-y-2", children: _jsx(Input, { name: "password", type: "password", placeholder: "Password", required: true, autoComplete: "off" }) }), error && _jsxs("p", { className: "text-sm text-red-500", children: ["Error: ", error] }), _jsx(DialogFooter, { children: _jsx(Button, { disabled: loading, type: "submit", className: "w-full", children: loading
                                        ? t("login.multi-user.validating")
                                        : t("login.multi-user.login") }) })] })] }), isRecoveryCodeModalOpen && (_jsx(RecoveryCodeModal, { newRecoveryCodes: recoveryCodes, closeModal: closeRecoveryCodeModal, onDownloadComplete: handleDownloadComplete }))] }));
}

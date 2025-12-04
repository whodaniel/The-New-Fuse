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
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { isMobile } from "react-device-detect";
import { BookOpen, DiscordLogo, GithubLogo, Briefcase, Envelope, Globe, HouseLine, Info, LinkSimple, } from "@phosphor-icons/react";
import System from "@/models/system";
import paths from "@/utils/paths";
import { SettingsButton } from '../SettingsButton';
export var MAX_ICONS = 3;
export var ICON_COMPONENTS = {
    BookOpen: BookOpen,
    DiscordLogo: DiscordLogo,
    GithubLogo: GithubLogo,
    Envelope: Envelope,
    LinkSimple: LinkSimple,
    HouseLine: HouseLine,
    Globe: Globe,
    Briefcase: Briefcase,
    Info: Info,
};
export function Footer() {
    var _a = useState(false), footerData = _a[0], setFooterData = _a[1];
    useEffect(function () {
        function fetchFooterData() {
            return __awaiter(this, void 0, void 0, function () {
                var footerData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, System.fetchCustomFooterIcons()];
                        case 1:
                            footerData = (_a.sent()).footerData;
                            setFooterData(footerData);
                            return [2 /*return*/];
                    }
                });
            });
        }
        fetchFooterData();
    }, []);
    // wait for some kind of non-false response from footer data first
    // to prevent pop-in.
    if (footerData === false)
        return null;
    if (!Array.isArray(footerData) || footerData.length === 0) {
        return (_jsxs("div", { className: "flex justify-center mb-2", children: [_jsxs("div", { className: "flex space-x-4", children: [_jsx("div", { className: "flex w-fit", children: _jsx(Link, { to: paths.github(), target: "_blank", rel: "noreferrer", className: "transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover", "aria-label": "Find us on Github", "data-tooltip-id": "footer-item", "data-tooltip-content": "View source code on Github", children: _jsx(GithubLogo, { weight: "fill", className: "h-5 w-5", color: "var(--theme-sidebar-footer-icon-fill)" }) }) }), _jsx("div", { className: "flex w-fit", children: _jsx(Link, { to: paths.docs(), target: "_blank", rel: "noreferrer", className: "transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover", "aria-label": "Docs", "data-tooltip-id": "footer-item", "data-tooltip-content": "Open AnythingLLM help docs", children: _jsx(BookOpen, { weight: "fill", className: "h-5 w-5", color: "var(--theme-sidebar-footer-icon-fill)" }) }) }), _jsx("div", { className: "flex w-fit", children: _jsx(Link, { to: paths.discord(), target: "_blank", rel: "noreferrer", className: "transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover", "aria-label": "Join our Discord server", "data-tooltip-id": "footer-item", "data-tooltip-content": "Join the AnythingLLM Discord", children: _jsx(DiscordLogo, { weight: "fill", className: "h-5 w-5", color: "var(--theme-sidebar-footer-icon-fill)" }) }) }), _jsx("div", { className: "flex w-fit", children: _jsx(SettingsButton, {}) })] }), !isMobile && _jsx(Tooltip, { id: "footer-item" })] }));
    }
    return (_jsxs("div", { className: "flex justify-center mb-2", children: [_jsxs("div", { className: "flex space-x-4", children: [footerData.slice(0, MAX_ICONS).map(function (item, i) {
                        var IconComponent = ICON_COMPONENTS[item.icon];
                        return (_jsx("div", { className: "flex w-fit", children: _jsx(Link, { to: item.href, target: "_blank", rel: "noreferrer", className: "transition-all duration-300 p-2 rounded-full bg-theme-sidebar-footer-icon hover:bg-theme-sidebar-footer-icon-hover", "aria-label": item.label, "data-tooltip-id": "footer-item", "data-tooltip-content": item.tooltip, children: _jsx(IconComponent, { weight: "fill", className: "h-5 w-5", color: "var(--theme-sidebar-footer-icon-fill)" }) }) }, i));
                    }), _jsx("div", { className: "flex w-fit", children: _jsx(SettingsButton, {}) })] }), !isMobile && _jsx(Tooltip, { id: "footer-item" })] }));
}

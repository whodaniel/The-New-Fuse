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
import { createContext, useState, useContext, useEffect } from 'react';
import AnythingLLM from './media/logo/anything-llm.png';
import AnythingLLMDark from './media/logo/anything-llm-dark.png';
import DefaultLoginLogoLight from './media/illustrations/login-logo.svg';
import System from './models/system';
export var REFETCH_LOGO_EVENT = "refetch-logo";
var LogoContext = createContext(null);
var defaultLogo = {
    url: AnythingLLM,
    alt: 'Anything LLM',
    width: 150,
    height: 40,
};
var defaultLoginLogo = DefaultLoginLogoLight;
export function LogoProvider(_a) {
    var children = _a.children;
    var _b = useState(defaultLogo), logo = _b[0], setLogo = _b[1];
    var _c = useState(defaultLoginLogo), loginLogo = _c[0], setLoginLogo = _c[1];
    var _d = useState(false), isCustomLogo = _d[0], setIsCustomLogo = _d[1];
    var resetLogo = function () {
        setLogo(defaultLogo);
        setLoginLogo(defaultLoginLogo);
        setIsCustomLogo(false);
    };
    function fetchInstanceLogo() {
        return __awaiter(this, void 0, void 0, function () {
            var _a, isCustomLogo_1, logoURL, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, System.fetchLogo()];
                    case 1:
                        _a = _b.sent(), isCustomLogo_1 = _a.isCustomLogo, logoURL = _a.logoURL;
                        if (logoURL) {
                            setLogo({ url: logoURL, alt: 'Custom Logo', width: 150, height: 40 });
                            setLoginLogo(isCustomLogo_1 ? logoURL : defaultLoginLogo);
                            setIsCustomLogo(isCustomLogo_1);
                        }
                        else {
                            localStorage.getItem("theme") !== "default"
                                ? setLogo({ url: AnythingLLMDark, alt: 'Anything LLM Dark', width: 150, height: 40 })
                                : setLogo(defaultLogo);
                            setLoginLogo(defaultLoginLogo);
                            setIsCustomLogo(false);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _b.sent();
                        localStorage.getItem("theme") !== "default"
                            ? setLogo({ url: AnythingLLMDark, alt: 'Anything LLM Dark', width: 150, height: 40 })
                            : setLogo(defaultLogo);
                        setLoginLogo(defaultLoginLogo);
                        setIsCustomLogo(false);
                        console.error("Failed to fetch logo:", err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    useEffect(function () {
        fetchInstanceLogo();
        window.addEventListener(REFETCH_LOGO_EVENT, fetchInstanceLogo);
        return function () {
            window.removeEventListener(REFETCH_LOGO_EVENT, fetchInstanceLogo);
        };
    }, []);
    return (_jsx(LogoContext.Provider, { value: { logo: logo, setLogo: setLogo, loginLogo: loginLogo, isCustomLogo: isCustomLogo, resetLogo: resetLogo }, children: children }));
}
export function useLogo() {
    var context = useContext(LogoContext);
    if (!context) {
        throw new Error('useLogo must be used within a LogoProvider');
    }
    return context;
}

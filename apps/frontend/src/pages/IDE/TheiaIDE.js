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
/**
 * Theia IDE Integration Page
 * Provides embedded access to the Theia IDE within TNF platform
 */
import { useEffect, useState } from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Spinner, VStack, HStack, Button, Text } from '@chakra-ui/react';
var TheiaIDE = function () {
    var _a = useState({ status: 'loading' }), ideStatus = _a[0], setIdeStatus = _a[1];
    var ideUrl = import.meta.env.VITE_THEIA_IDE_URL || 'http://localhost:3007';
    useEffect(function () {
        // Check if IDE is available
        var checkIdeHealth = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(ideUrl, "/health"), {
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.ok) {
                            setIdeStatus({ status: 'ready' });
                        }
                        else {
                            setIdeStatus({
                                status: 'error',
                                message: 'IDE is not responding. Please ensure the IDE service is running.',
                            });
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        setIdeStatus({
                            status: 'error',
                            message: "Failed to connect to IDE at ".concat(ideUrl, ". Please check if the service is running."),
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        checkIdeHealth();
    }, [ideUrl]);
    var handleRefresh = function () {
        setIdeStatus({ status: 'loading' });
        window.location.reload();
    };
    var handleOpenInNewTab = function () {
        window.open(ideUrl, '_blank', 'noopener,noreferrer');
    };
    if (ideStatus.status === 'loading') {
        return (_jsx(Box, { w: "100%", h: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", bg: "gray.50", children: _jsxs(VStack, { spacing: 4, children: [_jsx(Spinner, { size: "xl", color: "blue.500", thickness: "4px" }), _jsx(Text, { fontSize: "lg", color: "gray.600", children: "Loading Theia IDE..." })] }) }));
    }
    if (ideStatus.status === 'error') {
        return (_jsx(Box, { w: "100%", h: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", bg: "gray.50", p: 6, children: _jsxs(Alert, { status: "error", variant: "subtle", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", maxW: "2xl", borderRadius: "lg", p: 8, children: [_jsx(AlertIcon, { boxSize: "40px", mr: 0 }), _jsx(AlertTitle, { mt: 4, mb: 2, fontSize: "2xl", children: "IDE Unavailable" }), _jsx(AlertDescription, { maxWidth: "lg", mb: 4, children: ideStatus.message }), _jsxs(HStack, { spacing: 4, mt: 4, children: [_jsx(Button, { colorScheme: "blue", onClick: handleRefresh, children: "Retry Connection" }), _jsx(Button, { variant: "outline", onClick: handleOpenInNewTab, children: "Open in New Tab" })] })] }) }));
    }
    return (_jsxs(Box, { w: "100%", h: "calc(100vh - 64px)", position: "relative", overflow: "hidden", children: [_jsx(Box, { bg: "gray.800", color: "white", px: 4, py: 2, borderBottom: "1px", borderColor: "gray.700", children: _jsxs(HStack, { justify: "space-between", children: [_jsxs(HStack, { spacing: 4, children: [_jsx(Text, { fontSize: "lg", fontWeight: "bold", children: "Theia IDE" }), _jsx(Text, { fontSize: "sm", color: "gray.400", children: "v2.0.0 | Theia 1.65.2" })] }), _jsx(HStack, { spacing: 2, children: _jsx(Button, { size: "sm", variant: "ghost", colorScheme: "whiteAlpha", onClick: handleOpenInNewTab, children: "Open in New Tab" }) })] }) }), _jsx(Box, { as: "iframe", src: ideUrl, w: "100%", h: "calc(100% - 48px)", border: "none", bg: "white", title: "Theia IDE" })] }));
};
export default TheiaIDE;

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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { DownloadSimple, Key } from "@phosphor-icons/react";
import { saveAs } from "file-saver";
import showToast from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
export function RecoveryCodeModal(_a) {
    var _this = this;
    var recoveryCodes = _a.recoveryCodes, onDownloadComplete = _a.onDownloadComplete, onClose = _a.onClose;
    var _b = useState(false), downloadClicked = _b[0], setDownloadClicked = _b[1];
    var downloadRecoveryCodes = function () {
        var blob = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
        saveAs(blob, "recovery_codes.txt");
        setDownloadClicked(true);
    };
    var handleClose = function () {
        if (downloadClicked) {
            onDownloadComplete();
            onClose();
        }
    };
    var handleCopyToClipboard = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, navigator.clipboard.writeText(recoveryCodes.join(",\n"))];
                case 1:
                    _b.sent();
                    showToast("Recovery codes copied to clipboard", "success");
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    showToast("Failed to copy recovery codes", "error");
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsx(Dialog, { open: true, onOpenChange: handleClose, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-x-2", children: [_jsx(Key, { size: 24, weight: "bold" }), "Recovery Codes"] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: ["In order to reset your password in the future, you will need these recovery codes. Download or copy your recovery codes to save them.", " ", _jsx("br", {}), _jsx("b", { className: "mt-4", children: "These recovery codes are only shown once!" })] }), _jsx("div", { className: "cursor-pointer rounded-md border bg-muted p-4 hover:bg-muted/80", onClick: handleCopyToClipboard, children: _jsx("ul", { className: "space-y-2", children: recoveryCodes.map(function (code, index) { return (_jsx("li", { className: "text-sm font-mono", children: code }, index)); }) }) })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: downloadClicked ? handleClose : downloadRecoveryCodes, children: downloadClicked ? ("Close") : (_jsxs(_Fragment, { children: [_jsx(DownloadSimple, { weight: "bold", size: 18, className: "mr-2" }), "Download"] })) }) })] }) }));
}

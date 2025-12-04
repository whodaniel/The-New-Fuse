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
import { useState } from "react";
var WebIntegrationPanel = function (_a) {
    var _b = _a.isMainApp, isMainApp = _b === void 0 ? true : _b;
    var _c = useState(""), chatInputSelector = _c[0], setChatInputSelector = _c[1];
    var _d = useState(""), chatOutputSelector = _d[0], setChatOutputSelector = _d[1];
    var _e = useState(""), sendButtonSelector = _e[0], setSendButtonSelector = _e[1];
    var _f = useState(""), textToSend = _f[0], setTextToSend = _f[1];
    var _g = useState(""), capturedOutput = _g[0], setCapturedOutput = _g[1];
    var _h = useState(""), status = _h[0], setStatus = _h[1];
    var _j = useState("info"), statusType = _j[0], setStatusType = _j[1];
    var _k = useState(false), autoCapture = _k[0], setAutoCapture = _k[1];
    var _l = useState(false), isMonitoring = _l[0], setIsMonitoring = _l[1];
    // Helper function to add status messages
    var addStatus = function (message, type) {
        if (type === void 0) { type = "info"; }
        setStatus(message);
        setStatusType(type);
    };
    // Send text to page
    var handleSendToPage = function () { return __awaiter(void 0, void 0, void 0, function () {
        var errorMsg;
        return __generator(this, function (_a) {
            if (!textToSend.trim()) {
                addStatus("Please enter text to send", "warning");
                return [2 /*return*/];
            }
            if (!chatInputSelector.trim()) {
                addStatus("Please specify input selector", "warning");
                return [2 /*return*/];
            }
            try {
                if (isMainApp) {
                    // For main app - this would integrate with your web automation system
                    addStatus("Text sent to page (main app integration)", "success");
                }
                else {
                    // For chrome extension - use content script
                    if (typeof chrome !== "undefined" && chrome.tabs) {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            var _a;
                            if ((_a = tabs[0]) === null || _a === void 0 ? void 0 : _a.id) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    type: "SEND_TO_PAGE",
                                    selector: chatInputSelector,
                                    text: textToSend,
                                }, function (response) {
                                    if (chrome.runtime.lastError) {
                                        addStatus("Error: ".concat(chrome.runtime.lastError.message), "error");
                                    }
                                    else if (response === null || response === void 0 ? void 0 : response.success) {
                                        addStatus("Text sent successfully", "success");
                                        setTextToSend("");
                                    }
                                    else {
                                        addStatus("Failed: ".concat((response === null || response === void 0 ? void 0 : response.error) || "Unknown error"), "error");
                                    }
                                });
                            }
                        });
                    }
                }
            }
            catch (error) {
                errorMsg = error instanceof Error ? error.message : "Unknown error";
                addStatus("Error sending text: ".concat(errorMsg), "error");
            }
            return [2 /*return*/];
        });
    }); };
    // Capture output from page
    var handleCaptureOutput = function () { return __awaiter(void 0, void 0, void 0, function () {
        var errorMsg;
        return __generator(this, function (_a) {
            if (!chatOutputSelector.trim()) {
                addStatus("Please specify output selector", "warning");
                return [2 /*return*/];
            }
            try {
                if (isMainApp) {
                    // For main app - integrate with web scraping system
                    setCapturedOutput("Sample captured output (main app integration)");
                    addStatus("Output captured successfully", "success");
                }
                else {
                    // For chrome extension - use content script
                    if (typeof chrome !== "undefined" && chrome.tabs) {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            var _a;
                            if ((_a = tabs[0]) === null || _a === void 0 ? void 0 : _a.id) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    type: "CAPTURE_OUTPUT",
                                    selector: chatOutputSelector,
                                }, function (response) {
                                    if (chrome.runtime.lastError) {
                                        addStatus("Error: ".concat(chrome.runtime.lastError.message), "error");
                                    }
                                    else if (response === null || response === void 0 ? void 0 : response.success) {
                                        setCapturedOutput(response.content || "No content found");
                                        addStatus("Output captured successfully", "success");
                                    }
                                    else {
                                        addStatus("Failed: ".concat((response === null || response === void 0 ? void 0 : response.error) || "Unknown error"), "error");
                                    }
                                });
                            }
                        });
                    }
                }
            }
            catch (error) {
                errorMsg = error instanceof Error ? error.message : "Unknown error";
                addStatus("Error capturing output: ".concat(errorMsg), "error");
            }
            return [2 /*return*/];
        });
    }); };
    // Click send button
    var handleClickSendButton = function () { return __awaiter(void 0, void 0, void 0, function () {
        var errorMsg;
        return __generator(this, function (_a) {
            if (!sendButtonSelector.trim()) {
                addStatus("Please specify send button selector", "warning");
                return [2 /*return*/];
            }
            try {
                if (isMainApp) {
                    addStatus("Send button clicked (main app integration)", "success");
                }
                else {
                    if (typeof chrome !== "undefined" && chrome.tabs) {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            var _a;
                            if ((_a = tabs[0]) === null || _a === void 0 ? void 0 : _a.id) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    type: "CLICK_BUTTON",
                                    selector: sendButtonSelector,
                                }, function (response) {
                                    if (chrome.runtime.lastError) {
                                        addStatus("Error: ".concat(chrome.runtime.lastError.message), "error");
                                    }
                                    else if (response === null || response === void 0 ? void 0 : response.success) {
                                        addStatus("Send button clicked successfully", "success");
                                    }
                                    else {
                                        addStatus("Failed: ".concat((response === null || response === void 0 ? void 0 : response.error) || "Unknown error"), "error");
                                    }
                                });
                            }
                        });
                    }
                }
            }
            catch (error) {
                errorMsg = error instanceof Error ? error.message : "Unknown error";
                addStatus("Error clicking button: ".concat(errorMsg), "error");
            }
            return [2 /*return*/];
        });
    }); };
    // Copy output to clipboard
    var copyToClipboard = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!capturedOutput) {
                        addStatus("No output to copy", "warning");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.clipboard.writeText(capturedOutput)];
                case 2:
                    _a.sent();
                    addStatus("Output copied to clipboard", "success");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    addStatus("Failed to copy to clipboard", "error");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Clear output
    var clearOutput = function () {
        setCapturedOutput("");
        addStatus("Output cleared", "info");
    };
    // Toggle monitoring
    var toggleMonitoring = function () {
        setIsMonitoring(!isMonitoring);
        addStatus(isMonitoring ? "Monitoring stopped" : "Monitoring started", "info");
    };
    return (_jsxs(Box, { sx: { p: 2, height: "100%", overflow: "auto" }, children: [status && (_jsx(Alert, { severity: statusType, sx: { mb: 2 }, onClose: function () { return setStatus(""); }, children: status })), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", gutterBottom: true, children: "Page Selectors" }), _jsxs(SimpleGrid, { container: true, columns: 2, children: [_jsx(SimpleGrid, { item: true, xs: 12, children: _jsx(Input, { fullWidth: true, label: "Chat Input Selector", placeholder: "e.g., #chat-input, .message-input", value: chatInputSelector, onChange: function (e) { return setChatInputSelector(e.target.value); }, size: "small", InputProps: {
                                            startAdornment: (_jsx(CodeIcon, { sx: { mr: 1, color: "text.secondary" } })),
                                        } }) }), _jsx(SimpleGrid, { item: true, xs: 12, children: _jsx(Input, { fullWidth: true, label: "Chat Output Selector", placeholder: "e.g., .messages, #chat-output", value: chatOutputSelector, onChange: function (e) { return setChatOutputSelector(e.target.value); }, size: "small", InputProps: {
                                            startAdornment: (_jsx(VisibilityIcon, { sx: { mr: 1, color: "text.secondary" } })),
                                        } }) }), _jsx(SimpleGrid, { item: true, xs: 12, children: _jsx(Input, { fullWidth: true, label: "Send Button Selector", placeholder: "e.g., #send-btn, .send-button", value: sendButtonSelector, onChange: function (e) { return setSendButtonSelector(e.target.value); }, size: "small", InputProps: {
                                            startAdornment: (_jsx(TouchAppIcon, { sx: { mr: 1, color: "text.secondary" } })),
                                        } }) })] })] }) }), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", gutterBottom: true, children: "Send to Page" }), _jsx(Input, { fullWidth: true, multiline: true, rows: 3, label: "Text to Send", placeholder: "Enter text to send to the page...", value: textToSend, onChange: function (e) { return setTextToSend(e.target.value); }, sx: { mb: 2 } }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [_jsx(Button, { variant: "contained", onClick: handleSendToPage, startIcon: _jsx(SendIcon, {}), disabled: !textToSend.trim() || !chatInputSelector.trim(), children: "Send to Page" }), _jsx(Button, { variant: "outlined", onClick: handleClickSendButton, startIcon: _jsx(TouchAppIcon, {}), disabled: !sendButtonSelector.trim(), children: "Click Send Button" })] })] }) }), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardBody, { children: [_jsxs(Box, { sx: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 2,
                            }, children: [_jsx(Text, { variant: "h6", children: "Captured Output" }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [_jsx(FormLabel, { control: _jsx(Switch, { checked: autoCapture, onChange: function (e) { return setAutoCapture(e.target.checked); }, size: "small" }), label: "Auto", sx: { mr: 1 } }), _jsx(Tooltip, { title: "Start/Stop Monitoring", children: _jsx(IconButton, { size: "small", onClick: toggleMonitoring, color: isMonitoring ? "secondary" : "default", children: isMonitoring ? _jsx(StopIcon, {}) : _jsx(PlayArrowIcon, {}) }) }), _jsx(Tooltip, { title: "Capture Now", children: _jsx(IconButton, { size: "small", onClick: handleCaptureOutput, children: _jsx(VisibilityIcon, {}) }) }), _jsx(Tooltip, { title: "Copy to Clipboard", children: _jsx(IconButton, { size: "small", onClick: copyToClipboard, disabled: !capturedOutput, children: _jsx(ContentCopyIcon, {}) }) }), _jsx(Tooltip, { title: "Clear Output", children: _jsx(IconButton, { size: "small", onClick: clearOutput, disabled: !capturedOutput, children: _jsx(ClearIcon, {}) }) })] })] }), _jsx(Box, { variant: "outlined", sx: {
                                p: 2,
                                bgcolor: "background.default",
                                minHeight: 120,
                                maxHeight: 200,
                                overflow: "auto",
                                fontFamily: "monospace",
                                fontSize: "0.875rem",
                            }, children: capturedOutput ? (_jsx(Text, { variant: "body2", sx: {
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                }, children: capturedOutput })) : (_jsx(Text, { variant: "body2", color: "text.secondary", sx: { fontStyle: "italic" }, children: "No output captured yet. Click \"Capture Now\" or enable auto-capture." })) })] }) }), _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", gutterBottom: true, children: "Monitoring Status" }), _jsxs(Box, { sx: { display: "flex", gap: 1, flexWrap: "wrap" }, children: [_jsx(Tag, { label: isMonitoring ? "Monitoring Active" : "Monitoring Inactive", color: isMonitoring ? "success" : "default", variant: "outlined" }), _jsx(Tag, { label: autoCapture ? "Auto-Capture ON" : "Auto-Capture OFF", color: autoCapture ? "primary" : "default", variant: "outlined" }), _jsx(Tag, { label: "Page: ".concat(isMainApp ? "Main App" : "Extension"), color: "info", variant: "outlined" })] })] }) })] }));
};
export default WebIntegrationPanel;

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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
var CommunicationPanel = function (_a) {
    var _b = _a.isMainApp, isMainApp = _b === void 0 ? true : _b;
    var _c = useState("ws://localhost:3712"), websocketUrl = _c[0], setWebsocketUrl = _c[1];
    var _d = useState("disconnected"), connectionStatus = _d[0], setConnectionStatus = _d[1];
    var _e = useState(undefined), statusMessage = _e[0], setStatusMessage = _e[1];
    var _f = useState([]), connectionLog = _f[0], setConnectionLog = _f[1];
    var _g = useState(true), autoReconnect = _g[0], setAutoReconnect = _g[1];
    var _h = useState(false), isConnecting = _h[0], setIsConnecting = _h[1];
    // Add log entry helper
    var addLogEntry = function (message) {
        var timestamp = new Date().toLocaleTimeString();
        var logEntry = "[".concat(timestamp, "] ").concat(message);
        setConnectionLog(function (prevLog) { return __spreadArray(__spreadArray([], prevLog.slice(-9), true), [logEntry], false); }); // Keep last 10 entries
    };
    // Handle connection
    var handleConnect = function () { return __awaiter(void 0, void 0, void 0, function () {
        var ws, errorMsg;
        return __generator(this, function (_a) {
            if (isConnecting)
                return [2 /*return*/];
            setIsConnecting(true);
            setConnectionStatus("connecting");
            setStatusMessage("Connecting...");
            addLogEntry("Attempting to connect to ".concat(websocketUrl, "..."));
            try {
                if (isMainApp) {
                    ws = new WebSocket(websocketUrl);
                    ws.onopen = function () {
                        setConnectionStatus("connected");
                        setStatusMessage("Connected");
                        addLogEntry("Connection established");
                        setIsConnecting(false);
                    };
                    ws.onerror = function (error) {
                        setConnectionStatus("error");
                        setStatusMessage("Connection failed");
                        addLogEntry("Connection error: ".concat(error));
                        setIsConnecting(false);
                    };
                    ws.onclose = function () {
                        setConnectionStatus("disconnected");
                        setStatusMessage("Disconnected");
                        addLogEntry("Connection closed");
                        setIsConnecting(false);
                    };
                    // Store WebSocket reference for later cleanup
                    // You might want to use a ref or context for this
                }
                else {
                    // For chrome extension - use chrome.runtime messaging
                    if (typeof chrome !== "undefined" && chrome.runtime) {
                        chrome.runtime.sendMessage({ type: "WEBSOCKET_CONNECT" }, function (response) {
                            if (chrome.runtime.lastError) {
                                var errorMessage = "Connection error: ".concat(chrome.runtime.lastError.message);
                                addLogEntry(errorMessage);
                                setConnectionStatus("error");
                                setStatusMessage(errorMessage);
                                setIsConnecting(false);
                                return;
                            }
                            if (response && response.success) {
                                addLogEntry("Connection established");
                                setConnectionStatus("connected");
                                setStatusMessage("Connected");
                            }
                            else {
                                var errorMsg = (response === null || response === void 0 ? void 0 : response.error) || "Unknown error";
                                addLogEntry("Connection failed: ".concat(errorMsg));
                                setConnectionStatus("error");
                                setStatusMessage("Failed: ".concat(errorMsg));
                            }
                            setIsConnecting(false);
                        });
                    }
                }
            }
            catch (error) {
                errorMsg = error instanceof Error ? error.message : "Unknown error";
                addLogEntry("Connection failed: ".concat(errorMsg));
                setConnectionStatus("error");
                setStatusMessage("Failed: ".concat(errorMsg));
                setIsConnecting(false);
            }
            return [2 /*return*/];
        });
    }); };
    // Handle disconnect
    var handleDisconnect = function () {
        addLogEntry("Disconnecting from ".concat(websocketUrl, "..."));
        if (isMainApp) {
            // Close WebSocket connection
            setConnectionStatus("disconnected");
            setStatusMessage("Disconnected");
            addLogEntry("Disconnected successfully");
        }
        else {
            // For chrome extension
            if (typeof chrome !== "undefined" && chrome.runtime) {
                chrome.runtime.sendMessage({ type: "WEBSOCKET_DISCONNECT" }, function (response) {
                    setConnectionStatus("disconnected");
                    setStatusMessage("Disconnected");
                    addLogEntry("Disconnected successfully");
                });
            }
        }
    };
    // Get status indicator
    var getStatusIndicator = function () {
        switch (connectionStatus) {
            case "connected":
                return {
                    icon: _jsx(CheckCircleIcon, { color: "success" }),
                    text: "Connected",
                    color: "success.main",
                    chipColor: "success",
                };
            case "disconnected":
                return {
                    icon: _jsx(WifiOffIcon, { color: "disabled" }),
                    text: "Disconnected",
                    color: "text.secondary",
                    chipColor: "default",
                };
            case "connecting":
                return {
                    icon: _jsx(CircularProgress, { size: 20 }),
                    text: "Connecting...",
                    color: "warning.main",
                    chipColor: "warning",
                };
            case "error":
                return {
                    icon: _jsx(ErrorIcon, { color: "error" }),
                    text: "Error",
                    color: "error.main",
                    chipColor: "error",
                };
            default:
                return {
                    icon: _jsx(WifiOffIcon, {}),
                    text: "Unknown",
                    color: "text.secondary",
                    chipColor: "default",
                };
        }
    };
    var statusInfo = getStatusIndicator();
    // Clear logs
    var clearLogs = function () {
        setConnectionLog([]);
        addLogEntry("Logs cleared");
    };
    return (_jsxs(Box, { sx: { p: 2, height: "100%", display: "flex", flexDirection: "column" }, children: [_jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardBody, { children: [_jsxs(Box, { sx: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 2,
                            }, children: [_jsx(Text, { variant: "h6", children: "Connection Status" }), _jsx(Tag, { icon: statusInfo.icon, label: statusInfo.text, color: statusInfo.chipColor, variant: "outlined" })] }), statusMessage && (_jsx(Alert, { severity: connectionStatus === "connected"
                                ? "success"
                                : connectionStatus === "error"
                                    ? "error"
                                    : "info", sx: { mb: 2 }, children: statusMessage })), _jsx(Input, { fullWidth: true, label: "WebSocket URL", value: websocketUrl, onChange: function (e) { return setWebsocketUrl(e.target.value); }, disabled: connectionStatus === "connected" || isConnecting, size: "small", sx: { mb: 2 } }), _jsxs(Box, { sx: { display: "flex", gap: 1, mb: 2 }, children: [_jsx(Button, { variant: "contained", onClick: handleConnect, disabled: connectionStatus === "connected" || isConnecting, startIcon: isConnecting ? _jsx(CircularProgress, { size: 16 }) : _jsx(WifiIcon, {}), sx: { flex: 1 }, children: isConnecting ? "Connecting..." : "Connect" }), _jsx(Button, { variant: "outlined", onClick: handleDisconnect, disabled: connectionStatus !== "connected", startIcon: _jsx(WifiOffIcon, {}), sx: { flex: 1 }, children: "Disconnect" })] }), _jsx(FormLabel, { control: _jsx(Switch, { checked: autoReconnect, onChange: function (e) { return setAutoReconnect(e.target.checked); } }), label: "Auto-reconnect" })] }) }), _jsx(Card, { sx: { flexGrow: 1, display: "flex", flexDirection: "column" }, children: _jsxs(CardBody, { sx: { flexGrow: 1, display: "flex", flexDirection: "column" }, children: [_jsxs(Box, { sx: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 2,
                            }, children: [_jsx(Text, { variant: "h6", children: "Connection Log" }), _jsxs(Box, { children: [_jsx(Tooltip, { title: "Refresh", children: _jsx(IconButton, { size: "small", onClick: function () { return addLogEntry("Log refreshed"); }, children: _jsx(RefreshIcon, {}) }) }), _jsx(Tooltip, { title: "Clear logs", children: _jsx(IconButton, { size: "small", onClick: clearLogs, children: _jsx(ClearIcon, {}) }) })] })] }), _jsx(Box, { variant: "outlined", sx: {
                                flexGrow: 1,
                                p: 1,
                                bgcolor: "background.default",
                                overflow: "auto",
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                            }, children: connectionLog.length === 0 ? (_jsx(Text, { variant: "body2", color: "text.secondary", sx: { fontStyle: "italic" }, children: "No log entries yet..." })) : (connectionLog.map(function (entry, index) { return (_jsx(Text, { variant: "body2", sx: {
                                    fontFamily: "monospace",
                                    fontSize: "0.75rem",
                                    lineHeight: 1.4,
                                    mb: 0.5,
                                    "&:last-child": { mb: 0 },
                                }, children: entry }, index)); })) })] }) })] }));
};
export default CommunicationPanel;

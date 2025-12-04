"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import ui_1 from '../../shared/components/ui';
var VideoChat = function () {
    var videoRef = (0, react_1.useRef)(null);
    var _a = react_1.default.useState(null), stream = _a[0], setStream = _a[1];
    var _b = react_1.default.useState(false), isCameraOn = _b[0], setIsCameraOn = _b[1];
    var _c = react_1.default.useState(false), isAudioOn = _c[0], setIsAudioOn = _c[1];
    var _d = react_1.default.useState(''), error = _d[0], setError = _d[1];
    (0, react_1.useEffect)(function () {
        var updateMediaStream = function () { return __awaiter(void 0, void 0, void 0, function () {
            var mediaStream, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!(isCameraOn || isAudioOn)) return [3 /*break*/, 2];
                        return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                                video: isCameraOn,
                                audio: isAudioOn,
                            })];
                    case 1:
                        mediaStream = _a.sent();
                        setStream(mediaStream);
                        if (videoRef.current) {
                            videoRef.current.srcObject = mediaStream;
                        }
                        setError('');
                        return [3 /*break*/, 3];
                    case 2:
                        if (stream) {
                            stream.getTracks().forEach(function (track) { return track.stop(); });
                            setStream(null);
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        console.error('Error accessing media devices:', err_1);
                        setError('Failed to access camera or microphone. Please check your permissions.');
                        setIsCameraOn(false);
                        setIsAudioOn(false);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        updateMediaStream();
    }, [isCameraOn, isAudioOn]);
    return (_jsxs(ui_1.Card, { variant: "default", className: "w-full max-w-2xl mx-auto", children: [_jsx(ui_1.CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Video Chat" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(ui_1.Button, { variant: isAudioOn ? 'destructive' : 'default', size: "small", onClick: function () { return setIsAudioOn(!isAudioOn); }, className: "!p-2", children: isAudioOn ? (_jsx(icons_material_1.MicOff, { className: "w-5 h-5" })) : (_jsx(icons_material_1.Mic, { className: "w-5 h-5" })) }), _jsx(ui_1.Button, { variant: isCameraOn ? 'destructive' : 'default', size: "small", onClick: function () { return setIsCameraOn(!isCameraOn); }, className: "!p-2", children: isCameraOn ? (_jsx(icons_material_1.VideocamOff, { className: "w-5 h-5" })) : (_jsx(icons_material_1.Videocam, { className: "w-5 h-5" })) })] })] }) }), _jsx(ui_1.CardContent, { children: error ? (_jsx("div", { className: "p-4 bg-red-50 text-red-600 rounded-lg", children: error })) : (_jsx("div", { className: "relative aspect-video rounded-lg overflow-hidden bg-gray-100", children: (isCameraOn || isAudioOn) ? (_jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: !isAudioOn, className: "absolute inset-0 w-full h-full object-cover" })) : (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("p", { className: "text-gray-500", children: "Turn on camera or microphone to start" }) })) })) })] }));
};
exports.default = VideoChat;

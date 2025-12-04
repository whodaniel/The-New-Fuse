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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Tooltip } from "react-tooltip";
import { SpeakerHigh, SpeakerX } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
export default function TTSMessage(_a) {
    var _this = this;
    var slug = _a.slug, chatId = _a.chatId, message = _a.message;
    var _b = useState(false), isPlaying = _b[0], setIsPlaying = _b[1];
    var _c = useState(null), audio = _c[0], setAudio = _c[1];
    var handleTTS = function () { return __awaiter(_this, void 0, void 0, function () {
        var audioData, blob, url_1, newAudio, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isPlaying) {
                        audio === null || audio === void 0 ? void 0 : audio.pause();
                        setIsPlaying(false);
                        setAudio(null);
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Workspace.getMessageTTS(slug, chatId)];
                case 2:
                    audioData = _a.sent();
                    blob = new Blob([audioData], { type: "audio/mp3" });
                    url_1 = URL.createObjectURL(blob);
                    newAudio = new Audio(url_1);
                    newAudio.addEventListener("ended", function () {
                        setIsPlaying(false);
                        setAudio(null);
                        URL.revokeObjectURL(url_1);
                    });
                    newAudio.play();
                    setAudio(newAudio);
                    setIsPlaying(true);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to play TTS:", error_1);
                    setIsPlaying(false);
                    setAudio(null);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: handleTTS, "data-tooltip-id": "tooltip-tts", "data-tooltip-content": isPlaying ? "Stop text-to-speech" : "Play text-to-speech", className: "text-white/40 hover:text-white/80", children: isPlaying ? (_jsx(SpeakerX, { className: "w-4 h-4" })) : (_jsx(SpeakerHigh, { className: "w-4 h-4" })) }), _jsx(Tooltip, { id: "tooltip-tts", place: "top", delayShow: 300, className: "tooltip !text-xs z-99" })] }));
}

import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
var SpeechToText = function (_a) {
    var onTranscript = _a.onTranscript, _b = _a.disabled, disabled = _b === void 0 ? false : _b, className = _a.className;
    var _c = useState(false), isListening = _c[0], setIsListening = _c[1];
    var hasSupport = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;
    var startListening = function () {
        if (!hasSupport || disabled)
            return;
        var recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onstart = function () {
            setIsListening(true);
        };
        recognition.onresult = function (event) {
            var transcript = event.results[0][0].transcript;
            if (onTranscript) {
                onTranscript(transcript);
            }
            setIsListening(false);
        };
        recognition.onerror = function () {
            setIsListening(false);
        };
        recognition.onend = function () {
            setIsListening(false);
        };
        recognition.start();
    };
    var stopListening = function () {
        setIsListening(false);
    };
    if (!hasSupport) {
        return null;
    }
    return (_jsx("button", { type: "button", onClick: isListening ? stopListening : startListening, disabled: disabled, className: cn("p-2 rounded-md transition-colors", isListening
            ? "bg-red-100 text-red-600 hover:bg-red-200"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200", disabled && "opacity-50 cursor-not-allowed", className), title: isListening ? "Stop listening" : "Start voice input", children: isListening ? _jsx(MicOff, { className: "w-4 h-4" }) : _jsx(Mic, { className: "w-4 h-4" }) }));
};
export default SpeechToText;

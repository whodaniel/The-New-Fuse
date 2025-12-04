"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceControl = VoiceControl;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import lucide_react_1 from 'lucide-react';
import websocket_1 from '../services/websocket';
function VoiceControl() {
    var _a = (0, react_1.useState)(false), isListening = _a[0], setIsListening = _a[1];
    var _b = (0, react_1.useState)(''), transcript = _b[0], setTranscript = _b[1];
    (0, react_1.useEffect)(function () {
        var recognition = null;
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            var SpeechRecognition_1 = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition_1();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = function (event) {
                var current = event.resultIndex;
                var transcript = event.results[current][0].transcript;
                setTranscript(transcript);
                if (event.results[current].isFinal) {
                    websocket_1.webSocketService.send('voiceCommand', { command: transcript });
                }
            };
            recognition.onerror = function (event) {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
        }
        return function () {
            if (recognition) {
                recognition.stop();
            }
        };
    }, []);
    var toggleListening = function () {
        if (isListening) {
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                var SpeechRecognition_2 = window.SpeechRecognition || window.webkitSpeechRecognition;
                var recognition = new SpeechRecognition_2();
                recognition.stop();
            }
        }
        else {
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                var SpeechRecognition_3 = window.SpeechRecognition || window.webkitSpeechRecognition;
                var recognition = new SpeechRecognition_3();
                recognition.start();
            }
        }
        setIsListening(!isListening);
    };
    return (_jsxs(card_1.Card, { className: "w-full max-w-md", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Voice Control" }) }), _jsxs(card_1.CardContent, { className: "space-y-4", children: [_jsxs(button_1.Button, { onClick: toggleListening, className: "w-full", children: [isListening ? _jsx(lucide_react_1.MicOff, { className: "mr-2 h-4 w-4" }) : _jsx(lucide_react_1.Mic, { className: "mr-2 h-4 w-4" }), isListening ? 'Stop Listening' : 'Start Listening'] }), _jsxs("div", { className: "p-4 bg-gray-100 rounded-md", children: [_jsx("p", { className: "font-semibold", children: "Transcript:" }), _jsx("p", { children: transcript })] })] })] }));
}

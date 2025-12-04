"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiModalInteraction = MultiModalInteraction;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import textarea_1 from '@/components/ui/textarea';
import card_1 from '@/components/ui/card';
import lucide_react_1 from 'lucide-react';
import websocket_1 from '../services/websocket';
function MultiModalInteraction() {
    var _a = (0, react_1.useState)(''), input = _a[0], setInput = _a[1];
    var _b = (0, react_1.useState)(false), isRecording = _b[0], setIsRecording = _b[1];
    var _c = (0, react_1.useState)(false), isCameraOn = _c[0], setIsCameraOn = _c[1];
    var videoRef = (0, react_1.useRef)(null);
    var handleSend = function () {
        websocket_1.webSocketService.send('multiModalInput', { type: 'text', content: input });
        setInput('');
    };
    var handleVoice = function () {
        if (!isRecording) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function (stream) {
                var mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                setIsRecording(true);
                var audioChunks = [];
                mediaRecorder.addEventListener("dataavailable", function (event) {
                    audioChunks.push(event.data);
                });
                mediaRecorder.addEventListener("stop", function () {
                    var audioBlob = new Blob(audioChunks);
                    var audioUrl = URL.createObjectURL(audioBlob);
                    websocket_1.webSocketService.send('multiModalInput', { type: 'audio', content: audioUrl });
                });
                setTimeout(function () {
                    mediaRecorder.stop();
                    setIsRecording(false);
                }, 5000);
            });
        }
    };
    var handleCamera = function () {
        if (!isCameraOn) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsCameraOn(true);
            });
        }
        else {
            var stream = videoRef.current.srcObject;
            var tracks = stream.getTracks();
            tracks.forEach(function (track) { return track.stop(); });
            setIsCameraOn(false);
        }
    };
    var handleImageUpload = function (event) {
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.onloadend = function () {
            websocket_1.webSocketService.send('multiModalInput', { type: 'image', content: reader.result });
        };
        reader.readAsDataURL(file);
    };
    return (_jsxs(card_1.Card, { className: "w-full max-w-md", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Multi-Modal Interaction" }) }), _jsxs(card_1.CardContent, { className: "space-y-4", children: [_jsx(textarea_1.Textarea, { value: input, onChange: function (e) { return setInput(e.target.value); }, placeholder: "Type your message...", className: "w-full" }), _jsxs("div", { className: "flex justify-between", children: [_jsxs(button_1.Button, { onClick: handleVoice, children: [_jsx(lucide_react_1.Mic, { className: "mr-2 h-4 w-4 ".concat(isRecording ? 'text-red-500' : '') }), isRecording ? 'Recording...' : 'Voice'] }), _jsxs(button_1.Button, { onClick: handleCamera, children: [_jsx(lucide_react_1.Camera, { className: "mr-2 h-4 w-4 ".concat(isCameraOn ? 'text-green-500' : '') }), isCameraOn ? 'Camera On' : 'Camera'] }), _jsxs(button_1.Button, { onClick: function () { return document.getElementById('imageUpload').click(); }, children: [_jsx(lucide_react_1.Upload, { className: "mr-2 h-4 w-4" }), "Upload Image"] }), _jsx("input", { id: "imageUpload", type: "file", accept: "image/*", onChange: handleImageUpload, style: { display: 'none' } })] }), _jsx(button_1.Button, { onClick: handleSend, className: "w-full", children: "Send" }), isCameraOn && (_jsx("video", { ref: videoRef, className: "w-full h-48 object-cover" }))] })] }));
}

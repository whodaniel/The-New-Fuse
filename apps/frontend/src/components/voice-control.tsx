"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceControl = VoiceControl;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import lucide_react_1 from 'lucide-react';
import websocket_1 from '../services/websocket.js';
function VoiceControl() {
    const [isListening, setIsListening] = (0, react_1.useState)(false);
    const [transcript, setTranscript] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        let recognition = null;
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                setTranscript(transcript);
                if (event.results[current].isFinal) {
                    websocket_1.webSocketService.send('voiceCommand', { command: transcript });
                }
            };
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
        }
        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, []);
    const toggleListening = () => {
        if (isListening) {
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.stop();
            }
        }
        else {
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.start();
            }
        }
        setIsListening(!isListening);
    };
    return (<card_1.Card className="w-full max-w-md">
      <card_1.CardHeader>
        <card_1.CardTitle>Voice Control</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-4">
        <button_1.Button onClick={toggleListening} className="w-full">
          {isListening ? <lucide_react_1.MicOff className="mr-2 h-4 w-4"/> : <lucide_react_1.Mic className="mr-2 h-4 w-4"/>}
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button_1.Button>
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="font-semibold">Transcript:</p>
          <p>{transcript}</p>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=voice-control.js.map
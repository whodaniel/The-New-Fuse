"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceControlledCommander = VoiceControlledCommander;
import react_1 from 'react';
import button_1 from '@/components/ui/button';
import card_1 from '@/components/ui/card';
import lucide_react_1 from 'lucide-react';
import websocket_1 from '../services/websocket.js';
function VoiceControlledCommander() {
    const [isListening, setIsListening] = (0, react_1.useState)(false);
    const [transcript, setTranscript] = (0, react_1.useState)('');
    const [response, setResponse] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        let recognition = null;
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
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
        websocket_1.webSocketService.on('commandResponse', (data) => {
            setResponse(data.response);
            const speech = new SpeechSynthesisUtterance(data.response);
            window.speechSynthesis.speak(speech);
        });
        return () => {
            if (recognition)
                recognition.stop();
            websocket_1.webSocketService.off('commandResponse', () => { });
        };
    }, []);
    const toggleListening = () => {
        if (isListening) {
            recognition.stop();
        }
        else {
            recognition.start();
        }
        setIsListening(!isListening);
    };
    return (<card_1.Card className="w-full max-w-md">
      <card_1.CardHeader>
        <card_1.CardTitle>Voice-Controlled Agent Commander</card_1.CardTitle>
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
        <div className="p-4 bg-blue-100 rounded-md">
          <p className="font-semibold">Response:</p>
          <p>{response}</p>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=voice-controlled-commander.js.map
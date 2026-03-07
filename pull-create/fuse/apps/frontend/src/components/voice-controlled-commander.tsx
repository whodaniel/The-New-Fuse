// @ts-nocheck
'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { Mic, MicOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';

export function VoiceControlledCommander() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    let recognition: any = null;
    if ('webkitSpeechRecognition' in window) {
      recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
        if (event.results[current].isFinal) {
          webSocketService.send('voiceCommand', { command: result });
        }
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
    webSocketService.on('commandResponse', (data: any) => {
      setResponse(data.response);
      const speech = new SpeechSynthesisUtterance(data.response);
      window.speechSynthesis.speak(speech);
    });
    return () => {
      if (recognition) recognition.stop();
      webSocketService.off('commandResponse', () => {});
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
    } else {
      // Start listening
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.start();
        setIsListening(true);
      }
    }
  };

  return (
    <Card title="Voice Controlled Commander" gradient="purple" className="w-full max-w-md">
      <div className="flex flex-col items-center space-y-4">
        <Button
          onClick={toggleListening}
          variant={isListening ? 'destructive' : 'primary'}
          size="lg"
          className="rounded-full"
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>
        <p className="text-sm text-gray-400">
          {isListening ? 'Listening for commands...' : 'Click to start voice command'}
        </p>
        {transcript && (
          <div className="w-full p-4 rounded-lg bg-black/40 border border-white/10">
            <p className="text-sm text-gray-400">You said:</p>
            <p className="text-white">{transcript}</p>
          </div>
        )}
        {response && (
          <div className="w-full p-4 rounded-lg bg-black/40 border border-white/10">
            <p className="text-sm text-gray-400">Response:</p>
            <p className="text-white">{response}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

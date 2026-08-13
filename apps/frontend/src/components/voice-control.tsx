// @ts-nocheck
'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { Mic, MicOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';

export function VoiceControl() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    let recognition: SpeechRecognition | null = null;

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
        if (event.results[current].isFinal) {
          webSocketService.send('voiceCommand', { command: result });
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
    } else {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.start();
      }
    }
    setIsListening(!isListening);
  };

  return (
    <Card title="Voice Control" gradient="cyan" className="w-full max-w-md">
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
          {isListening ? 'Listening...' : 'Click to start voice command'}
        </p>
        {transcript && (
          <div className="w-full p-4 rounded-md bg-black/40 border border-white/10">
            <p className="text-white">{transcript}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

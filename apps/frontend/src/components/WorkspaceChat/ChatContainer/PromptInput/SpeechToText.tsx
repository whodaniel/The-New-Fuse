import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeechToTextProps {
  onTranscript?: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ 
  onTranscript,
  disabled = false,
  className 
}) => {
  const [isListening, setIsListening] = useState(false);
  const hasSupport = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  const startListening = () => {
    if (!hasSupport || disabled) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (onTranscript) {
        onTranscript(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  if (!hasSupport) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={cn(
        "p-2 rounded-md transition-colors",
        isListening 
          ? "bg-red-100 text-red-600 hover:bg-red-200" 
          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={isListening ? "Stop listening" : "Start voice input"}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
};

export default SpeechToText;
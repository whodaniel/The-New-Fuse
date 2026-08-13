import { cn } from '@/lib/utils';
import { Mic, MicOff } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface SpeechToTextProps {
  onTranscript?: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onTranscript,
  disabled = false,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const hasSupport =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const buildRecognition = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;
    return new SpeechRecognitionCtor();
  };

  const startListening = () => {
    if (!hasSupport || disabled) return;

    const recognition = buildRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
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
    try {
      recognitionRef.current?.stop?.();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
    recognitionRef.current = null;
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // noop
      }
      recognitionRef.current = null;
    };
  }, []);

  if (!hasSupport) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={cn(
        'p-2 rounded-md transition-colors',
        isListening
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        disabled && 'opacity-50 cursor-not-allowed',
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

import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionState {
  transcript: string;
  isRecording: boolean;
  isSupported: boolean;
  error: Error | null;
}

interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const [state, setState] = useState<SpeechRecognitionState>({
    transcript: "",
    isRecording: false,
    isSupported: "webkitSpeechRecognition" in window,
    error: null,
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: new Error("Speech recognition is not supported in this browser"),
      }));
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.continuous = options.continuous ?? true;
    recognitionRef.current.interimResults = options.interimResults ?? true;
    recognitionRef.current.lang = options.language ?? "en-US";

    recognitionRef.current.onstart = () => {
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
    };

    recognitionRef.current.onend = () => {
      setState((prev) => ({ ...prev, isRecording: false }));
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(" ");
      setState((prev) => ({ ...prev, transcript }));
    };

    recognitionRef.current.onerror = (event: any) => {
      setState((prev) => ({
        ...prev,
        error: new Error(`Speech recognition error: ${event.error}`),
        isRecording: false,
      }));
    };
  }, [
    options.continuous,
    options.interimResults,
    options.language,
    state.isSupported,
  ]);

  const startRecording = useCallback(() => {
    try {
      recognitionRef.current?.start();
    } catch (error) {
      const typedError =
        error instanceof Error ? error : new Error("Unknown error occurred");
      setState((prev) => ({ ...prev, error: typedError }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      const typedError =
        error instanceof Error ? error : new Error("Unknown error occurred");
      setState((prev) => ({ ...prev, error: typedError }));
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: "" }));
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    transcript: state.transcript,
    isRecording: state.isRecording,
    isSupported: state.isSupported,
    error: state.error,
    startRecording,
    stopRecording,
    resetTranscript,
  };
}

export interface SpeechRecognitionState {
  isRecording: boolean;
  isSupported: boolean;
  transcript: string;
  error: Error | null;
}
export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
export declare const useSpeechRecognition: (
  options?: SpeechRecognitionOptions,
) => any;

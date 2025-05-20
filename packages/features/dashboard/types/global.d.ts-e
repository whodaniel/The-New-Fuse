interface Window {
  SpeechRecognition: unknown;
  webkitSpeechRecognition: unknown;
  speechSynthesis: unknown;
  SpeechSynthesisUtterance: unknown;
}

interface Navigator {
  xr?: {
    isSessionSupported(mode: string): Promise<boolean>;
    requestSession(
      mode: string,
      options?: {
        requiredFeatures?: string[];
        optionalFeatures?: string[];
      }
    ): Promise<any>;
  };
}
export {};

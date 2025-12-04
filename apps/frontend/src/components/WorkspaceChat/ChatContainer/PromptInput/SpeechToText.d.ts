import React from 'react';
interface SpeechToTextProps {
    onTranscript?: (transcript: string) => void;
    disabled?: boolean;
    className?: string;
}
declare const SpeechToText: React.FC<SpeechToTextProps>;
export default SpeechToText;

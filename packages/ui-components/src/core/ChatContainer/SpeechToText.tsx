import React, { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Microphone } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

interface SpeechToTextProps {
  sendCommand: (command: string, submit?: boolean) => void;
}

export default function SpeechToText({ sendCommand }: SpeechToTextProps): JSX.Element | null {
  const [isListening, setIsListening] = useState<boolean>(false);
  const { transcript, browserSupportsSpeechRecognition, resetTranscript } =
    useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  const handleListen = () => {
    if (!isListening) {
      SpeechRecognition.startListening({ continuous: true });
      setIsListening(true);
    } else {
      SpeechRecognition.stopListening();
      if (transcript.length > 0) {
        sendCommand(transcript, true);
      }
      resetTranscript();
      setIsListening(false);
    }
  };

  return (
    <>
      <button
        onClick={handleListen}
        data-tooltip-id="tooltip-speech-to-text"
        data-tooltip-content={
          isListening
            ? "Click to stop recording and send message"
            : "Click to start voice recording"
        }
        className="flex justify-center items-center relative"
      >
        <Microphone
          color="var(--theme-sidebar-footer-icon-fill)"
          className={`w-[20px] h-[20px] pointer-events-none ${
            isListening
              ? "text-red-400 animate-pulse"
              : "opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60"
          }`}
          weight={isListening ? "fill" : "bold"}
        />
        {transcript && (
          <div className="absolute -top-2 -right-2 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
      <Tooltip
        id="tooltip-speech-to-text"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </>
  );
}
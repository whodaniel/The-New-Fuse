import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import { SpeakerHigh, SpeakerX } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";

interface TTSMessageProps {
  slug: string;
  chatId: string;
  message: string;
}

export default function TTSMessage({ slug, chatId, message }: TTSMessageProps): JSX.Element {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleTTS = async () => {
    if (isPlaying) {
      audio?.pause();
      setIsPlaying(false);
      setAudio(null);
      return;
    }

    try {
      const audioData = await Workspace.getMessageTTS(slug, chatId);
      const blob = new Blob([audioData], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const newAudio = new Audio(url);

      newAudio.addEventListener("ended", () => {
        setIsPlaying(false);
        setAudio(null);
        URL.revokeObjectURL(url);
      });

      newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play TTS:", error);
      setIsPlaying(false);
      setAudio(null);
    }
  };

  return (
    <>
      <button
        onClick={handleTTS}
        data-tooltip-id="tooltip-tts"
        data-tooltip-content={
          isPlaying ? "Stop text-to-speech" : "Play text-to-speech"
        }
        className="text-white/40 hover:text-white/80"
      >
        {isPlaying ? (
          <SpeakerX className="w-4 h-4" />
        ) : (
          <SpeakerHigh className="w-4 h-4" />
        )}
      </button>
      <Tooltip
        id="tooltip-tts"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </>
  );
}
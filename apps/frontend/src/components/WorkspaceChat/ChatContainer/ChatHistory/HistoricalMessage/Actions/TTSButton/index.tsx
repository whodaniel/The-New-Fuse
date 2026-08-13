// @ts-nocheck
import Workspace from '@/models/workspace';
import { SpeakerHigh, SpeakerX } from '@phosphor-icons/react';
import { useState } from 'react';
import { Tooltip } from 'react-tooltip';

interface TTSMessageProps {
  slug: string;
  chatId: string;
  message: string;
}

export default function TTSMessage({ slug, chatId, message }: TTSMessageProps): JSX.Element {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const stopPlayback = () => {
    if (audio) {
      audio.pause();
      audio.src = '';
      setAudio(null);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopPlayback();
    };
    // stopPlayback intentionally closes over latest state values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, audioUrl]);

  const handleTTS = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    try {
      const audioData = await Workspace.getMessageTTS(slug, chatId);
      const blob = new Blob([audioData], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const newAudio = new Audio(url);
      setAudioUrl(url);

      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudio(null);
        URL.revokeObjectURL(url);
      });

      newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play TTS:', error);
      setIsPlaying(false);
      setAudio(null);
    }
  };

  return (
    <>
      <button
        onClick={handleTTS}
        data-tooltip-id="tooltip-tts"
        data-tooltip-content={isPlaying ? 'Stop text-to-speech' : 'Play text-to-speech'}
        className="text-white/40 hover:text-white/80"
        aria-label={isPlaying ? 'Stop text-to-speech' : 'Play text-to-speech'}
      >
        {isPlaying ? <SpeakerX className="w-4 h-4" /> : <SpeakerHigh className="w-4 h-4" />}
      </button>
      <Tooltip id="tooltip-tts" place="top" delayShow={300} className="tooltip !text-xs z-99" />
    </>
  );
}

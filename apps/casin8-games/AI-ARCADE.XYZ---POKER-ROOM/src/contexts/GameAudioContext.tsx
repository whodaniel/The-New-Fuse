import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface GameAudioContextType {
  playClick: () => void;
  playHover: () => void;
  playDeal: () => void;
  playChip: () => void;
  playWin: () => void;
  playLose: () => void;
  playNotification: () => void;
  bgmEnabled: boolean;
  toggleBgm: () => void;
  sfxEnabled: boolean;
  toggleSfx: () => void;
}

const GameAudioContext = createContext<GameAudioContextType | undefined>(undefined);

export const useGameAudio = () => {
  const context = useContext(GameAudioContext);
  if (!context) throw new Error('useGameAudio must be used within GameAudioProvider');
  return context;
};

export const GameAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const bgmNodesRef = useRef<{
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
    lfo: OscillatorNode;
  } | null>(null);

  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  const playTone = (
    freq: number,
    type: OscillatorType,
    duration: number,
    vol: number = 0.1,
    slideTo?: number
  ) => {
    if (!sfxEnabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  const playNoise = (duration: number, vol: number = 0.1) => {
    if (!sfxEnabled) return;
    try {
      const ctx = getCtx();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  const playClick = () => playTone(800, 'square', 0.05, 0.02);
  const playHover = () => playTone(400, 'sine', 0.05, 0.01);
  const playDeal = () => playNoise(0.15, 0.05);
  const playChip = () => {
    playTone(2000, 'sine', 0.1, 0.02);
    setTimeout(() => playTone(2500, 'sine', 0.1, 0.02), 20);
  };
  const playWin = () => {
    playTone(400, 'square', 0.1, 0.03);
    setTimeout(() => playTone(600, 'square', 0.1, 0.03), 100);
    setTimeout(() => playTone(800, 'square', 0.3, 0.03), 200);
  };
  const playLose = () => {
    playTone(300, 'sawtooth', 0.3, 0.03, 100);
  };
  const playNotification = () => {
    playTone(600, 'sine', 0.1, 0.03);
    setTimeout(() => playTone(1200, 'sine', 0.2, 0.03), 100);
  };

  // BGM Drone
  useEffect(() => {
    if (bgmEnabled) {
      try {
        const ctx = getCtx();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.value = 55; // A1

        osc2.type = 'square';
        osc2.frequency.value = 55.5; // Slight detune

        filter.type = 'lowpass';
        filter.frequency.value = 400;

        // LFO for filter
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // Very slow
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 200;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        gain.gain.value = 0.02; // Very quiet background drone

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        bgmNodesRef.current = { osc1, osc2, filter, gain, lfo };
      } catch (e) {
        console.error('BGM playback failed', e);
        setBgmEnabled(false);
      }
    } else if (bgmNodesRef.current) {
      const { osc1, osc2, filter, gain, lfo } = bgmNodesRef.current;
      try {
        osc1.stop();
        osc2.stop();
        lfo.stop();
        osc1.disconnect();
        osc2.disconnect();
        filter.disconnect();
        gain.disconnect();
        lfo.disconnect();
      } catch (e) {}
      bgmNodesRef.current = null;
    }

    return () => {
      if (bgmNodesRef.current) {
        const { osc1, osc2, filter, gain, lfo } = bgmNodesRef.current;
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
          osc1.disconnect();
          osc2.disconnect();
          filter.disconnect();
          gain.disconnect();
          lfo.disconnect();
        } catch (e) {}
        bgmNodesRef.current = null;
      }
    };
  }, [bgmEnabled]);

  const toggleBgm = () => setBgmEnabled(!bgmEnabled);
  const toggleSfx = () => setSfxEnabled(!sfxEnabled);

  return (
    <GameAudioContext.Provider
      value={{
        playClick,
        playHover,
        playDeal,
        playChip,
        playWin,
        playLose,
        playNotification,
        bgmEnabled,
        toggleBgm,
        sfxEnabled,
        toggleSfx,
      }}
    >
      {children}
    </GameAudioContext.Provider>
  );
};

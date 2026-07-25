import { useCallback, useEffect, useState } from 'react';
import VoiceBridgeService, { type VoiceBridgeSnapshot } from '../services/VoiceBridgeService';

export function useVoiceBridge(_pollMs = 2000) {
  const [snapshot, setSnapshot] = useState<VoiceBridgeSnapshot>(() =>
    VoiceBridgeService.getSnapshot()
  );

  useEffect(() => {
    return VoiceBridgeService.onChange(setSnapshot);
  }, []);

  const refresh = useCallback(async () => {
    await VoiceBridgeService.refresh();
  }, []);

  const pauseBeam = useCallback(async () => {
    await VoiceBridgeService.pauseBeam();
  }, []);

  const resumeBeam = useCallback(async () => {
    await VoiceBridgeService.resumeBeam();
  }, []);

  const stopSpeech = useCallback(async () => {
    await VoiceBridgeService.stopSpeech();
  }, []);

  const activateBridge = useCallback(async () => {
    await VoiceBridgeService.activateBridge();
  }, []);

  const ensureStarted = useCallback(async () => {
    return VoiceBridgeService.ensureStarted();
  }, []);

  const sendUtterance = useCallback(async (text: string) => {
    await VoiceBridgeService.sendUtterance(text);
  }, []);

  const setResponseAudioEnabled = useCallback(async (enabled: boolean) => {
    await VoiceBridgeService.setResponseAudioEnabled(enabled);
  }, []);

  return {
    snapshot,
    refresh,
    pauseBeam,
    resumeBeam,
    stopSpeech,
    activateBridge,
    ensureStarted,
    sendUtterance,
    setResponseAudioEnabled,
  };
}

export default useVoiceBridge;

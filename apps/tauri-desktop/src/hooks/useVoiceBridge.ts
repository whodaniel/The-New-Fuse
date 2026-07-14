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

  return {
    snapshot,
    refresh,
    pauseBeam: VoiceBridgeService.pauseBeam.bind(VoiceBridgeService),
    resumeBeam: VoiceBridgeService.resumeBeam.bind(VoiceBridgeService),
    stopSpeech: VoiceBridgeService.stopSpeech.bind(VoiceBridgeService),
    activateBridge: VoiceBridgeService.activateBridge.bind(VoiceBridgeService),
    sendUtterance: VoiceBridgeService.sendUtterance.bind(VoiceBridgeService),
    setResponseAudioEnabled: VoiceBridgeService.setResponseAudioEnabled.bind(VoiceBridgeService),
  };
}

export default useVoiceBridge;

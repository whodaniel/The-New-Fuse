import { useEffect } from 'react';
import { useRoute } from '../route-context';
import { useOperatorSynergy } from '../../hooks/useOperatorSynergy';
import DesktopPresenceService from '../../services/DesktopPresenceService';

/** Syncs live desktop UI + pathways into federation heartbeat and ~/.tnf presence files. */
export function DesktopPresenceBridge(): null {
  const { currentRoute } = useRoute();
  const { state } = useOperatorSynergy();

  useEffect(() => {
    DesktopPresenceService.start();
    return () => DesktopPresenceService.stop();
  }, []);

  useEffect(() => {
    void DesktopPresenceService.publish(currentRoute, state);
  }, [currentRoute, state]);

  return null;
}

export default DesktopPresenceBridge;

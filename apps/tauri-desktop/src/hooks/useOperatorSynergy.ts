import { useCallback, useEffect, useState } from 'react';
import OperatorSynergyService from '../services/OperatorSynergyService';
import type { OperatorSynergySnapshot } from '../services/operatorSynergy/types';

export function useOperatorSynergy() {
  const [state, setState] = useState<OperatorSynergySnapshot>(() =>
    OperatorSynergyService.getSnapshot()
  );

  useEffect(() => {
    const onChange: (snapshot?: OperatorSynergySnapshot) => void = (snapshot) => {
      if (snapshot) setState({ ...snapshot });
    };
    OperatorSynergyService.on('change', onChange as (data?: unknown) => void);
    setState(OperatorSynergyService.getSnapshot());
    return () => {
      OperatorSynergyService.off('change', onChange as (data?: unknown) => void);
    };
  }, []);

  const refresh = useCallback(async () => {
    await OperatorSynergyService.refreshHealth();
    OperatorSynergyService.syncFromServices();
  }, []);

  return {
    state,
    refresh,
    unifiedAgents: state.unifiedAgents,
    topology: state.topology,
    activityLog: state.activityLog,
    sendFederationMessage:
      OperatorSynergyService.sendFederationMessage.bind(OperatorSynergyService),
  };
}

export default useOperatorSynergy;

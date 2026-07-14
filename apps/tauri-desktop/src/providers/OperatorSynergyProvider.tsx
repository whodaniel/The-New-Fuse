import React, { useEffect } from 'react';
import OperatorSynergyService from '../services/OperatorSynergyService';
import { useAgentStore, useSettingsStore } from '../stores';

export const OperatorSynergyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { environment, customApiUrl } = useSettingsStore();

  useEffect(() => {
    void OperatorSynergyService.bootstrap(environment, customApiUrl);
  }, [environment, customApiUrl]);

  useEffect(() => {
    return useAgentStore.subscribe((current, previous) => {
      if (current.agents !== previous.agents || current.apiOffline !== previous.apiOffline) {
        OperatorSynergyService.syncFromServices();
      }
    });
  }, []);

  return <>{children}</>;
};

export default OperatorSynergyProvider;

import { createContext } from 'react';

export interface FeatureToggleContextType {
  enabledFeatures: string[];
  isEnabled(feature: string): boolean;
}

export const FeatureToggleContext = createContext<FeatureToggleContextType>({
  enabledFeatures: [],
  isEnabled: () => false
});
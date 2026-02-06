import { createContext } from 'react';

export interface FeatureToggleContextType {
  isEnabled: (feature: string) => boolean;
}

export const FeatureToggleContext = createContext<FeatureToggleContextType | null>(null);

import { useContext } from 'react';
import { FeatureToggleContext } from './types/index.js';

export const useFeatureToggle = (): any => {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureToggle must be used within a FeatureToggleProvider');
  }
  return context;
};
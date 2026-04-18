import { useContext } from 'react';
import { ApiClientContext } from './types/index.js';

export const useApiClient = (): any => {
  const context = useContext(ApiClientContext);
  if (!context) {
    throw new Error('useApiClient must be used within an ApiClientProvider');
  }
  return context;
};
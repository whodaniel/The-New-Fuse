// Export shared types
export * from '@the-new-fuse/types';

// Add any additional shared types here
export interface SharedConfig {
  version: string;
  environment: 'development' | 'production' | 'test';
  features: Record<string, boolean>;
}
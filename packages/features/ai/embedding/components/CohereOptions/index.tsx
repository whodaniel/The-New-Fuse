import type { CohereEmbeddingSettings } from '@/types/embedding';
import { CohereOptions as Component } from './CohereOptions.js';

export default function CohereOptions({ settings }: { settings: CohereEmbeddingSettings }) {
  return <Component settings={settings} />;
}
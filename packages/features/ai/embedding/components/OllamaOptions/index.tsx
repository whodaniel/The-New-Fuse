import type { BaseEmbeddingSettings } from '@/types/embedding';
import { OllamaEmbeddingOptions as Component } from './OllamaOptions.js';

export default function OllamaOptions({ settings }: { settings: BaseEmbeddingSettings }) {
  return <Component settings={settings} />;
}
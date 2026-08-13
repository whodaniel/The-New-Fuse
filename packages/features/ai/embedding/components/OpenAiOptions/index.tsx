import type { OpenAiEmbeddingSettings } from '@/types/embedding';
import { OpenAiOptions as Component } from './OpenAiOptions.js';

export default function OpenAiOptions({ settings }: { settings: OpenAiEmbeddingSettings }) {
  return <Component settings={settings} />;
}

/** Open the global FeatureAIAssistDock dialog from any chrome/button. */
export const AI_ASSIST_OPEN_EVENT = 'ai-assist:open';

export function openAIAssist(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AI_ASSIST_OPEN_EVENT));
}

// @ts-nocheck
Object.defineProperty(exports, '__esModule', { value: true });
export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 text-muted-foreground" role="status" aria-live="polite">
      <span className="sr-only">Someone is typing...</span>
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" aria-hidden="true" />
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-100" aria-hidden="true" />
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-200" aria-hidden="true" />
    </div>
  );
}

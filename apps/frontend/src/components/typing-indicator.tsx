// @ts-nocheck
Object.defineProperty(exports, '__esModule', { value: true });
export function TypingIndicator() {
  return (
    <div
      className="flex items-center space-x-2 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Agent is typing...</span>
      <div className="flex items-center space-x-2" aria-hidden="true">
        <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
        <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-100" />
        <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-200" />
      </div>
    </div>
  );
}

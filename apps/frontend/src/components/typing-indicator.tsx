// @ts-nocheck
Object.defineProperty(exports, '__esModule', { value: true });
export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-100" />
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-200" />
    </div>
  );
}

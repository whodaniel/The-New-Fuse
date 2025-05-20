Object.defineProperty(exports, "__esModule", { value: true });
exports.TypingIndicator = TypingIndicator;
import react_1 from 'react';
function TypingIndicator() {
    return (<div className="flex items-center space-x-2 text-neutral-500">
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce"/>
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-100"/>
      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce delay-200"/>
    </div>);
}
export {};
//# sourceMappingURL=typing-indicator.js.map
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBubble = MessageBubble;
import react_1 from 'react';
import message_utils_1 from '../utils/message-utils.js';
function MessageBubble({ message, agents }) {
    const isUserMessage = message.sender === 'User';
    return (<div className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${isUserMessage
            ? 'bg-blue-500 text-white'
            : 'bg-neutral-100 dark:bg-neutral-800'}`}>
        <p className="break-words">{message.content}</p>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-neutral-500">
          {(0, message_utils_1.formatTimestamp)(message.timestamp)}
        </span>
        {message.agentId && (<span className="text-xs text-neutral-500">
            via {(0, message_utils_1.getAgentNameById)(agents, message.agentId)}
          </span>)}
      </div>
    </div>);
}
export {};
//# sourceMappingURL=message-bubble.js.map
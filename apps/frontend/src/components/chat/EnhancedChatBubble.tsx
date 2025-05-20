Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedChatBubble = EnhancedChatBubble;
import react_1 from 'react';
import message_utils_1 from '../../utils/message-utils.js';
import ui_1 from '../ui.js';
function EnhancedChatBubble({ message, agents, workspace }) {
    const isUser = message.sender.type === 'user';
    const agent = message.metadata.agentId
        ? agents.find(a => a.id === message.metadata.agentId)
        : null;
    return (<div className="flex justify-center items-end w-full bg-theme-bg-secondary">
      <div className={`py-4 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex gap-x-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <ui_1.UserIcon user={message.sender} role={message.sender.type}/>
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg p-3 ${isUser
            ? 'bg-blue-500 text-white'
            : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              <span className="whitespace-pre-line font-normal text-sm">
                {message.content}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-neutral-500">
                {(0, message_utils_1.formatTimestamp)(message.timestamp)}
              </span>
              {agent && (<span className="text-xs text-neutral-500">
                  via {agent.name}
                </span>)}
            </div>
          </div>
        </div>
      </div>
    </div>);
}
export {};
//# sourceMappingURL=EnhancedChatBubble.js.map
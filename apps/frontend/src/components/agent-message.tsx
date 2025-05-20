import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
const AgentMessage = ({ agent, message, isCurrentUser }) => {
    const messageClasses = cn('flex w-full max-w-md gap-2 p-4', isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto');
    const renderMessageContent = () => {
        var _a;
        switch (message.type) {
            case 'code':
                return (<pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
            <code>{message.content}</code>
          </pre>);
            case 'image':
                return (<img src={message.content} alt={((_a = message.metadata) === null || _a === void 0 ? void 0 : _a.alt) || 'Message image'} className="max-w-full rounded-md"/>);
            default:
                return <p className="text-sm">{message.content}</p>;
        }
    };
    return (<Card className={messageClasses}>
      <Avatar className="h-8 w-8">
        {agent.avatar ? (<AvatarImage src={agent.avatar} alt={agent.name}/>) : (<AvatarFallback>{agent.name[0].toUpperCase()}</AvatarFallback>)}
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{agent.name}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {renderMessageContent()}
      </div>
    </Card>);
};
export default AgentMessage;
//# sourceMappingURL=agent-message.js.map
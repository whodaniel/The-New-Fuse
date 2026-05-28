import React, { FC } from 'react';

export interface ChatMessageProps {
  className?: string;
  children?: React.ReactNode;
}

export const ChatMessage: FC<ChatMessageProps> = ({ className, children }) => (
  <div className={`tnf-chatMessage ${className || ''}`} data-testid="chatMessage">
    {children || <span>ChatMessage</span>}
  </div>
);

export default ChatMessage;

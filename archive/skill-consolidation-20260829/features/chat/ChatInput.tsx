import React, { FC } from 'react';

export interface ChatInputProps {
  className?: string;
  children?: React.ReactNode;
}

export const ChatInput: FC<ChatInputProps> = ({ className, children }) => (
  <div className={`tnf-chatInput ${className || ''}`} data-testid="chatInput">
    {children || <span>ChatInput</span>}
  </div>
);

export default ChatInput;

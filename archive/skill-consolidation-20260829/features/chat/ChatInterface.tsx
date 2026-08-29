import React, { FC } from 'react';

export interface ChatInterfaceProps {
  className?: string;
  children?: React.ReactNode;
}

export const ChatInterface: FC<ChatInterfaceProps> = ({ className, children }) => (
  <div className={`tnf-chatInterface ${className || ''}`} data-testid="chatInterface">
    {children || <span>ChatInterface</span>}
  </div>
);

export default ChatInterface;

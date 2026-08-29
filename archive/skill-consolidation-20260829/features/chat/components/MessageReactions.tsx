import React, { FC } from 'react';

export interface MessageReactionsProps {
  className?: string;
  children?: React.ReactNode;
}

export const MessageReactions: FC<MessageReactionsProps> = ({ className, children }) => (
  <div className={`tnf-messageReactions ${className || ''}`} data-testid="messageReactions">
    {children || <span>MessageReactions</span>}
  </div>
);

export default MessageReactions;

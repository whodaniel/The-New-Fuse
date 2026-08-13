import React, { FC } from 'react';

export interface CommentThreadProps {
  className?: string;
  children?: React.ReactNode;
}

export const CommentThread: FC<CommentThreadProps> = ({ className, children }) => (
  <div className={`tnf-commentThread ${className || ''}`} data-testid="commentThread">
    {children || <span>CommentThread</span>}
  </div>
);

export default CommentThread;

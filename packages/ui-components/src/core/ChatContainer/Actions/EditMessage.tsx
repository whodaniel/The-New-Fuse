import React from 'react';

export interface EditMessageProps {
  messageId: string;
  onEdit: (messageId: string, newContent: string) => void;
}

export const EditMessage: React.FC<EditMessageProps> = ({ messageId, onEdit }) => {
  return (
    <button
      onClick={() => onEdit(messageId, 'Edited content')}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      Edit
    </button>
  );
};
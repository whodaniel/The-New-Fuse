import React from 'react';

export interface DeleteMessageProps {
  messageId: string;
  onDelete: (messageId: string) => void;
}

export const DeleteMessage: React.FC<DeleteMessageProps> = ({ messageId, onDelete }) => {
  return (
    <button
      onClick={() => onDelete(messageId)}
      className="text-sm text-destructive hover:text-destructive/80"
    >
      Delete
    </button>
  );
};
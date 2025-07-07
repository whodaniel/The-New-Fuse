import React from 'react';

export interface FeedbackProps {
  messageId: string;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export const Feedback: React.FC<FeedbackProps> = ({ messageId, onFeedback }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onFeedback(messageId, 'positive')}
        className="text-sm text-muted-foreground hover:text-green-600"
      >
        👍
      </button>
      <button
        onClick={() => onFeedback(messageId, 'negative')}
        className="text-sm text-muted-foreground hover:text-red-600"
      >
        👎
      </button>
    </div>
  );
};
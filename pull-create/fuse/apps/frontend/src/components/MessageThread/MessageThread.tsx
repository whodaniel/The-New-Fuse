// @ts-nocheck
import { format } from 'date-fns';
import { Send, X } from 'lucide-react';
import React, { useState } from 'react';
import MarkdownRenderer from '../MarkdownRenderer';

// Placeholder for missing MessageReactions component
// import MessageReactions from '../MessageReactions/MessageReactions';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string | Date;
  reactions?: any[];
}

interface MessageThreadProps {
  parentMessage: Message;
  replies: Message[];
  onReply: (content: string, parentId: string) => Promise<void>;
  onClose: () => void;
  currentUserId: string;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  parentMessage,
  replies,
  onReply,
  onClose,
  currentUserId,
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(replyContent, parentMessage.id);
      setReplyContent('');
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Thread</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        {/* Parent Message */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-200 font-medium text-lg">
                  {parentMessage.sender.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {parentMessage.sender}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(parentMessage.timestamp), 'MMM d, h:mm a')}
                </span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={parentMessage.content} />
              </div>
              {/* <MessageReactions messageId={parentMessage.id} reactions={parentMessage.reactions || []} currentUserId={currentUserId} /> */}
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-gray-200 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {reply.sender.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {reply.sender}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(reply.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <MarkdownRenderer content={reply.content} />
                  </div>
                  {/* <MessageReactions messageId={reply.id} reactions={reply.reactions || []} currentUserId={currentUserId} /> */}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Input */}
        <div className="mt-4">
          <div className="flex flex-col space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Reply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;

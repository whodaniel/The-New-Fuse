"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageThread = void 0;
import react_1 from 'react';
import { format } from 'date-fns';
import ui_1 from '../../shared/components/ui.js';
import icons_material_1 from '@mui/icons-material';
import MessageReactions_1 from '../MessageReactions/MessageReactions.js';
import MarkdownRenderer_1 from '../MarkdownRenderer.js';
const MessageThread = ({ parentMessage, replies, onReply, onClose, currentUserId }) => {
    const [replyContent, setReplyContent] = (0, react_1.useState)('');
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const handleSubmitReply = async () => {
        if (!replyContent.trim())
            return;
        setIsSubmitting(true);
        try {
            await onReply(replyContent, parentMessage.id);
            setReplyContent('');
        }
        catch (error) {
            console.error('Error submitting reply:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<ui_1.Card variant="default" className="w-full max-w-2xl mx-auto">
      <ui_1.CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Thread</h3>
          <ui_1.Button variant="default" size="small" onClick={onClose} className="!p-1">
            <icons_material_1.Close className="w-5 h-5"/>
          </ui_1.Button>
        </div>
      </ui_1.CardHeader>

      <ui_1.CardContent>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {parentMessage.sender.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{parentMessage.sender}</span>
                <span className="text-sm text-gray-500">
                  {format(new Date(parentMessage.timestamp), 'MMM d, h:mm a')}
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer_1.default content={parentMessage.content}/>
              </div>
              <MessageReactions_1.default messageId={parentMessage.id} reactions={parentMessage.reactions || []} currentUserId={currentUserId}/>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {replies.map((reply) => (<div key={reply.id} className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {reply.sender.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{reply.sender}</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(reply.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <MarkdownRenderer_1.default content={reply.content}/>
                  </div>
                  <MessageReactions_1.default messageId={reply.id} reactions={reply.reactions || []} currentUserId={currentUserId}/>
                </div>
              </div>
            </div>))}
        </div>

        <div className="mt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write your reply..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none" disabled={isSubmitting}/>
            </div>
            <ui_1.Button variant="gradient" onClick={handleSubmitReply} disabled={isSubmitting || !replyContent.trim()} className="self-end">
              {isSubmitting ? (<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>) : (<icons_material_1.Send className="w-5 h-5"/>)}
            </ui_1.Button>
          </div>
        </div>
      </ui_1.CardContent>
    </ui_1.Card>);
};
exports.MessageThread = MessageThread;
exports.default = exports.MessageThread;
export {};
//# sourceMappingURL=MessageThread.js.map
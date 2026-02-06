import { Copy, Trash2 } from 'lucide-react';

interface ActionsProps {
  message: string;
  feedbackScore?: number | null;
  chatId?: string | null;
  slug?: string;
  isLastMessage?: boolean;
  regenerateMessage?: (chatId: string) => void;
  isEditing?: boolean;
  role: 'user' | 'assistant' | 'system';
  forkThread?: (chatId: string) => void;
}

export default function Actions({
  message,
  _feedbackScore,
  chatId,
  _slug,
  isLastMessage,
  regenerateMessage,
  _isEditing,
  role,
  forkThread,
}: ActionsProps) {
  const copyMessage = () => {
    try {
      navigator.clipboard.writeText(message);
      alert('Message copied to clipboard!');
    } catch {
      alert('Failed to copy message. Please try again.');
    }
  };

  const handleRegenerate = () => {
    if (chatId && regenerateMessage) {
      try {
        regenerateMessage(chatId);
        alert('Response regenerated successfully!');
      } catch {
        alert('Failed to regenerate response. Please try again.');
      }
    }
  };

  const handleFork = () => {
    if (chatId && forkThread) {
      try {
        forkThread(chatId);
        alert('Thread forked successfully!');
      } catch {
        alert('Failed to fork thread. Please try again.');
      }
    }
  };

  return (
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={copyMessage}
        className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
        title="Copy message"
        aria-label="Copy message"
      >
        <Copy size={16} />
      </button>

      {role === 'user' && (
        <button
          className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
          title="Edit message"
          aria-label="Edit message"
        >
          <PencilSimple size={16} />
        </button>
      )}

      {role === 'assistant' && isLastMessage && regenerateMessage && (
        <button
          onClick={handleRegenerate}
          className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <ArrowClockwise size={16} />
        </button>
      )}

      {chatId && forkThread && (
        <button
          onClick={handleFork}
          className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
          title="Fork thread"
          aria-label="Fork thread"
        >
          <ArrowsSplit size={16} />
        </button>
      )}

      <button
        className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
        title="Delete message"
        aria-label="Delete message"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

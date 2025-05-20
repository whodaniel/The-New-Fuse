import React from "react";
import { ArrowClockwise, PencilSimple, Trash, ArrowSquareOut } from "@phosphor-icons/react";
import { useEditMessage } from './EditMessage.js';
import { useDeleteMessage } from './DeleteMessage.js';
import FeedbackButtons from '../Feedback.js';

interface ActionsProps {
  message: string;
  feedbackScore?: number | null;
  chatId?: string | null;
  slug?: string;
  isLastMessage?: boolean;
  regenerateMessage?: (chatId: string) => void;
  isEditing?: boolean;
  role: "user" | "assistant";
  forkThread?: (chatId: string) => void;
}

export default function Actions({
  message,
  feedbackScore,
  chatId,
  slug,
  isLastMessage,
  regenerateMessage,
  isEditing,
  role,
  forkThread,
}: ActionsProps): JSX.Element | null {
  const { toggleEdit } = useEditMessage({ chatId, role });
  const { deleteMessage } = useDeleteMessage({ chatId, role });

  if (!chatId) return null;

  return (
    <div className="flex gap-x-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
      {role === "user" && (
        <button
          onClick={toggleEdit}
          disabled={isEditing}
          data-tooltip-id="edit-message"
          className="text-white/40 hover:text-white/80 disabled:hover:text-white/40"
        >
          <PencilSimple className="w-4 h-4" />
        </button>
      )}

      {role === "assistant" && isLastMessage && regenerateMessage && (
        <button
          onClick={() => regenerateMessage(chatId)}
          data-tooltip-id="regenerate-response"
          className="text-white/40 hover:text-white/80"
        >
          <ArrowClockwise className="w-4 h-4" />
        </button>
      )}

      {forkThread && (
        <button
          onClick={() => forkThread(chatId)}
          data-tooltip-id="fork-thread"
          className="text-white/40 hover:text-white/80"
        >
          <ArrowSquareOut className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={() => deleteMessage()}
        data-tooltip-id="delete-message"
        className="text-white/40 hover:text-white/80"
      >
        <Trash className="w-4 h-4" />
      </button>

      {role === "assistant" && slug && (
        <FeedbackButtons
          chatId={chatId}
          slug={slug}
          feedbackScore={feedbackScore}
        />
      )}
    </div>
  );
}
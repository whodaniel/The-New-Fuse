import { useState } from "react";
import { useParams } from "react-router-dom";
import Workspace from "@/models/workspace";

interface UseDeleteMessageParams {
  chatId: string | null;
  role: "user" | "assistant";
}

interface UseDeleteMessageReturn {
  deleteMessage: () => Promise<void>;
}

interface UseWatchDeleteMessageParams {
  chatId: string | null;
  role: "user" | "assistant";
}

interface UseWatchDeleteMessageReturn {
  isDeleted: boolean;
  completeDelete: boolean;
  onEndAnimation: () => void;
}

export function useDeleteMessage({ chatId, role }: UseDeleteMessageParams): UseDeleteMessageReturn {
  const { workspaceSlug = null, threadSlug = null } = useParams<{
    workspaceSlug?: string;
    threadSlug?: string;
  }>();

  const deleteMessage = async () => {
    if (!chatId || !workspaceSlug) return;

    try {
      if (role === "user") {
        await Workspace.deleteUserMessage(workspaceSlug, threadSlug, chatId);
      } else {
        await Workspace.deleteAssistantMessage(workspaceSlug, threadSlug, chatId);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return { deleteMessage };
}

export function useWatchDeleteMessage({ chatId, role }: UseWatchDeleteMessageParams): UseWatchDeleteMessageReturn {
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [completeDelete, setCompleteDelete] = useState<boolean>(false);

  const onEndAnimation = () => {
    if (isDeleted) {
      setCompleteDelete(true);
    }
  };

  return { isDeleted, completeDelete, onEndAnimation };
}
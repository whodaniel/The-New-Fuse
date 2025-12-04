interface ActionsProps {
    message: string;
    feedbackScore?: number | null;
    chatId?: string | null;
    slug?: string;
    isLastMessage?: boolean;
    regenerateMessage?: (chatId: string) => void;
    isEditing?: boolean;
    role: "user" | "assistant" | "system";
    forkThread?: (chatId: string) => void;
}
export default function Actions({ message, _feedbackScore, chatId, _slug, isLastMessage, regenerateMessage, _isEditing, role, forkThread, }: ActionsProps): import("react/jsx-runtime").JSX.Element;
export {};

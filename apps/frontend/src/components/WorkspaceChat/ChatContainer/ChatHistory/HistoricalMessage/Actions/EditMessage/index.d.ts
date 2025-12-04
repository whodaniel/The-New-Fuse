import React from "react";
interface EditMessageFormProps {
    role: "user" | "assistant";
    chatId: string | null;
    message: string;
    attachments?: File[];
    createdAt: Date | string | number;
    editedAt?: Date | string | number;
    adjustTextArea: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    saveChanges: (params: {
        editedMessage: string;
        chatId: string;
        role: "user" | "assistant";
        attachments?: File[];
        editedAt: Date;
    }) => void;
}
interface UseEditMessageParams {
    chatId: string | null;
    role: "user" | "assistant";
}
interface UseEditMessageReturn {
    isEditing: boolean;
    toggleEdit: () => void;
}
export declare function EditMessageForm({ role, chatId, message, attachments, adjustTextArea, saveChanges, }: EditMessageFormProps): JSX.Element | null;
export declare function useEditMessage({ chatId, role }: UseEditMessageParams): UseEditMessageReturn;
export {};

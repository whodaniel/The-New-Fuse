import React, { useState, useRef } from "react";
import { useEventListener } from "@/hooks/useEventListener";
import { v4 } from "uuid";
import { TimeStamp } from "@/utils/TimeStamp";

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

export function EditMessageForm({
  role,
  chatId,
  message,
  attachments = [],
  adjustTextArea,
  saveChanges,
}: EditMessageFormProps): JSX.Element | null {
  const [editedMessage, setEditedMessage] = useState<string>(message);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formId = useRef<string>(v4());

  useEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      textareaRef.current?.form?.reset();
      setEditedMessage(message);
    }
  });

  if (!chatId) return null;

  return (
    <form
      id={formId.current}
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (editedMessage === message) return;
        saveChanges({
          editedMessage,
          chatId,
          role,
          attachments,
          editedAt: new Date(),
        });
      }}
    >
      <textarea
        ref={textareaRef}
        name="message"
        rows={1}
        className="w-full text-white bg-transparent border-none outline-none resize-none overflow-hidden"
        value={editedMessage}
        onChange={(e) => {
          adjustTextArea(e);
          setEditedMessage(e.target.value);
        }}
        autoFocus
      />
      <div className="flex gap-x-2 mt-2">
        <button
          type="submit"
          className="px-2 py-1 text-xs text-white bg-primary-button rounded-md hover:bg-primary-button-hover"
        >
          Save Changes
        </button>
        <button
          type="reset"
          className="px-2 py-1 text-xs text-white/60 hover:text-white"
          onClick={() => setEditedMessage(message)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function useEditMessage({ chatId, role }: UseEditMessageParams): UseEditMessageReturn {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return { isEditing, toggleEdit };
}
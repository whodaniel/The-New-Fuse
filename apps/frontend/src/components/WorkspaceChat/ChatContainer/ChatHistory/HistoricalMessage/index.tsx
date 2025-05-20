import React, { memo, ReactElement } from "react";
import { Warning } from "@phosphor-icons/react";
import UserIcon from '../../../../UserIcon.js';
import Actions from './Actions.js';
import renderMarkdown from "@/utils/chat/markdown";
import { userFromStorage } from "@/utils/request";
import Citations from '../Citation.js';
import { v4 } from "uuid";
import createDOMPurify from "dompurify";
import { EditMessageForm, useEditMessage } from './Actions/EditMessage.js';
import { useWatchDeleteMessage } from './Actions/DeleteMessage.js';
import TTSMessage from './Actions/TTSButton.js';
import { WorkspaceData } from "@/types/workspace";
import { TimeStamp } from "@/utils/TimeStamp";

const DOMPurify = createDOMPurify(window);

interface Source {
  content: string;
  title?: string;
  url?: string;
}

interface HistoricalMessageProps {
  uuid?: string;
  message: string;
  role: "user" | "assistant" | "system";
  workspace: WorkspaceData | null;
  sources?: Source[];
  attachments?: {
    name: string;
    contentString: string;
  }[];
  error?: string | false;
  feedbackScore?: number | null;
  chatId?: string | null;
  isLastMessage?: boolean;
  regenerateMessage?: (chatId: string) => void;
  saveEditedMessage?: (params: {
    editedMessage: string;
    chatId: string;
    role: "user" | "assistant";
    attachments?: File[];
  }) => void;
  forkThread?: (chatId: string) => void;
  createdAt: Date | string | number;
  editedAt?: Date | string | number;
}

interface ProfileImageProps {
  role: "user" | "assistant" | "system";
  workspace: WorkspaceData | null;
}

interface ChatAttachmentsProps {
  attachments?: {
    name: string;
    contentString: string;
  }[];
}

const HistoricalMessage = ({
  uuid = v4(),
  message,
  role,
  workspace,
  sources = [],
  attachments = [],
  error = false,
  feedbackScore = null,
  chatId = null,
  isLastMessage = false,
  regenerateMessage,
  saveEditedMessage,
  forkThread,
  createdAt,
  editedAt,
}: HistoricalMessageProps): ReactElement => {
  const { isEditing } = useEditMessage({ chatId, role });
  const { isDeleted, completeDelete, onEndAnimation } = useWatchDeleteMessage({
    chatId,
    role,
  });

  const timestamp = new TimeStamp(createdAt);
  const editedTimestamp = editedAt ? new TimeStamp(editedAt) : null;

  const adjustTextArea = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const element = event.target;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  if (error) {
    return (
      <div
        key={uuid}
        className={`flex justify-center items-end w-full bg-theme-bg-chat`}
      >
        <div className="py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className="flex gap-x-5">
            <ProfileImage role={role} workspace={workspace} />
            <div className="p-2 rounded-lg bg-red-50 text-red-500">
              <span className="inline-block">
                <Warning className="h-4 w-4 mb-1 inline-block" /> Could not
                respond to message.
              </span>
              <p className="text-xs font-mono mt-2 border-l-2 border-red-300 pl-2 bg-red-200 p-2 rounded-sm">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (completeDelete) return null;
  return (
    <div
      key={uuid}
      onAnimationEnd={onEndAnimation}
      className={`${
        isDeleted ? "animate-remove" : ""
      } flex justify-center items-end w-full group bg-theme-bg-chat`}
    >
      <div className="py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
        <div className="flex gap-x-5">
          <div className="flex flex-col items-center">
            <ProfileImage role={role} workspace={workspace} />
            <div className="mt-1 -mb-10">
              {role === "assistant" && workspace?.slug && chatId && (
                <TTSMessage
                  slug={workspace.slug}
                  chatId={chatId}
                  message={message}
                />
              )}
            </div>
          </div>
          {isEditing && saveEditedMessage ? (
            <EditMessageForm
              role={role}
              chatId={chatId}
              message={message}
              attachments={attachments}
              adjustTextArea={adjustTextArea}
              saveChanges={saveEditedMessage}
            />
          ) : (
            <div className="overflow-x-scroll break-words no-scroll">
              <span
                className="flex flex-col gap-y-1"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(renderMarkdown(message)),
                }}
              />
              <ChatAttachments attachments={attachments} />
            </div>
          )}
        </div>
        <div className="flex gap-x-5 ml-14">
          <Actions
            message={message}
            feedbackScore={feedbackScore}
            chatId={chatId}
            slug={workspace?.slug}
            isLastMessage={isLastMessage}
            regenerateMessage={regenerateMessage}
            isEditing={isEditing}
            role={role}
            forkThread={forkThread}
          />
        </div>
        {role === "assistant" && <Citations sources={sources} />}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60" title={timestamp.formatDateTime()}>
            {timestamp.formatRelative()}
          </span>
          {editedTimestamp && (
            <span 
              className="text-xs text-white/40" 
              title={`Edited ${editedTimestamp.formatDateTime()}`}
            >
              (edited {editedTimestamp.formatRelative()})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function ProfileImage({ role, workspace }: ProfileImageProps): ReactElement {
  if (role === "assistant" && workspace?.pfpUrl) {
    return (
      <div className="relative w-[35px] h-[35px] rounded-full flex-shrink-0 overflow-hidden">
        <img
          src={workspace.pfpUrl}
          alt="Workspace profile picture"
          className="absolute top-0 left-0 w-full h-full object-cover rounded-full bg-white"
        />
      </div>
    );
  }

  return (
    <UserIcon
      user={{
        uid: role === "user" ? userFromStorage()?.username : workspace?.slug,
      }}
      role={role}
    />
  );
}

function ChatAttachments({ attachments = [] }: ChatAttachmentsProps): ReactElement | null {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((item) => (
        <img
          key={item.name}
          src={item.contentString}
          className="max-w-[300px] rounded-md"
          alt={item.name}
        />
      ))}
    </div>
  );
}

export default memo(
  HistoricalMessage,
  (prevProps: HistoricalMessageProps, nextProps: HistoricalMessageProps) => {
    return (
      prevProps.message === nextProps.message &&
      prevProps.isLastMessage === nextProps.isLastMessage &&
      prevProps.chatId === nextProps.chatId
    );
  }
);
import React, { useState, useRef, useEffect } from "react";
import SlashCommandsButton, {
  SlashCommands,
  useSlashCommands,
} from './SlashCommands.js';
import debounce from "lodash.debounce";
import { PaperPlaneRight } from "@phosphor-icons/react";
import StopGenerationButton from './StopGenerationButton.js';
import AvailableAgentsButton, {
  AvailableAgents,
  useAvailableAgents,
} from './AgentMenu.js';
import TextSizeButton from './TextSizeMenu.js';
import SpeechToText from './SpeechToText.js';
import { Tooltip } from "react-tooltip";
import AttachmentManager from './Attachments.js';
import AttachItem from './AttachItem.js';
import { PASTE_ATTACHMENT_EVENT } from '../DnDWrapper.js';
import useTextSize from "@/hooks/useTextSize";

export const PROMPT_INPUT_EVENT = "set_prompt_input";
const MAX_EDIT_STACK_SIZE = 100;

interface EditState {
  value: string;
  cursorPositionStart: number;
  cursorPositionEnd: number;
}

interface PromptInputProps {
  submit: (event: React.FormEvent) => void;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  inputDisabled: boolean;
  buttonDisabled: boolean;
  sendCommand: (command: string, submit?: boolean) => void;
  attachments?: File[];
}

export default function PromptInput({
  submit,
  onChange,
  inputDisabled,
  buttonDisabled,
  sendCommand,
  attachments = [],
}: PromptInputProps): React.ReactElement {
  const [promptInput, setPromptInput] = useState<string>("");
  const { showAgents, setShowAgents } = useAvailableAgents();
  const { showSlashCommand, setShowSlashCommand } = useSlashCommands();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [_, setFocused] = useState<boolean>(false);
  const undoStack = useRef<EditState[]>([]);
  const redoStack = useRef<EditState[]>([]);
  const { textSizeClass } = useTextSize();

  function handlePromptUpdate(e: CustomEvent<string>) {
    setPromptInput(e?.detail ?? "");
  }

  function resetTextAreaHeight() {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
  }

  useEffect(() => {
    if (window) {
      window.addEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
      return () => window?.removeEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
    }
  }, []);

  useEffect(() => {
    if (!inputDisabled && textareaRef.current) textareaRef.current.focus();
    resetTextAreaHeight();
  }, [inputDisabled]);

  useEffect(() => {
    const handleKeypress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };
    
    input.current?.addEventListener('keypress', handleKeypress);
    return () => input.current?.removeEventListener('keypress', handleKeypress);
  }, [handleSubmit]);

  function saveCurrentState(adjustment = 0) {
    if (!textareaRef.current) return;
    if (undoStack.current.length >= MAX_EDIT_STACK_SIZE)
      undoStack.current.shift();
    undoStack.current.push({
      value: promptInput,
      cursorPositionStart: textareaRef.current.selectionStart + adjustment,
      cursorPositionEnd: textareaRef.current.selectionEnd + adjustment,
    });
  }
  const debouncedSaveState = debounce(saveCurrentState, 250);

  function handleSubmit() {
    setFocused(false);
    submit(new React.FormEvent(formRef.current));
  }

  function checkForSlash(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const input = e.target.value;
    if (input === "/") setShowSlashCommand(true);
    if (showSlashCommand) setShowSlashCommand(false);
  }
  const watchForSlash = debounce(checkForSlash, 300);

  function checkForAt(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const input = e.target.value;
    if (input === "@") setShowAgents(true);
    if (showAgents) setShowAgents(false);
  }
  const watchForAt = debounce(checkForAt, 300);

  function captureEnterOrUndo(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      return submit(event);
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      event.shiftKey
    ) {
      event.preventDefault();
      if (redoStack.current.length === 0 || !textareaRef.current) return;

      const nextState = redoStack.current.pop();
      if (!nextState) return;

      undoStack.current.push({
        value: promptInput,
        cursorPositionStart: textareaRef.current.selectionStart,
        cursorPositionEnd: textareaRef.current.selectionEnd,
      });
      setPromptInput(nextState.value);
      setTimeout(() => {
        if (!textareaRef.current) return;
        textareaRef.current.setSelectionRange(
          nextState.cursorPositionStart,
          nextState.cursorPositionEnd
        );
      }, 0);
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      !event.shiftKey
    ) {
      if (undoStack.current.length === 0 || !textareaRef.current) return;
      const lastState = undoStack.current.pop();
      if (!lastState) return;

      redoStack.current.push({
        value: promptInput,
        cursorPositionStart: textareaRef.current.selectionStart,
        cursorPositionEnd: textareaRef.current.selectionEnd,
      });
      setPromptInput(lastState.value);
      setTimeout(() => {
        if (!textareaRef.current) return;
        textareaRef.current.setSelectionRange(
          lastState.cursorPositionStart,
          lastState.cursorPositionEnd
        );
      }, 0);
    }
  }

  function adjustTextArea(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const element = event.target;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }

  function handlePasteEvent(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    if (e.clipboardData.items.length === 0) return false;

    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          window.dispatchEvent(
            new CustomEvent(PASTE_ATTACHMENT_EVENT, {
              detail: { files: [file] },
            })
          );
        }
        continue;
      }

      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          window.dispatchEvent(
            new CustomEvent(PASTE_ATTACHMENT_EVENT, {
              detail: { files: [file] },
            })
          );
        }
        continue;
      }
    }

    const pasteText = e.clipboardData.getData("text/plain");
    if (pasteText && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newPromptInput =
        promptInput.substring(0, start) +
        pasteText +
        promptInput.substring(end);
      setPromptInput(newPromptInput);
      onChange({ target: { value: newPromptInput } } as React.ChangeEvent<HTMLTextAreaElement>);

      setTimeout(() => {
        if (!textareaRef.current) return;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          start + pasteText.length;
      }, 0);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    debouncedSaveState(-1);
    onChange(e);
    watchForSlash(e);
    watchForAt(e);
    adjustTextArea(e);
    setPromptInput(e.target.value);
  }

  return (
    <div className="w-full fixed md:absolute bottom-0 left-0 z-10 md:z-0 flex justify-center items-center">
      <SlashCommands
        showing={showSlashCommand}
        setShowing={setShowSlashCommand}
        sendCommand={sendCommand}
      />
      <AvailableAgents
        showing={showAgents}
        setShowing={setShowAgents}
        sendCommand={sendCommand}
        promptRef={textareaRef}
      />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-y-1 rounded-t-lg md:w-3/4 w-full mx-auto max-w-xl items-center"
      >
        <div className="flex items-center rounded-lg md:mb-4">
          <div className="w-[95vw] md:w-[635px] bg-theme-bg-chat-input light:bg-white light:border-solid light:border-[1px] light:border-theme-chat-input-border shadow-sm rounded-2xl flex flex-col px-4 overflow-hidden">
            <AttachmentManager attachments={attachments} />
            <div className="flex items-center w-full border-b-2 border-theme-chat-input-border">
              <textarea
                ref={textareaRef}
                onChange={handleChange}
                onKeyDown={captureEnterOrUndo}
                onPaste={(e) => {
                  saveCurrentState();
                  handlePasteEvent(e);
                }}
                required={true}
                disabled={inputDisabled}
                onFocus={() => setFocused(true)}
                onBlur={(e) => {
                  setFocused(false);
                  adjustTextArea(e);
                }}
                value={promptInput}
                className={`border-none cursor-text max-h-[50vh] md:max-h-[350px] md:min-h-[40px] mx-2 md:mx-0 pt-[12px] w-full leading-5 md:text-md text-white bg-transparent placeholder:text-white/60 light:placeholder:text-theme-text-primary resize-none active:outline-none focus:outline-none flex-grow ${textSizeClass}`}
                placeholder={"Send a message"}
              />
              {buttonDisabled ? (
                <StopGenerationButton />
              ) : (
                <>
                  <button
                    ref={formRef}
                    type="submit"
                    className="border-none inline-flex justify-center rounded-2xl cursor-pointer opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60 ml-4"
                    data-tooltip-id="send-prompt"
                    data-tooltip-content="Send prompt message to workspace"
                    aria-label="Send prompt message to workspace"
                  >
                    <PaperPlaneRight
                      color="var(--theme-sidebar-footer-icon-fill)"
                      className="w-[22px] h-[22px] pointer-events-none text-theme-text-primary"
                      weight="fill"
                    />
                    <span className="sr-only">Send message</span>
                  </button>
                  <Tooltip
                    id="send-prompt"
                    place="bottom"
                    delayShow={300}
                    className="tooltip !text-xs z-99"
                  />
                </>
              )}
            </div>
            <div className="flex justify-between py-3.5">
              <div className="flex gap-x-2">
                <AttachItem />
                <SlashCommandsButton
                  showing={showSlashCommand}
                  setShowSlashCommand={setShowSlashCommand}
                />
                <AvailableAgentsButton
                  showing={showAgents}
                  setShowAgents={setShowAgents}
                />
                <TextSizeButton />
              </div>
              <div className="flex gap-x-2">
                <SpeechToText sendCommand={sendCommand} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
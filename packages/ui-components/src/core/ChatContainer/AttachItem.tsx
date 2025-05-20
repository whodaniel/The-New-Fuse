import { useRef } from "react";
import { PaperclipHorizontal } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import { PASTE_ATTACHMENT_EVENT } from './DnDWrapper.js';

export default function AttachItem(): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    window.dispatchEvent(
      new CustomEvent(PASTE_ATTACHMENT_EVENT, {
        detail: { files: Array.from(files) },
      })
    );

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        data-tooltip-id="tooltip-attach-file"
        data-tooltip-content="Attach a file to your message."
        className="flex justify-center items-center cursor-pointer"
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        <PaperclipHorizontal
          color="var(--theme-sidebar-footer-icon-fill)"
          className="w-[20px] h-[20px] pointer-events-none opacity-60 hover:opacity-100 light:opacity-100 light:hover:opacity-60"
          weight="bold"
        />
      </div>
      <Tooltip
        id="tooltip-attach-file"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </>
  );
}
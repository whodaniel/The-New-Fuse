import { useContext } from "react";
import { DndUploaderContext } from './DnDWrapper.js';

interface AttachmentManagerProps {
  attachments?: File[];
}

export default function AttachmentManager({ attachments = [] }: AttachmentManagerProps): JSX.Element | null {
  const { removeFile } = useContext(DndUploaderContext);

  if (attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 py-2">
      {attachments.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center gap-x-2 px-2 py-1 rounded-md bg-theme-bg-base"
        >
          <span className="text-xs text-theme-text-secondary truncate max-w-[150px]">
            {file.name}
          </span>
          <button
            onClick={() => removeFile(file)}
            className="text-xs text-theme-text-secondary hover:text-theme-text-primary"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
import React, { createContext, useState, useEffect } from "react";
// Define WorkspaceData interface
interface WorkspaceData {
  id: string;
  name: string;
  // Add other properties as needed
}

export const PASTE_ATTACHMENT_EVENT = "paste_attachment";
export const CLEAR_ATTACHMENTS_EVENT = "clear_attachments";

interface DnDFileUploaderContextType {
  files: File[];
  parseAttachments: () => File[];
  removeFile: (file: File) => void;
}

interface DnDFileUploaderProviderProps {
  children: React.ReactNode;
  workspace: WorkspaceData | null;
}

export const DndUploaderContext = createContext<DnDFileUploaderContextType>({
  files: [],
  parseAttachments: () => [],
  removeFile: () => {},
});

export function DnDFileUploaderProvider({ children, workspace }: DnDFileUploaderProviderProps): JSX.Element {
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const handlePaste = (e: CustomEvent<{ files: File[] }>) => {
      setFiles((prev) => [...prev, ...e.detail.files]);
    };

    const clearAttachments = () => setFiles([]);

    window.addEventListener(PASTE_ATTACHMENT_EVENT, handlePaste as EventListener);
    window.addEventListener(CLEAR_ATTACHMENTS_EVENT, clearAttachments);

    return () => {
      window.removeEventListener(PASTE_ATTACHMENT_EVENT, handlePaste as EventListener);
      window.removeEventListener(CLEAR_ATTACHMENTS_EVENT, clearAttachments);
    };
  }, []);

  const parseAttachments = () => {
    const attachments = [...files];
    setFiles([]);
    return attachments;
  };

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((f) => f !== file));
  };

  return (
    <DndUploaderContext.Provider value={{ files, parseAttachments, removeFile }}>
      {children}
    </DndUploaderContext.Provider>
  );
}

interface DnDFileUploaderWrapperProps {
  children: React.ReactNode;
}

export default function DnDFileUploaderWrapper({ children }: DnDFileUploaderWrapperProps): JSX.Element {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    window.dispatchEvent(
      new CustomEvent(PASTE_ATTACHMENT_EVENT, {
        detail: { files: droppedFiles },
      })
    );
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative h-full"
    >
      {isDragging && (
        <div className="absolute inset-0 bg-theme-bg-base bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-2xl text-theme-text-primary">
            Drop files here
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
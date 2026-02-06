import { createContext, ReactNode, useState } from 'react';

export const CLEAR_ATTACHMENTS_EVENT = 'clearAttachments';
export const PASTE_ATTACHMENT_EVENT = 'pasteAttachment';

interface DndUploaderContextType {
  files: File[];
  parseAttachments: (files: File[]) => void;
}

export const DndUploaderContext = createContext<DndUploaderContextType>({
  files: [],
  parseAttachments: () => {},
});

interface DnDFileUploaderWrapperProps {
  children: ReactNode;
}

export default function DnDFileUploaderWrapper({ children }: DnDFileUploaderWrapperProps) {
  const [files, setFiles] = useState<File[]>([]);

  const parseAttachments = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const contextValue = {
    files,
    parseAttachments,
  };

  return <DndUploaderContext.Provider value={contextValue}>{children}</DndUploaderContext.Provider>;
}

export { DnDFileUploaderWrapper };

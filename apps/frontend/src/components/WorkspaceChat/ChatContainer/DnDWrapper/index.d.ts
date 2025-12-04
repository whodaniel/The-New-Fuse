import React, { ReactNode } from 'react';
export declare const CLEAR_ATTACHMENTS_EVENT = "clearAttachments";
export declare const PASTE_ATTACHMENT_EVENT = "pasteAttachment";
interface DndUploaderContextType {
    files: File[];
    parseAttachments: (files: File[]) => void;
}
export declare const DndUploaderContext: React.Context<DndUploaderContextType>;
interface DnDFileUploaderWrapperProps {
    children: ReactNode;
}
export default function DnDFileUploaderWrapper({ children }: DnDFileUploaderWrapperProps): import("react/jsx-runtime").JSX.Element;
export { DnDFileUploaderWrapper };

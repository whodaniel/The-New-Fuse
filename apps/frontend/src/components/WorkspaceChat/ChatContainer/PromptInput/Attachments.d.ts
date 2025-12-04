import React from 'react';
interface Attachment {
    id: string;
    name: string;
    size: number;
    type: string;
    file?: File;
}
interface AttachmentsProps {
    attachments?: Attachment[];
    onAttachmentsChange?: (attachments: Attachment[]) => void;
    maxSize?: number;
    acceptedTypes?: string[];
    className?: string;
}
declare const Attachments: React.FC<AttachmentsProps>;
export default Attachments;

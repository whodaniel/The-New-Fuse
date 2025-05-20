import React from 'react';
interface FileUploadProps {
    onUpload: (files: File[]) => Promise<void>;
    maxSize?: number;
    acceptedTypes?: Record<string, string[]>;
    multiple?: boolean;
    maxFiles?: number;
    className?: string;
}
export declare function FileUpload({ onUpload, maxSize, acceptedTypes, multiple, maxFiles, className }: FileUploadProps): React.JSX.Element;
export {};

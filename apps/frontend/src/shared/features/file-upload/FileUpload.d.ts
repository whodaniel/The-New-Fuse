export declare function FileUpload({ onUpload, maxSize, acceptedTypes, multiple, maxFiles, className }: {
    onUpload: any;
    maxSize?: number | undefined;
    acceptedTypes?: {
        'image/*': never[];
        'application/pdf': never[];
        'text/*': never[];
    } | undefined;
    multiple?: boolean | undefined;
    maxFiles?: number | undefined;
    className: any;
}): import("react/jsx-runtime").JSX.Element;

interface CopyOptions {
    stripMarkdown?: boolean;
    stripFormatting?: boolean;
    notification?: boolean;
}
export declare function copyToClipboard(text: string, options?: CopyOptions): Promise<boolean>;
export declare function copyCodeBlock(codeBlock: string): Promise<boolean>;
export declare function shareMessage(message: string): Promise<boolean>;
export {};

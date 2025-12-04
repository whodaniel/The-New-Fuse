export interface ImageDimensions {
    width: number;
    height: number;
}
export interface ResizeOptions {
    maxWidth?: number;
    maxHeight?: number;
    maintainAspectRatio?: boolean;
    format?: 'jpeg' | 'png' | 'webp';
    quality?: number;
}
export declare function getImageDimensions(file: File): Promise<ImageDimensions>;
export declare function resizeImage(file: File, options?: ResizeOptions): Promise<Blob>;
export declare function isImage(file: File): boolean;
export declare function createImageThumbnail(file: File): Promise<string>;
export declare function getImagePlaceholder(mimeType: string): string;

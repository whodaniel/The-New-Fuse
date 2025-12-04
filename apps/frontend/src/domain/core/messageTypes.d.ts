export declare class MessageFactory {
    static createTextMessage(content: any, metadata: any): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: any;
        content: any;
        timestamp: number;
        metadata: any;
    };
    static createCodeMessage(content: any, language: any, fileName: any, metadata: any): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: any;
        content: any;
        language: any;
        fileName: any;
        timestamp: number;
        metadata: any;
    };
    static createImageMessage(url: any, alt: any, dimensions: any, metadata: any): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: any;
        url: any;
        alt: any;
        dimensions: any;
        timestamp: number;
        metadata: any;
    };
    static createFileMessage(url: any, name: any, size: any, mimeType: any, metadata: any): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: any;
        url: any;
        name: any;
        size: any;
        mimeType: any;
        timestamp: number;
        metadata: any;
    };
    static createSystemMessage(content: any, level: string | undefined, metadata: any): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: any;
        content: any;
        level: string;
        timestamp: number;
        metadata: any;
    };
}

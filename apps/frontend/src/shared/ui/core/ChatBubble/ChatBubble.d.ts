export declare const chatBubbleVariants: (props?: ({
    align?: "end" | "start" | null | undefined;
    size?: "default" | "sm" | "lg" | "full" | null | undefined;
} & import("class-variance-authority/dist/types").ClassProp) | undefined) => string;
export declare function ChatBubble({ message, type, index, className, align, size, editable, onMessageChange, onMessageRemove, showAuthor, authorLabel, actions, timestamp, status, }: {
    message: any;
    type: any;
    index: any;
    className: any;
    align: any;
    size?: string | undefined;
    editable?: boolean | undefined;
    onMessageChange: any;
    onMessageRemove: any;
    showAuthor?: boolean | undefined;
    authorLabel: any;
    actions: any;
    timestamp: any;
    status: any;
}): import("react/jsx-runtime").JSX.Element;

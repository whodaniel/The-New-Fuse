import React from 'react';
import type { ChatBubbleProps } from './types.js';
export declare const chatBubbleVariants: (props?: ({
    align?: "end" | "start" | null | undefined;
    size?: "default" | "sm" | "lg" | "full" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export declare function ChatBubble({ message, type, index, className, align, size, editable, onMessageChange, onMessageRemove, showAuthor, authorLabel, actions, timestamp, status, }: ChatBubbleProps): React.JSX.Element;

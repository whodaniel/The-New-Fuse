import { VariantProps } from 'class-variance-authority';
import { chatBubbleVariants } from './ChatBubble.js';
export type MessageType = 'user' | 'assistant' | 'system' | 'error';
export interface ChatBubbleProps extends VariantProps<typeof chatBubbleVariants> {
    message: string;
    type: MessageType;
    index?: number;
    className?: string;
    editable?: boolean;
    onMessageChange?: (index: number, type: MessageType, message: string) => void;
    onMessageRemove?: (index: number) => void;
    showAuthor?: boolean;
    authorLabel?: string;
    actions?: React.ReactNode;
    timestamp?: string | Date;
    status?: 'sending' | 'sent' | 'error' | 'edited';
}

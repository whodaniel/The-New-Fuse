import React, { useState, useRef, useEffect } from 'react';
import { cva } from 'class-variance-authority';
import { X, Check, Clock, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '../Button.js';
import { Input } from '../Input.js';
export const chatBubbleVariants = cva('relative flex w-full mt-2 items-start group', {
    variants: {
        align: {
            start: 'justify-start',
            end: 'justify-end',
        },
        size: {
            sm: 'max-w-[240px]',
            default: 'max-w-[290px]',
            lg: 'max-w-[340px]',
            full: 'max-w-full',
        },
    },
    defaultVariants: {
        align: 'start',
        size: 'default',
    },
});
const messageVariants = cva('p-3 rounded-lg break-words transition-colors', {
    variants: {
        variant: {
            user: 'bg-primary text-primary-foreground',
            assistant: 'bg-muted text-muted-foreground',
            system: 'bg-secondary text-secondary-foreground',
            error: 'bg-destructive text-destructive-foreground',
        },
        size: {
            sm: 'text-sm',
            default: 'text-base',
            lg: 'text-lg',
        },
    },
    defaultVariants: {
        variant: 'assistant',
        size: 'default',
    },
});
const statusIcons = {
    sending: <Clock className="h-3 w-3" data-testid="status-icon"/>,
    sent: <Check className="h-3 w-3" data-testid="status-icon"/>,
    error: <X className="h-3 w-3 text-destructive" data-testid="status-icon"/>,
    edited: <Pencil className="h-3 w-3" data-testid="status-icon"/>,
};
export function ChatBubble({ message, type, index, className, align, size = 'default', editable = false, onMessageChange, onMessageRemove, showAuthor = true, authorLabel, actions, timestamp, status, }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempMessage, setTempMessage] = useState(message);
    const inputRef = useRef(null);
    const { t } = useTranslation();
    const isUser = type === 'user';
    const defaultAlign = isUser ? 'end' : 'start';
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);
    const handleDoubleClick = () => {
        if (editable) {
            setIsEditing(true);
        }
    };
    const handleBlur = () => {
        if (onMessageChange && index !== undefined) {
            onMessageChange(index, type, tempMessage);
        }
        setIsEditing(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
        else if (e.key === 'Escape') {
            setTempMessage(message);
            setIsEditing(false);
        }
    };
    const handleRemove = () => {
        if (onMessageRemove && index !== undefined) {
            onMessageRemove(index);
        }
    };
    return (<div className={cn(chatBubbleVariants({ align: align || defaultAlign, size }), className)}>
      <div className="space-y-1">
        {showAuthor && (<div className="text-xs text-muted-foreground">
            {authorLabel || t(`common.${type}`)}
          </div>)}
        <div className="flex items-start gap-2">
          <div className={cn(messageVariants({
            variant: type,
            size,
        }))} onDoubleClick={handleDoubleClick}>
            {isEditing ? (<Input ref={inputRef} value={tempMessage} onChange={(e) => setTempMessage(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className="min-w-[200px]"/>) : (<div className="flex items-center gap-2">
                <span>{message}</span>
                {status && (<span className="ml-2 inline-flex items-center">
                    {statusIcons[status]}
                  </span>)}
              </div>)}
          </div>
          {onMessageRemove && !isEditing && (<Button variant="ghost" size="sm" onClick={handleRemove} className="opacity-0 group-hover:opacity-100" aria-label="remove">
              <X className="h-4 w-4"/>
            </Button>)}
          {actions}
        </div>
        {timestamp && (<div className="text-xs text-muted-foreground">
            {typeof timestamp === 'string'
                ? timestamp
                : format(timestamp, 'HH:mm')}
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=ChatBubble.js.map
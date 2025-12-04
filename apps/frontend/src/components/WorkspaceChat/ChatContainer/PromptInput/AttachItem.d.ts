import React from 'react';
interface AttachItemProps {
    id: string;
    name: string;
    size: number;
    type: string;
    onRemove?: (id: string) => void;
    className?: string;
}
declare const AttachItem: React.FC<AttachItemProps>;
export default AttachItem;

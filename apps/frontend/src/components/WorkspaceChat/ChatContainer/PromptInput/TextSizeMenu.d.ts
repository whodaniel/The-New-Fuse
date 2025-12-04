import React from 'react';
interface TextSizeMenuProps {
    fontSize?: number;
    onFontSizeChange?: (size: number) => void;
    className?: string;
}
declare const TextSizeMenu: React.FC<TextSizeMenuProps>;
export default TextSizeMenu;

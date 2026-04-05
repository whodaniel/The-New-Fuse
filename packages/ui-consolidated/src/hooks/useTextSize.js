import { useState, useEffect } from 'react';
const TEXT_SIZE_KEY = 'chat_text_size';
const DEFAULT_SIZE = 'md';
const sizeToClassMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
};
export default function useTextSize() {
    const [textSize, setInternalTextSize] = useState(() => {
        if (typeof window === 'undefined')
            return DEFAULT_SIZE;
        return localStorage.getItem(TEXT_SIZE_KEY) || DEFAULT_SIZE;
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TEXT_SIZE_KEY, textSize);
        }
    }, [textSize]);
    const setTextSize = (size) => {
        setInternalTextSize(size);
    };
    return {
        textSize,
        textSizeClass: sizeToClassMap[textSize],
        setTextSize
    };
}

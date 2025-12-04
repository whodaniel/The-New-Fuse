import { useState, useEffect } from 'react';
var TEXT_SIZE_KEY = 'chat_text_size';
var DEFAULT_SIZE = 'md';
var sizeToClassMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
};
export default function useTextSize() {
    var _a = useState(function () {
        if (typeof window === 'undefined')
            return DEFAULT_SIZE;
        return localStorage.getItem(TEXT_SIZE_KEY) || DEFAULT_SIZE;
    }), textSize = _a[0], setInternalTextSize = _a[1];
    useEffect(function () {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TEXT_SIZE_KEY, textSize);
        }
    }, [textSize]);
    var setTextSize = function (size) {
        setInternalTextSize(size);
    };
    return {
        textSize: textSize,
        textSizeClass: sizeToClassMap[textSize],
        setTextSize: setTextSize
    };
}

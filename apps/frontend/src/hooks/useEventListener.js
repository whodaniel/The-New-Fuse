import { useEffect, useRef } from 'react';
export function useEventListener(eventType, handler, element) {
    if (element === void 0) { element = window; }
    var savedHandler = useRef(handler);
    useEffect(function () {
        savedHandler.current = handler;
    }, [handler]);
    useEffect(function () {
        var isSupported = element && element.addEventListener;
        if (!isSupported)
            return;
        var eventListener = function (event) {
            savedHandler.current(event);
        };
        element.addEventListener(eventType, eventListener);
        return function () {
            element.removeEventListener(eventType, eventListener);
        };
    }, [eventType, element]);
}

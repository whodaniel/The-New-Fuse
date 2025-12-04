import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useA11y } from './A11yProvider';
export var KeyboardNavigation = function () {
    var screenReader = useA11y().screenReader;
    var shortcuts = [
        {
            key: '/',
            description: 'Focus search',
            action: function () { var _a; return (_a = document.querySelector('#search-input')) === null || _a === void 0 ? void 0 : _a.focus(); },
        },
        {
            key: 'Escape',
            description: 'Close modal or clear selection',
            action: function () { return document.dispatchEvent(new CustomEvent('app:escape')); },
        },
        {
            key: 'j',
            description: 'Next item',
            action: function () { return document.dispatchEvent(new CustomEvent('navigation:next')); },
        },
        {
            key: 'k',
            description: 'Previous item',
            action: function () { return document.dispatchEvent(new CustomEvent('navigation:previous')); },
        },
    ];
    useEffect(function () {
        var handleKeyDown = function (event) {
            var shortcut = shortcuts.find(function (s) { return s.key === event.key; });
            if (shortcut) {
                event.preventDefault();
                shortcut.action();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return function () { return window.removeEventListener('keydown', handleKeyDown); };
    }, []);
    if (!screenReader)
        return null;
    return (_jsx("div", { className: "keyboard-shortcuts", role: "region", "aria-label": "Keyboard shortcuts", children: _jsx("ul", { children: shortcuts.map(function (_a) {
                var key = _a.key, description = _a.description;
                return (_jsxs("li", { children: [_jsx("kbd", { children: key }), _jsx("span", { children: description })] }, key));
            }) }) }));
};

import { jsx as _jsx } from "react/jsx-runtime";
import { Modal } from '@the-new-fuse/ui-consolidated';
/**
 * ModalWrapper component that wraps the consolidated Modal component
 * This maintains backward compatibility with the old ModalWrapper API
 */
export function ModalWrapper(_a) {
    var children = _a.children, isOpen = _a.isOpen, _b = _a.noPortal, noPortal = _b === void 0 ? false : _b;
    if (!isOpen)
        return null;
    // For noPortal=true, we render a simple div with the children
    // This maintains backward compatibility with the old ModalWrapper
    if (noPortal) {
        return (_jsx("div", { className: "bg-black/60 backdrop-blur-sm fixed top-0 left-0 outline-none w-screen h-screen flex items-center justify-center z-99", children: children }));
    }
    // For normal modal rendering, use the consolidated Modal component
    return (_jsx(Modal, { isOpen: isOpen, onClose: function () { }, size: "fullscreen", position: "default", className: "bg-transparent p-0 border-0 shadow-none", children: _jsx("div", { className: "flex items-center justify-center w-full h-full", children: children }) }));
}

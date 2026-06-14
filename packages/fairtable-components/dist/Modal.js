import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { XMarkIcon } from './Icons';
const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    if (!isOpen)
        return null;
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: `bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`, children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-slate-200", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-700", children: title }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 transition-colors", "aria-label": "Close modal", children: _jsx(XMarkIcon, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "p-6 overflow-y-auto flex-grow custom-scrollbar", children: children }), footer && (_jsx("div", { className: "p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg", children: footer }))] }) }));
};
export default Modal;
//# sourceMappingURL=Modal.js.map
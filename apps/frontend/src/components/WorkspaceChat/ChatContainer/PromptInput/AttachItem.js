import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, FileText, Image, File } from 'lucide-react';
import { cn } from '@/lib/utils';
var AttachItem = function (_a) {
    var id = _a.id, name = _a.name, size = _a.size, type = _a.type, onRemove = _a.onRemove, className = _a.className;
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    var getFileIcon = function () {
        if (type.startsWith('image/')) {
            return _jsx(Image, { className: "w-4 h-4" });
        }
        if (type === 'application/pdf') {
            return _jsx(FileText, { className: "w-4 h-4" });
        }
        return _jsx(File, { className: "w-4 h-4" });
    };
    return (_jsxs("div", { className: cn("flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200", className), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-slate-100 rounded", children: getFileIcon() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-900 truncate max-w-48", children: name }), _jsxs("p", { className: "text-xs text-slate-500", children: [formatFileSize(size), " \u2022 ", type] })] })] }), _jsx("button", { onClick: function () { return onRemove === null || onRemove === void 0 ? void 0 : onRemove(id); }, className: "p-1.5 hover:bg-slate-200 rounded-md transition-colors", title: "Remove attachment", children: _jsx(X, { className: "w-4 h-4" }) })] }));
};
export default AttachItem;

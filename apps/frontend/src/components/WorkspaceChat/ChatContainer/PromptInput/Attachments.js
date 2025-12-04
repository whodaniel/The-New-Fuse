var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
var Attachments = function (_a) {
    var _b = _a.attachments, attachments = _b === void 0 ? [] : _b, onAttachmentsChange = _a.onAttachmentsChange, _c = _a.maxSize, maxSize = _c === void 0 ? 10 : _c, _d = _a.acceptedTypes, acceptedTypes = _d === void 0 ? ['image/*', 'text/*', 'application/pdf'] : _d, className = _a.className;
    var _e = useState(false), isDragging = _e[0], setIsDragging = _e[1];
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    var handleFileSelect = function (files) {
        if (!files)
            return;
        var newAttachments = Array.from(files)
            .filter(function (file) {
            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
                alert("File ".concat(file.name, " is too large. Maximum size is ").concat(maxSize, "MB"));
                return false;
            }
            // Check file type
            var accepted = acceptedTypes.some(function (type) {
                if (type.endsWith('/*')) {
                    return file.type.startsWith(type.slice(0, -1));
                }
                return file.type === type;
            });
            if (!accepted) {
                alert("File type ".concat(file.type, " is not supported"));
                return false;
            }
            return true;
        })
            .map(function (file) { return ({
            id: Math.random().toString(36).substring(2, 15),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        }); });
        if (onAttachmentsChange) {
            onAttachmentsChange(__spreadArray(__spreadArray([], attachments, true), newAttachments, true));
        }
    };
    var removeAttachment = function (id) {
        if (onAttachmentsChange) {
            onAttachmentsChange(attachments.filter(function (att) { return att.id !== id; }));
        }
    };
    var handleDrop = function (e) {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };
    var handleDragOver = function (e) {
        e.preventDefault();
        setIsDragging(true);
    };
    var handleDragLeave = function (e) {
        e.preventDefault();
        setIsDragging(false);
    };
    return (_jsxs("div", { className: cn("relative", className), children: [_jsx("input", { type: "file", multiple: true, accept: acceptedTypes.join(','), onChange: function (e) { return handleFileSelect(e.target.files); }, className: "hidden", id: "file-upload" }), _jsxs("label", { htmlFor: "file-upload", className: cn("flex items-center gap-2 px-3 py-2 text-sm cursor-pointer", "bg-slate-100 hover:bg-slate-200 rounded-md transition-colors", isDragging && "bg-blue-100 border-2 border-dashed border-blue-300"), onDrop: handleDrop, onDragOver: handleDragOver, onDragLeave: handleDragLeave, children: [_jsx(Paperclip, { className: "w-4 h-4" }), _jsx("span", { children: "Attach" })] }), attachments.length > 0 && (_jsx("div", { className: "mt-2 space-y-2", children: attachments.map(function (attachment) { return (_jsxs("div", { className: "flex items-center justify-between p-2 bg-slate-50 rounded-md", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Paperclip, { className: "w-4 h-4 text-slate-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: attachment.name }), _jsx("p", { className: "text-xs text-slate-500", children: formatFileSize(attachment.size) })] })] }), _jsx("button", { onClick: function () { return removeAttachment(attachment.id); }, className: "p-1 hover:bg-slate-200 rounded transition-colors", title: "Remove attachment", children: _jsx(X, { className: "w-4 h-4" }) })] }, attachment.id)); }) }))] }));
};
export default Attachments;

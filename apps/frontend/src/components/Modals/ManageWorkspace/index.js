import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Upload, FileText, Link } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
export function useManageWorkspaceModal() {
    var _a = useState(false), showing = _a[0], setShowing = _a[1];
    var showModal = function () { return setShowing(true); };
    var hideModal = function () { return setShowing(false); };
    return {
        showing: showing,
        showModal: showModal,
        hideModal: hideModal,
    };
}
export default function ManageWorkspace(_a) {
    var hideModal = _a.hideModal;
    return (_jsx(Dialog, { open: true, onOpenChange: hideModal, children: _jsxs(DialogContent, { className: "max-w-4xl", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Manage Workspace Documents" }) }), _jsxs(Tabs, { defaultValue: "upload", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsxs(TabsTrigger, { value: "upload", children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Upload Files"] }), _jsxs(TabsTrigger, { value: "link", children: [_jsx(Link, { className: "mr-2 h-4 w-4" }), "Add Link"] }), _jsxs(TabsTrigger, { value: "text", children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), "Add Text"] })] }), _jsx(TabsContent, { value: "upload", children: _jsx("div", { className: "space-y-4 p-4", children: _jsx("div", { className: "flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted", children: _jsxs("div", { className: "text-center", children: [_jsx(Upload, { className: "mx-auto mb-4 h-12 w-12 text-muted-foreground" }), _jsx("p", { className: "mb-2 text-muted-foreground", children: "Drop files here or click to browse" }), _jsx("p", { className: "text-sm text-muted-foreground/80", children: "Supports PDF, DOC, TXT, and other text formats" }), _jsx(Input, { type: "file", multiple: true, accept: ".pdf,.doc,.docx,.txt,.md", className: "hidden", id: "file-upload", onChange: function (e) {
                                                    // Handle file upload
                                                    console.log('Files selected:', e.target.files);
                                                } }), _jsx(Button, { asChild: true, className: "mt-4", children: _jsx("label", { htmlFor: "file-upload", children: "Select Files" }) })] }) }) }) }), _jsx(TabsContent, { value: "link", children: _jsxs("div", { className: "space-y-4 p-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium", children: "URL" }), _jsx(Input, { type: "url", placeholder: "https://example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium", children: "Title (optional)" }), _jsx(Input, { type: "text", placeholder: "Document title" })] }), _jsx(Button, { children: "Add Link" })] }) }), _jsx(TabsContent, { value: "text", children: _jsxs("div", { className: "space-y-4 p-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium", children: "Title" }), _jsx(Input, { type: "text", placeholder: "Document title" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium", children: "Content" }), _jsx(Textarea, { rows: 10, placeholder: "Enter your text content here...", className: "resize-none" })] }), _jsx(Button, { children: "Add Text" })] }) })] }), _jsx(DialogFooter, { children: _jsx(Button, { variant: "ghost", onClick: hideModal, children: "Close" }) })] }) }));
}

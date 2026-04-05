import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ExportButton } from './ExportButton';
const initialConversation = `User: Hello!\nAssistant: Hi, how can I help you today?\nUser: Please export this conversation to PDF.\nAssistant: Sure!`;
export const ConversationExportDemo = () => {
    const [conversation, setConversation] = useState(initialConversation);
    return (_jsxs("div", { className: "max-w-xl mx-auto p-4 bg-card rounded shadow", children: [_jsx("h2", { className: "text-lg font-semibold mb-2", children: "Conversation Export Demo" }), _jsx("textarea", { className: "w-full h-32 p-2 border rounded mb-4 text-sm", value: conversation, onChange: e => setConversation(e.target.value), "aria-label": "Conversation text" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(ExportButton, { conversation: conversation, format: "pdf", buttonLabel: "Export to PDF" }), _jsx(ExportButton, { conversation: conversation, format: "md", buttonLabel: "Export as Markdown" }), _jsx(ExportButton, { conversation: conversation, format: "txt", buttonLabel: "Export as Text" })] })] }));
};

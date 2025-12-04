import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatModelSelection from './ChatModelSelection';
export default function WorkspaceLLMSelectionPage() {
    var workspaceId = useParams().workspaceId;
    var _a = useState(false), hasChanges = _a[0], setHasChanges = _a[1];
    // Mock workspace data - in a real app, this would come from context or API
    var workspace = {
        chatModel: 'gpt-4',
    };
    // Default provider - in a real app, this might come from URL params or context
    var provider = 'openai';
    return (_jsx("div", { className: "container mx-auto px-4 py-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Chat Model Selection" }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx(ChatModelSelection, { provider: provider, workspace: workspace, setHasChanges: setHasChanges }), hasChanges && (_jsx("div", { className: "mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md", children: _jsx("p", { className: "text-yellow-800", children: "You have unsaved changes." }) }))] })] }) }));
}

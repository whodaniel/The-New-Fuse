"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unknown = exports.AgentWorkspace = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import split_1 from '@/components/ui/split';
import chat_1 from '@/components/ui/chat';
import canvas_1 from '@/components/ui/canvas';
 > ;
() => {
    const [activeAgents, setActiveAgents] = useState([]);
    const [workspaceData, setWorkspaceData] = useState({});
    return ((0, jsx_runtime_1.jsxs)(split_1.Split, { children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3/4", children: (0, jsx_runtime_1.jsx)(canvas_1.Canvas, { agents: activeAgents, onAgentInteraction: (agentId, data) => {
                        // Handle agent interactions
                    }, tools: [
                        'flowchart',
                        'codeEditor',
                        'whiteboard',
                        'documentViewer'
                    ] }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-1/4", children: (0, jsx_runtime_1.jsx)(chat_1.Chat, { participants: activeAgents, threadId: workspaceData.threadId, enableVoice: true, enableVideo: true }) })] }));
};
//# sourceMappingURL=AgentWorkspace.js.map
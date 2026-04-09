"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unknown = exports.SharedWorkspace = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import useCollaboration_1 from '@/hooks/useCollaboration';
import PresenceIndicator_1 from '@the-new-fuse/PresenceIndicator';
import CollaborativeEditor_1 from '@the-new-fuse/CollaborativeEditor';
 > ;
() => {
    const { activeUsers, workspace, sync } = (0, useCollaboration_1.useCollaboration)();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "shared-workspace", children: [(0, jsx_runtime_1.jsxs)("div", { className: "workspace-header", children: [(0, jsx_runtime_1.jsx)("h2", { children: workspace.name }), (0, jsx_runtime_1.jsx)("div", { className: "active-users", children: activeUsers.map(user => ((0, jsx_runtime_1.jsx)(PresenceIndicator_1.PresenceIndicator, { user: user }, user.id))) })] }), (0, jsx_runtime_1.jsx)(CollaborativeEditor_1.CollaborativeEditor, { content: workspace.content, onUpdate: sync })] }));
};
//# sourceMappingURL=SharedWorkspace.js.map
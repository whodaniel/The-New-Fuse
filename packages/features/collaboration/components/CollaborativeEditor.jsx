"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborativeEditor = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import useYjs_1 from '@/hooks/useYjs';
import editor_1 from '@/components/ui/editor';
const CollaborativeEditor = ({ content, onUpdate }) => {
    const { awareness, document } = (0, useYjs_1.useYjs)();
    return ((0, jsx_runtime_1.jsx)(editor_1.Editor, { value: content, onChange: onUpdate, awareness: awareness, collaborative: true, cursors: true, presence: true }));
};
exports.CollaborativeEditor = CollaborativeEditor;
//# sourceMappingURL=CollaborativeEditor.js.map
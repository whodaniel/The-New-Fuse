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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceManager = void 0;
import react_1 from 'react';
import Card_1 from '../../../core/Card';
import Button_1 from '../../../core/Button';
import Input_1 from '../../../core/Input';
var WorkspaceManager = function () {
    var _a = react_1.default.useState([]), workspaces = _a[0], setWorkspaces = _a[1];
    var _b = react_1.default.useState(false), showCreateForm = _b[0], setShowCreateForm = _b[1];
    var _c = react_1.default.useState({
        name: '',
        description: '',
    }), newWorkspace = _c[0], setNewWorkspace = _c[1];
    var handleCreateWorkspace = function () {
        if (!newWorkspace.name.trim())
            return;
        var workspace = {
            id: Date.now().toString(),
            name: newWorkspace.name,
            description: newWorkspace.description,
            agentCount: 0,
            lastActive: new Date(),
        };
        setWorkspaces(function (prev) { return __spreadArray(__spreadArray([], prev, true), [workspace], false); });
        setNewWorkspace({ name: '', description: '' });
        setShowCreateForm(false);
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Workspaces" }), _jsx(Button_1.Button, { onClick: function () { return setShowCreateForm(true); }, children: "Create Workspace" })] }), showCreateForm && (_jsxs(Card_1.Card, { children: [_jsx(Card_1.CardHeader, { children: _jsx(Card_1.CardTitle, { children: "Create New Workspace" }) }), _jsxs(Card_1.CardContent, { className: "space-y-4", children: [_jsx("div", { children: _jsx(Input_1.Input, { placeholder: "Workspace Name", value: newWorkspace.name, onChange: function (e) { return setNewWorkspace(function (prev) { return (Object.assign(Object.assign({}, prev), { name: e.target.value })); }); } }) }), _jsx("div", { children: _jsx(Input_1.Input, { placeholder: "Description", value: newWorkspace.description, onChange: function (e) { return setNewWorkspace(function (prev) { return (Object.assign(Object.assign({}, prev), { description: e.target.value })); }); } }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button_1.Button, { onClick: handleCreateWorkspace, children: "Create" }), _jsx(Button_1.Button, { variant: "outline", onClick: function () { return setShowCreateForm(false); }, children: "Cancel" })] })] })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: workspaces.map(function (workspace) { return (_jsxs(Card_1.Card, { children: [_jsx(Card_1.CardHeader, { children: _jsx(Card_1.CardTitle, { children: workspace.name }) }), _jsxs(Card_1.CardContent, { children: [_jsx("p", { className: "text-sm text-gray-500", children: workspace.description }), _jsxs("div", { className: "mt-4 space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Agents:" }), _jsx("span", { children: workspace.agentCount })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Last Active:" }), _jsx("span", { children: workspace.lastActive.toLocaleDateString() })] })] })] })] }, workspace.id)); }) })] }));
};
exports.WorkspaceManager = WorkspaceManager;
exports.default = exports.WorkspaceManager;

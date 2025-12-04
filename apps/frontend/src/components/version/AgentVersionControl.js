import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Timeline } from '@/components/ui/timeline';
import { DiffViewer } from '@/components/ui/diff';
export var AgentVersionControl = function () {
    var _a = useState(null), selectedVersion = _a[0], setSelectedVersion = _a[1];
    var _b = useVersionHistory(), versions = _b.versions, diffs = _b.diffs;
    return (_jsxs("div", { className: "flex h-full", children: [_jsxs("div", { className: "w-1/3 border-r", children: [_jsx(Timeline, { items: versions, onSelect: setSelectedVersion, branches: ['main', 'staging', 'experimental'] }), _jsx(Button, { className: "mt-4", onClick: function () { }, children: "Create Version" })] }), _jsx("div", { className: "w-2/3 p-4", children: selectedVersion && (_jsxs(_Fragment, { children: [_jsx(DiffViewer, { original: diffs.original, modified: diffs.modified, components: [
                                'knowledge_base',
                                'behavior_rules',
                                'model_weights',
                                'configuration'
                            ] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx(Button, { onClick: function () { }, children: "Rollback to Version" }), _jsx(Button, { onClick: function () { }, children: "Create Branch" })] })] })) })] }));
};

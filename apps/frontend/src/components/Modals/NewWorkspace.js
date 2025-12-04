import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export var useNewWorkspaceModal = function () {
    var _a = useState(false), showing = _a[0], setShowing = _a[1];
    var showModal = function () { return setShowing(true); };
    var hideModal = function () { return setShowing(false); };
    return { showing: showing, showModal: showModal, hideModal: hideModal };
};
var NewWorkspaceModal = function (_a) {
    var hideModal = _a.hideModal;
    return (_jsxs("div", { className: "new-workspace-modal", children: [_jsx("h1", { children: "New Workspace Modal" }), _jsx("p", { children: "This is a placeholder component." }), _jsx("button", { onClick: hideModal, children: "Close" })] }));
};
export default NewWorkspaceModal;

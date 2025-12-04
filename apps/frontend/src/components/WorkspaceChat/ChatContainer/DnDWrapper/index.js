import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useState } from 'react';
export var CLEAR_ATTACHMENTS_EVENT = 'clearAttachments';
export var PASTE_ATTACHMENT_EVENT = 'pasteAttachment';
export var DndUploaderContext = createContext({
    files: [],
    parseAttachments: function () { }
});
export default function DnDFileUploaderWrapper(_a) {
    var children = _a.children;
    var _b = useState([]), files = _b[0], setFiles = _b[1];
    var parseAttachments = function (newFiles) {
        setFiles(newFiles);
    };
    var contextValue = {
        files: files,
        parseAttachments: parseAttachments
    };
    return (_jsx(DndUploaderContext.Provider, { value: contextValue, children: children }));
}
export { DnDFileUploaderWrapper };

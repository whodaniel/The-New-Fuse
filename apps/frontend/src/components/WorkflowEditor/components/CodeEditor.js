import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
export var CodeEditor = function (_a) {
    var value = _a.value, onChange = _a.onChange, _b = _a.language, language = _b === void 0 ? 'json' : _b, _c = _a.height, height = _c === void 0 ? '200px' : _c;
    var _d = useState(''), editorValue = _d[0], setEditorValue = _d[1];
    useEffect(function () {
        try {
            var formattedValue = typeof value === 'string'
                ? value
                : JSON.stringify(value, null, 2);
            setEditorValue(formattedValue);
        }
        catch (e) {
            setEditorValue('');
        }
    }, [value]);
    var handleEditorChange = function (newValue) {
        if (!newValue)
            return;
        setEditorValue(newValue);
        try {
            if (language === 'json') {
                var parsed = JSON.parse(newValue);
                onChange(parsed);
            }
            else {
                onChange(newValue);
            }
        }
        catch (e) {
        }
    };
    return (_jsx("div", { className: "code-editor", children: _jsx(Editor, { height: height, language: language, value: editorValue, onChange: handleEditorChange, options: {
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontSize: 12,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                },
                lineHeight: 19,
                glyphMargin: false,
                folding: true,
                renderLineHighlight: 'line',
                theme: 'vs-light',
            } }) }));
};

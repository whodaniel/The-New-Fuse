import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, VStack, Text, HStack, Button, Tooltip } from '@chakra-ui/react';
import MonacoEditor from '@monaco-editor/react';
import { FaQuestionCircle, FaCode, FaMarkdown } from 'react-icons/fa';
export var PromptEditor = function (_a) {
    var prompt = _a.prompt, onChange = _a.onChange;
    var _b = useState('plain'), editorMode = _b[0], setEditorMode = _b[1];
    var handleEditorChange = function (value) {
        onChange(value || '');
    };
    var getLanguage = function () {
        switch (editorMode) {
            case 'markdown': return 'markdown';
            case 'json': return 'json';
            default: return 'plaintext';
        }
    };
    var getPromptTemplateHelp = function () { return (_jsxs(Box, { p: 3, fontSize: "sm", children: [_jsx(Text, { fontWeight: "bold", mb: 2, children: "Template Variables" }), _jsxs(Text, { children: ["Use ", _jsx("code", { children: '{{variable_name}}' }), " syntax for variables."] }), _jsxs(Text, { mt: 2, children: ["Example: ", _jsxs("code", { children: ["Hello, my name is ", { name: name }, " and I am ", { age: age }, " years old."] })] }), _jsx(Text, { fontWeight: "bold", mt: 4, mb: 2, children: "System Instructions" }), _jsx(Text, { children: "Start with clear system instructions to define assistant behavior:" }), _jsx(Text, { mt: 1, children: _jsx("code", { children: "You are a helpful assistant that provides concise answers." }) }), _jsx(Text, { fontWeight: "bold", mt: 4, mb: 2, children: "Formatting Tips" }), _jsx(Text, { children: "\u2022 Use triple backticks for code blocks" }), _jsx(Text, { children: "\u2022 Use bullet points for lists" }), _jsx(Text, { children: "\u2022 Separate instructions clearly with line breaks" })] })); };
    return (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(HStack, { justifyContent: "space-between", children: [_jsx(Text, { fontSize: "lg", fontWeight: "medium", children: "Prompt Template" }), _jsxs(HStack, { children: [_jsx(Tooltip, { label: "Plain Text", hasArrow: true, children: _jsx(Button, { size: "sm", variant: editorMode === 'plain' ? 'solid' : 'outline', onClick: function () { return setEditorMode('plain'); }, "aria-label": "Plain Text Mode", children: _jsx(Text, { children: "Text" }) }) }), _jsx(Tooltip, { label: "Markdown", hasArrow: true, children: _jsx(Button, { size: "sm", variant: editorMode === 'markdown' ? 'solid' : 'outline', onClick: function () { return setEditorMode('markdown'); }, "aria-label": "Markdown Mode", children: _jsx(FaMarkdown, {}) }) }), _jsx(Tooltip, { label: "JSON", hasArrow: true, children: _jsx(Button, { size: "sm", variant: editorMode === 'json' ? 'solid' : 'outline', onClick: function () { return setEditorMode('json'); }, "aria-label": "JSON Mode", children: _jsx(FaCode, {}) }) }), _jsx(Tooltip, { label: "Prompt Template Help", hasArrow: true, placement: "top", children: _jsx(Button, { size: "sm", variant: "ghost", "aria-label": "Help", children: _jsx(FaQuestionCircle, {}) }) })] })] }), _jsx(Box, { border: "1px", borderColor: "gray.200", borderRadius: "md", h: "60vh", children: _jsx(MonacoEditor, { height: "100%", language: getLanguage(), value: prompt, onChange: handleEditorChange, options: {
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        automaticLayout: true,
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                    } }) })] }));
};

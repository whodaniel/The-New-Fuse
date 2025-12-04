import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAI } from '@/hooks/useAI';
import { CodeSuggestions } from './CodeSuggestions';
import { AutoComplete } from './AutoComplete';
export var AICodeAssistant = function () {
    var _a = useAI(), suggestions = _a.suggestions, completions = _a.completions, context = _a.context;
    return (_jsxs("div", { className: "ai-assistant", children: [_jsx(CodeSuggestions, { suggestions: suggestions, context: context }), _jsx(AutoComplete, { completions: completions, inline: true })] }));
};

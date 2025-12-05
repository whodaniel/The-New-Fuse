var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
var MarkdownRenderer = function (_a) {
    var content = _a.content, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (_jsx("div", { className: "markdown-renderer ".concat(className, " space-y-2"), children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex], components: {
                code: function (_a) {
                    var _node = _a._node, inline = _a.inline, className = _a.className, children = _a.children, props = __rest(_a, ["_node", "inline", "className", "children"]);
                    var match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (_jsx(SyntaxHighlighter, __assign({ style: materialDark, language: match[1], PreTag: "div" }, props, { children: String(children).replace(/\n$/, '') }))) : (_jsx("code", __assign({ className: className }, props, { children: children })));
                },
                p: function (_a) {
                    var children = _a.children;
                    return (_jsx("p", { className: "text-base leading-relaxed", children: children }));
                },
                h1: function (_a) {
                    var children = _a.children;
                    return (_jsx("h1", { className: "text-2xl font-bold mb-4", children: children }));
                },
                h2: function (_a) {
                    var children = _a.children;
                    return (_jsx("h2", { className: "text-xl font-bold mb-3", children: children }));
                },
                h3: function (_a) {
                    var children = _a.children;
                    return (_jsx("h3", { className: "text-lg font-bold mb-2", children: children }));
                },
                a: function (_a) {
                    var href = _a.href, children = _a.children;
                    return (_jsx("a", { href: href, target: "_blank", rel: "noopener noreferrer", className: "text-blue-500 underline", children: children }));
                },
                ul: function (_a) {
                    var children = _a.children;
                    return (_jsx("ul", { className: "pl-4 list-disc", children: children }));
                },
                ol: function (_a) {
                    var children = _a.children;
                    return (_jsx("ol", { className: "pl-4 list-decimal", children: children }));
                },
                blockquote: function (_a) {
                    var children = _a.children;
                    return (_jsx("blockquote", { className: "border-l-4 border-blue-500 pl-3 py-2 my-2 bg-gray-50 rounded-md", children: children }));
                },
                table: function (_a) {
                    var children = _a.children;
                    return (_jsx("table", { className: "w-full border-collapse", children: _jsx("tbody", { children: children }) }));
                },
                th: function (_a) {
                    var children = _a.children;
                    return (_jsx("th", { className: "border border-gray-200 p-2 bg-gray-50 font-bold", children: children }));
                },
                td: function (_a) {
                    var children = _a.children;
                    return (_jsx("td", { className: "border border-gray-200 p-2", children: children }));
                }
            }, children: content }) }));
};
export default MarkdownRenderer;

"use strict";
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
import { jsx as _jsx } from "react/jsx-runtime";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
import react_markdown_1 from 'react-markdown';
import react_syntax_highlighter_1 from 'react-syntax-highlighter';
import prism_1 from 'react-syntax-highlighter/dist/esm/styles/prism';
import remark_gfm_1 from 'remark-gfm';
import remark_math_1 from 'remark-math';
import rehype_katex_1 from 'rehype-katex';
require("katex/dist/katex.min.css");
import { Box } from '@chakra-ui/react';
var MarkdownRenderer = function (_b) {
    var content = _b.content;
    return (_jsx(Box, { style: { '& > *': { mb: 2 } }, children: _jsx(react_markdown_1.default, { remarkPlugins: [remark_gfm_1.default, remark_math_1.default], rehypePlugins: [rehype_katex_1.default], components: {
                code: function (_a) {
                    var node = _a.node, inline = _a.inline, className = _a.className, children = _a.children, props = __rest(_a, ["node", "inline", "className", "children"]);
                    var match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (_jsx(react_syntax_highlighter_1.Prism, __assign({ style: prism_1.materialDark, language: match[1], PreTag: "div" }, props, { children: String(children).replace(/\n$/, '') }))) : (_jsx("code", __assign({ className: className }, props, { children: children })));
                },
                p: function (_b) {
                    var children = _b.children;
                    return (_jsx(Box, { variant: "body1", component: "p", children: children }));
                },
                h1: function (_b) {
                    var children = _b.children;
                    return (_jsx(Box, { variant: "h4", component: "h1", gutterBottom: true, children: children }));
                },
                h2: function (_b) {
                    var children = _b.children;
                    return (_jsx(Box, { variant: "h5", component: "h2", gutterBottom: true, children: children }));
                },
                h3: function (_b) {
                    var children = _b.children;
                    return (_jsx(Box, { variant: "h6", component: "h3", gutterBottom: true, children: children }));
                },
                a: function (_b) {
                    var href = _b.href, children = _b.children;
                    return (_jsx(Box, { href: href, target: "_blank", rel: "noopener noreferrer", children: children }));
                },
                ul: function (_b) {
                    var children = _b.children;
                    return (_jsx(Box, { component: "ul", sx: { pl: 2 }, children: children }));
                },
                ol: function (_b) {
                    var children = _b.children;
                    return (_jsx(Box, { component: "ol", sx: { pl: 2 }, children: children }));
                },
                blockquote: function (_b) {
                    var children = _b.children;
                    return (_jsx(Box, { component: "blockquote", sx: {
                            borderLeft: 4,
                            borderColor: 'primary.main',
                            pl: 2,
                            py: 1,
                            my: 2,
                            bgcolor: 'action.hover',
                            borderRadius: 1
                        }, children: children }));
                },
                table: function (_b) {
                    var children = _b.children;
                    return (_jsx(Box, { component: "table", sx: {
                            width: '100%',
                            borderCollapse: 'collapse',
                            '& th, & td': {
                                border: 1,
                                borderColor: 'divider',
                                p: 1
                            },
                            '& th': {
                                bgcolor: 'action.hover'
                            }
                        }, children: children }));
                }
            }, children: content }) }));
};
exports.default = MarkdownRenderer;

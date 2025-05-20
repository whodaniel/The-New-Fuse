"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_markdown_1 from 'react-markdown';
import react_syntax_highlighter_1 from 'react-syntax-highlighter';
import prism_1 from 'react-syntax-highlighter/dist/esm/styles/prism';
import remark_gfm_1 from 'remark-gfm';
import remark_math_1 from 'remark-math';
import rehype_katex_1 from 'rehype-katex';
require("katex/dist/katex.min.css");
import material_1 from '@mui/material';
const MarkdownRenderer = ({ content }) => {
    return (<material_1.Box sx={{ '& > *': { mb: 2 } }}>
      <react_markdown_1.default remarkPlugins={[remark_gfm_1.default, remark_math_1.default]} rehypePlugins={[rehype_katex_1.default]} components={{
            code(_a) {
                var { node, inline, className, children } = _a, props = __rest(_a, ["node", "inline", "className", "children"]);
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (<react_syntax_highlighter_1.Prism style={prism_1.materialDark} language={match[1]} PreTag="div" {...props}>
                {String(children).replace(/\n$/, '')}
              </react_syntax_highlighter_1.Prism>) : (<code className={className} {...props}>
                {children}
              </code>);
            },
            p: ({ children }) => (<material_1.Typography variant="body1" component="p">
              {children}
            </material_1.Typography>),
            h1: ({ children }) => (<material_1.Typography variant="h4" component="h1" gutterBottom>
              {children}
            </material_1.Typography>),
            h2: ({ children }) => (<material_1.Typography variant="h5" component="h2" gutterBottom>
              {children}
            </material_1.Typography>),
            h3: ({ children }) => (<material_1.Typography variant="h6" component="h3" gutterBottom>
              {children}
            </material_1.Typography>),
            a: ({ href, children }) => (<material_1.Link href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </material_1.Link>),
            ul: ({ children }) => (<material_1.Box component="ul" sx={{ pl: 2 }}>
              {children}
            </material_1.Box>),
            ol: ({ children }) => (<material_1.Box component="ol" sx={{ pl: 2 }}>
              {children}
            </material_1.Box>),
            blockquote: ({ children }) => (<material_1.Box component="blockquote" sx={{
                    borderLeft: 4,
                    borderColor: 'primary.main',
                    pl: 2,
                    py: 1,
                    my: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1
                }}>
              {children}
            </material_1.Box>),
            table: ({ children }) => (<material_1.Box component="table" sx={{
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
                }}>
              {children}
            </material_1.Box>)
        }}>
        {content}
      </react_markdown_1.default>
    </material_1.Box>);
};
exports.default = MarkdownRenderer;
export {};
//# sourceMappingURL=MarkdownRenderer.js.map
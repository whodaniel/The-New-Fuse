import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import Options from './components/Options.js';
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(_jsx(React.StrictMode, { children: _jsx(Options, {}) }));
}
//# sourceMappingURL=options.js.map
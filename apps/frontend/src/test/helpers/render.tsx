import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider } from '@/shared/providers/theme/ThemeProvider';
function render(ui, options = {}): any {
    return rtlRender(ui, Object.assign({ wrapper: ({ children }) => (<ThemeProvider defaultTheme="light" storageKey="test-theme">
        {children}
      </ThemeProvider>) }, options));
}
export * from '@testing-library/react';
export { render };
//# sourceMappingURL=render.js.map
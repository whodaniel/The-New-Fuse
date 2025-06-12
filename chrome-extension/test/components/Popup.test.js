import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import Popup from '../../popup/components/Popup.js';
describe('Popup Component', () => {
    it('renders the header with title', () => {
        render(_jsx(Popup, {}));
        expect(screen.getByText('The New Fuse')).toBeInTheDocument();
    });
    it('renders the message input area', () => {
        render(_jsx(Popup, {}));
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });
});
//# sourceMappingURL=Popup.test.js.map
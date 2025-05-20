export {}
require("@testing-library/jest-dom");
import react_1 from '@testing-library/react';
import server_1 from './__mocks__/server.js';
(0, react_1.configure)({ testIdAttribute: 'data-testid' });
beforeAll(() => server_1.server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server_1.server.resetHandlers());
afterAll(() => server_1.server.close());
export {};
//# sourceMappingURL=setupTests.js.map
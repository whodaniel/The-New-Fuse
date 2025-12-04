import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';
describe('Card Snapshots', function () {
    it('renders basic card correctly', function () {
        assertSnapshot(_jsx(Card, { children: _jsx(CardContent, { children: "Basic Card Content" }) }));
    });
    it('renders full featured card correctly', function () {
        assertSnapshot(_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Card Title" }), _jsx(CardDescription, { children: "This is a card description" })] }), _jsx(CardContent, { children: _jsx("p", { children: "Some content goes here" }) }), _jsx(CardFooter, { children: _jsx("p", { children: "Footer content" }) })] }));
    });
    it('renders card variants correctly', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Card, { variant: "default", children: "Default Variant" }), _jsx(Card, { variant: "ghost", children: "Ghost Variant" }), _jsx(Card, { variant: "outline", children: "Outline Variant" }), _jsx(Card, { variant: "elevated", children: "Elevated Variant" })] }));
    });
    it('renders different sizes correctly', function () {
        assertSnapshot(_jsxs(_Fragment, { children: [_jsx(Card, { size: "sm", children: "Small Card" }), _jsx(Card, { size: "default", children: "Default Size Card" }), _jsx(Card, { size: "lg", children: "Large Card" })] }));
    });
    it('renders with custom className', function () {
        assertSnapshot(_jsx(Card, { className: "custom-class", children: _jsx(CardContent, { children: "Custom Class Card" }) }));
    });
});

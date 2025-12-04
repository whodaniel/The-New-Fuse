import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import { useInView } from '@/hooks/useInView';
export var LazyLoader = function (_a) {
    var Component = _a.component, fallback = _a.fallback;
    var _b = useInView(), ref = _b[0], inView = _b[1];
    return (_jsx("div", { ref: ref, children: inView && (_jsx(Suspense, { fallback: fallback, children: _jsx(Component, {}) })) }));
};

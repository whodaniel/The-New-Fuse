import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/utils/cn';
export function Avatar(_a) {
    var className = _a.className, children = _a.children;
    return (_jsx("div", { className: cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className), children: children }));
}
export function AvatarImage(_a) {
    var src = _a.src, alt = _a.alt, className = _a.className;
    return (_jsx("img", { src: src, alt: alt, className: cn('aspect-square h-full w-full', className) }));
}
export function AvatarFallback(_a) {
    var className = _a.className, children = _a.children;
    return (_jsx("div", { className: cn('flex h-full w-full items-center justify-center rounded-full bg-gray-100', className), children: children }));
}

import { jsx as _jsx } from "react/jsx-runtime";
import { MotionConfig } from 'framer-motion';
export var MotionProvider = function (_a) {
    var children = _a.children;
    return (_jsx(MotionConfig, { reducedMotion: "user", children: children }));
};

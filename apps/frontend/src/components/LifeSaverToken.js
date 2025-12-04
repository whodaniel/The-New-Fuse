"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifeSaverToken = LifeSaverToken;
exports.LifeSaverTokenContainer = LifeSaverTokenContainer;
import react_1 from 'react';
import framer_motion_1 from 'framer-motion';
function LifeSaverToken(_a) {
    var position = _a.position, onTransfer = _a.onTransfer, _b = _a.color, color = _b === void 0 ? '#FF6B6B' : _b;
    var _c = react_1.default.useState(false), isHovered = _c[0], setIsHovered = _c[1];
    var _d = react_1.default.useState(false), isClicked = _d[0], setIsClicked = _d[1];
    var _e = react_1.default.useState(false), showSuccess = _e[0], setShowSuccess = _e[1];
    var handleClick = function () {
        setIsClicked(true);
        onTransfer();
        setTimeout(function () {
            setShowSuccess(true);
            setTimeout(function () {
                setShowSuccess(false);
                setIsClicked(false);
            }, 1500);
        }, 500);
    };
    return (_jsxs("div", { className: "relative", children: [_jsx(framer_motion_1.motion.div, { className: "lifesaver-token", style: {
                    left: "".concat(10 + (position * 40), "px"),
                }, initial: { scale: 1, rotate: 0 }, animate: {
                    scale: isClicked ? [1.1, 0.8, 0] : isHovered ? 1.1 : 1,
                    rotate: isClicked ? [15, -15, 360] : isHovered ? 15 : 0,
                }, transition: {
                    duration: isClicked ? 0.5 : 0.2,
                    ease: "easeInOut"
                }, onHoverStart: function () { return setIsHovered(true); }, onHoverEnd: function () { return setIsHovered(false); }, onClick: handleClick, children: _jsxs("div", { className: "relative w-8 h-8 group", children: [_jsx("div", { className: "absolute inset-0 rounded-full shadow-lg transition-shadow duration-200 group-hover:shadow-xl", style: { backgroundColor: color } }), _jsx("div", { className: "absolute inset-2 bg-white rounded-full shadow-inner", children: _jsx("div", { className: "absolute inset-1 rounded-full", style: { backgroundColor: color } }) }), _jsx(framer_motion_1.motion.div, { className: "absolute inset-0 rounded-full", initial: { opacity: 0 }, animate: { opacity: isHovered ? 0.5 : 0 }, style: {
                                background: "radial-gradient(circle, ".concat(color, "33 0%, transparent 70%)")
                            } }), _jsx(framer_motion_1.AnimatePresence, { children: isHovered && (_jsx(framer_motion_1.motion.div, { className: "absolute inset-0 rounded-full", initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1.2, opacity: 0.3 }, exit: { opacity: 0 }, transition: { duration: 0.5, repeat: Infinity }, style: { backgroundColor: color } })) })] }) }), _jsx(framer_motion_1.AnimatePresence, { children: showSuccess && (_jsx(framer_motion_1.motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "absolute right-10 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs whitespace-nowrap shadow-lg", children: "Token transferred!" })) })] }));
}
function LifeSaverTokenContainer(_a) {
    var tokens = _a.tokens, onTransfer = _a.onTransfer;
    var colors = [
        '#FF6B6B',
        '#4ECDC4',
        '#FFE66D',
        '#95E1D3',
        '#FF8B94',
        '#A8E6CF',
        '#DCD6F7',
        '#F7D794',
        '#B8E9C0',
        '#F6C6EA'
    ];
    return (_jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t py-2 px-4 flex justify-center", children: _jsx("div", { className: "token-container relative h-8", children: _jsx(framer_motion_1.AnimatePresence, { children: Array.from({ length: tokens }).map(function (_, index) { return (_jsx(framer_motion_1.motion.div, { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 }, transition: { delay: index * 0.1 }, children: _jsx(LifeSaverToken, { position: index, onTransfer: function () { return onTransfer(index); }, color: colors[index % colors.length] }) }, index)); }) }) }) }));
}

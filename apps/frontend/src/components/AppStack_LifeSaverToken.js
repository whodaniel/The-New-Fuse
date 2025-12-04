"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStack_LifeSaverToken = AppStack_LifeSaverToken;
exports.AppStack_LifeSaverTokenContainer = AppStack_LifeSaverTokenContainer;
import react_1 from 'react';
import react_spring_1 from 'react-spring';
function AppStack_LifeSaverToken(_a) {
    var position = _a.position, onTransfer = _a.onTransfer, _b = _a.color, color = _b === void 0 ? '#FF6B6B' : _b;
    var _c = (0, react_1.useState)(false), isHovered = _c[0], setIsHovered = _c[1];
    var _d = (0, react_1.useState)(false), isClicked = _d[0], setIsClicked = _d[1];
    var _e = (0, react_1.useState)(false), showSuccess = _e[0], setShowSuccess = _e[1];
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
    var animationProps = (0, react_spring_1.useSpring)({
        config: { duration: isClicked ? 500 : 200, easing: 'easeInOut' },
        scale: isClicked ? [1.1, 0.8, 1] : isHovered ? 1.1 : 1,
        rotate: isClicked ? [15, -15, 0] : isHovered ? 15 : 0,
    });
    return (_jsxs("div", { className: "relative", children: [_jsx(react_spring_1.animated.div, { className: "lifesaver-token", style: {
                    left: "".concat(10 + (position * 40), "px"),
                    transform: animationProps.transform.interpolate(function (scale, rotate) { return "scale(".concat(scale, ") rotate(").concat(rotate, "deg)"); }),
                }, onPointerEnter: function () { return setIsHovered(true); }, onPointerLeave: function () { return setIsHovered(false); }, onClick: handleClick, children: _jsxs("div", { className: "relative w-8 h-8 group", children: [_jsx("div", { className: "absolute inset-0 rounded-full shadow-lg transition-shadow duration-200 group-hover:shadow-xl", style: { backgroundColor: color } }), _jsx("div", { className: "absolute inset-2 bg-white rounded-full shadow-inner", children: _jsx("div", { className: "absolute inset-1 rounded-full", style: { backgroundColor: color } }) }), _jsx(react_spring_1.animated.div, { className: "absolute inset-0 rounded-full", style: {
                                opacity: animationProps.opacity.interpolate(function (opacity) { return opacity; }),
                                background: "radial-gradient(circle, ".concat(color, "33 0%, transparent 70%)")
                            } }), isHovered && (_jsx(react_spring_1.animated.div, { className: "absolute inset-0 rounded-full", style: {
                                transform: animationProps.transform.interpolate(function (scale) { return "scale(".concat(scale, ")"); }),
                                opacity: animationProps.opacity.interpolate(function (opacity) { return opacity * 0.3; }),
                                backgroundColor: color
                            } }))] }) }), showSuccess && (_jsx("div", { className: "absolute right-10 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs whitespace-nowrap shadow-lg", children: "Token transferred!" }))] }));
}
function AppStack_LifeSaverTokenContainer(_a) {
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
    return (_jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t py-2 px-4 flex justify-center", children: _jsx("div", { className: "token-container relative h-8", children: Array.from({ length: tokens }).map(function (_, index) { return (_jsx(AppStack_LifeSaverToken, { position: index, onTransfer: function () { return onTransfer(index); }, color: colors[index % colors.length] }, index)); }) }) }));
}

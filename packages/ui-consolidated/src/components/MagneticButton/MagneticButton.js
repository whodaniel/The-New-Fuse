import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { cn } from '../../utils';
export const MagneticButton = ({ className, variant = 'primary', children, ...props }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const handleMouseMove = (e) => {
        if (!ref.current)
            return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const x = (clientX - (left + width / 2)) * 0.35;
        const y = (clientY - (top + height / 2)) * 0.35;
        setPosition({ x, y });
    };
    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };
    const variants = {
        primary: 'bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]',
        secondary: 'bg-white/10 text-white border border-white/10 hover:bg-white/20 backdrop-blur-md',
        ghost: 'text-white/70 hover:text-white hover:bg-white/5',
    };
    return (_jsxs(motion.button, { ref: ref, className: cn('relative px-8 py-4 rounded-full font-medium text-sm tracking-wide transition-colors overflow-hidden group', variants[variant], className), onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave, animate: { x: position.x, y: position.y }, transition: { type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }, ...props, children: [_jsx("span", { className: "relative z-10 flex items-center justify-center gap-2", children: children }), variant === 'primary' && (_jsx("div", { className: "absolute inset-0 -z-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" }))] }));
};

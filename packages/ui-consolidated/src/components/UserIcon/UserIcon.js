import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const User = (props) => (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props, children: [_jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] }));
const Robot = (props) => (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props, children: [_jsx("rect", { x: "3", y: "11", width: "18", height: "10", rx: "2" }), _jsx("circle", { cx: "12", cy: "5", r: "2" }), _jsx("path", { d: "M12 7v4" }), _jsx("line", { x1: "8", y1: "16", x2: "8", y2: "16" }), _jsx("line", { x1: "16", y1: "16", x2: "16", y2: "16" })] }));
export default function UserIcon({ user, role = "user", className = "" }) {
    if (role === "assistant") {
        return (_jsx("div", { className: `w-[35px] h-[35px] flex-shrink-0 ${className}`, children: _jsx(Robot, { className: "w-full h-full text-white", weight: "fill" }) }));
    }
    if (user?.profileImage) {
        return (_jsx("div", { className: `relative w-[35px] h-[35px] rounded-full flex-shrink-0 overflow-hidden ${className}`, children: _jsx("img", { src: user.profileImage, alt: "User profile", className: "absolute top-0 left-0 w-full h-full object-cover rounded-full" }) }));
    }
    return (_jsx("div", { className: `w-[35px] h-[35px] flex-shrink-0 ${className}`, children: _jsx(User, { className: "w-full h-full text-white", weight: "fill" }) }));
}

import { jsx as _jsx } from "react/jsx-runtime";
import { User, Robot } from '@phosphor-icons/react';
export default function UserIcon(_a) {
    var _b = _a.user, user = _b === void 0 ? {} : _b, _c = _a.role, role = _c === void 0 ? 'user' : _c, _d = _a.size, size = _d === void 0 ? 'medium' : _d, _e = _a.className, className = _e === void 0 ? '' : _e;
    var sizeClasses = {
        small: 'w-6 h-6',
        medium: 'w-8 h-8',
        large: 'w-12 h-12',
    };
    var baseClasses = "".concat(sizeClasses[size], " rounded-full flex items-center justify-center bg-white/10 ").concat(className);
    if (user === null || user === void 0 ? void 0 : user.profilePicture) {
        return (_jsx("div", { className: baseClasses, children: _jsx("img", { src: user.profilePicture, alt: user.name || user.username || 'User', className: "w-full h-full object-cover rounded-full" }) }));
    }
    // Generate a color based on user ID or username
    var getColorFromString = function (str) {
        if (str === void 0) { str = ''; }
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colors = [
            'bg-red-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-yellow-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-teal-500',
        ];
        return colors[Math.abs(hash) % colors.length];
    };
    var colorClass = getColorFromString(user.uid || user.username || '');
    if (role === 'assistant') {
        return (_jsx("div", { className: "".concat(baseClasses, " ").concat(colorClass), children: _jsx(Robot, { className: "w-5 h-5 text-white" }) }));
    }
    if (role === 'system') {
        return (_jsx("div", { className: "".concat(baseClasses, " bg-gray-500"), children: _jsx("div", { className: "w-2 h-2 bg-white rounded-full" }) }));
    }
    // Default user icon
    return (_jsx("div", { className: "".concat(baseClasses, " ").concat(colorClass), children: user.name || user.username ? (_jsx("span", { className: "text-white font-medium text-sm", children: (user.name || user.username || '').charAt(0).toUpperCase() })) : (_jsx(User, { className: "w-5 h-5 text-white" })) }));
}

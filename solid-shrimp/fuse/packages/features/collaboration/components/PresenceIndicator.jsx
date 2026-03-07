"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceIndicator = void 0;
import jsx_runtime_1 from 'react/jsx-runtime';
import avatar_1 from '@/components/ui/avatar';
import tooltip_1 from '@/components/ui/tooltip';
const PresenceIndicator = ({ user }) => {
    return ((0, jsx_runtime_1.jsx)(tooltip_1.Tooltip, { content: `${user.name} (${user.status})`, children: (0, jsx_runtime_1.jsx)(avatar_1.Avatar, { src: user.avatar, status: user.status, className: "presence-indicator" }) }));
};
exports.PresenceIndicator = PresenceIndicator;
//# sourceMappingURL=PresenceIndicator.js.map
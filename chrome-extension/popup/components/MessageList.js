import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useStore } from '@utils/store';
const MessageList = () => {
    const messages = useStore((state) => state.messages);
    const messagesEndRef = React.useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);
    return (_jsxs(Box, { sx: { p: 2, height: '100%', overflowY: 'auto' }, children: [messages.map((message) => (_jsxs(Paper, { elevation: 1, sx: {
                    p: 2,
                    mb: 2,
                    maxWidth: '80%',
                    ml: message.type === 'received' ? 0 : 'auto',
                    mr: message.type === 'sent' ? 0 : 'auto',
                    bgcolor: message.type === 'sent' ? 'primary.light' : 'background.paper',
                }, children: [_jsx(Typography, { variant: "body1", children: message.text }), _jsx(Typography, { variant: "caption", sx: { display: 'block', mt: 1, opacity: 0.7 }, children: new Date(message.timestamp).toLocaleTimeString() })] }, message.id))), _jsx("div", { ref: messagesEndRef })] }));
};
export default MessageList;
//# sourceMappingURL=MessageList.js.map
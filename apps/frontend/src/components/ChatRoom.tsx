"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoom = void 0;
import react_1 from 'react';
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
import useSocket_1 from '../hooks/useSocket.js';
import useAuth_1 from '../hooks/useAuth.js';
import chat_1 from '../types/chat.js';
import { formatDistanceToNow } from 'date-fns';
import MarkdownRenderer_1 from './MarkdownRenderer.js';
import nanoid_1 from 'nanoid';
const ChatRoom = ({ roomId, title }) => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [newMessage, setNewMessage] = (0, react_1.useState)('');
    const [isTyping, setIsTyping] = (0, react_1.useState)(false);
    const [members, setMembers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const messagesEndRef = (0, react_1.useRef)(null);
    const socket = (0, useSocket_1.useSocket)();
    const { user } = (0, useAuth_1.useAuth)();
    const scrollToBottom = () => {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    };
    (0, react_1.useEffect)(() => {
        if (!socket || !roomId)
            return;
        socket.emit('join_room', { roomId });
        socket.emit('get_room_messages', { roomId }, (response) => {
            setMessages(response.messages);
            setLoading(false);
        });
        socket.emit('get_room_members', { roomId }, (response) => {
            setMembers(response.members);
        });
        socket.on('new_message', (message) => {
            setMessages((prev: any) => [...prev, message]);
            scrollToBottom();
        });
        socket.on('typing_status', ({ userId, isTyping: typing }) => {
            setMembers((prev: any) => prev.map(member => member.id === userId ? Object.assign(Object.assign({}, member), { isTyping: typing }) : member));
        });
        socket.on('member_joined', (member) => {
            setMembers((prev: any) => [...prev, member]);
        });
        socket.on('member_left', (memberId) => {
            setMembers((prev: any) => prev.filter(m => m.id !== memberId));
        });
        return () => {
            socket.emit('leave_room', { roomId });
            socket.off('new_message');
            socket.off('typing_status');
            socket.off('member_joined');
            socket.off('member_left');
        };
    }, [socket, roomId]);
    (0, react_1.useEffect)(() => {
        scrollToBottom();
    }, [messages]);
    const handleTyping = (event) => {
        const value = event.target.value;
        setNewMessage(value);
        if (socket) {
            socket.emit('typing', { roomId, isTyping: value.length > 0 });
        }
    };
    const handleSendMessage = () => {
        if (!newMessage.trim() || !socket)
            return;
        const message = {
            id: (0, nanoid_1.nanoid)(),
            roomId,
            senderId: user === null || user === void 0 ? void 0 : user.id,
            content: newMessage,
            type: chat_1.MessageType.TEXT,
            timestamp: new Date().toISOString()
        };
        socket.emit('send_message', message, (response) => {
            if (response.success) {
                setNewMessage('');
                socket.emit('typing', { roomId, isTyping: false });
            }
        });
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };
    const renderMessage = (message) => {
        var _a;
        const isSelf = message.senderId === (user === null || user === void 0 ? void 0 : user.id);
        const sender = members.find(m => m.id === message.senderId);
        return (<material_1.ListItem key={message.id} sx={{
                flexDirection: isSelf ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                mb: 2
            }}>
        <material_1.ListItemAvatar>
          <material_1.Avatar src={sender === null || sender === void 0 ? void 0 : sender.avatar} alt={sender === null || sender === void 0 ? void 0 : sender.name}>
            {(_a = sender === null || sender === void 0 ? void 0 : sender.name) === null || _a === void 0 ? void 0 : _a.charAt(0)}
          </material_1.Avatar>
        </material_1.ListItemAvatar>
        <material_1.Box sx={{
                maxWidth: '70%',
                ml: isSelf ? 0 : 2,
                mr: isSelf ? 2 : 0
            }}>
          <material_1.Paper elevation={1} sx={{
                p: 2,
                bgcolor: isSelf ? 'primary.light' : 'background.paper',
                borderRadius: 2
            }}>
            <material_1.Typography variant="subtitle2" color="textSecondary">
              {sender === null || sender === void 0 ? void 0 : sender.name}
            </material_1.Typography>
            
            {message.type === chat_1.MessageType.TEXT && (<material_1.Typography variant="body1">
                {message.content}
              </material_1.Typography>)}
            
            {message.type === chat_1.MessageType.MARKDOWN && (<MarkdownRenderer_1.default content={message.content}/>)}
            
            {message.type === chat_1.MessageType.CODE && (<material_1.Box sx={{ mt: 1 }}>
                <icons_material_1.Code color="action" sx={{ mr: 1 }}/>
                <pre>
                  <code>{message.content}</code>
                </pre>
              </material_1.Box>)}
            
            {(message.type === chat_1.MessageType.IMAGE || message.type === chat_1.MessageType.VIDEO) && (<material_1.Box sx={{ mt: 1 }}>
                {message.type === chat_1.MessageType.IMAGE && <icons_material_1.Image color="action"/>}
                {message.type === chat_1.MessageType.VIDEO && <icons_material_1.VideoLibrary color="action"/>}
                <material_1.Typography variant="caption" sx={{ ml: 1 }}>
                  Media attachment
                </material_1.Typography>
              </material_1.Box>)}

            <material_1.Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </material_1.Typography>
          </material_1.Paper>
        </material_1.Box>
      </material_1.ListItem>);
    };
    if (loading) {
        return (<material_1.Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <material_1.CircularProgress />
      </material_1.Box>);
    }
    if (error) {
        return (<material_1.Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <material_1.Typography color="error">{error}</material_1.Typography>
      </material_1.Box>);
    }
    return (<material_1.Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <material_1.Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <material_1.Box display="flex" alignItems="center" justifyContent="space-between">
          <material_1.Typography variant="h6">{title || `Chat Room ${roomId}`}</material_1.Typography>
          <material_1.Box display="flex" alignItems="center">
            {members.map(member => (<material_1.Tooltip key={member.id} title={`${member.name}${member.isTyping ? ' (typing...)' : ''}`}>
                <material_1.Avatar src={member.avatar} alt={member.name} sx={{ width: 32, height: 32, ml: 1 }}>
                  {member.name.charAt(0)}
                </material_1.Avatar>
              </material_1.Tooltip>))}
            <material_1.IconButton size="small" sx={{ ml: 2 }}>
              <icons_material_1.MoreVert />
            </material_1.IconButton>
          </material_1.Box>
        </material_1.Box>
      </material_1.Paper>

      <material_1.Paper sx={{
            flex: 1,
            mb: 2,
            p: 2,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 250px)'
        }} elevation={1}>
        <material_1.List>
          {messages.map(renderMessage)}
        </material_1.List>
        <div ref={messagesEndRef}/>
      </material_1.Paper>

      <material_1.Paper sx={{ p: 2 }} elevation={1}>
        <material_1.Box display="flex" alignItems="center">
          <material_1.IconButton size="small">
            <icons_material_1.AttachFile />
          </material_1.IconButton>
          <material_1.IconButton size="small">
            <icons_material_1.EmojiEmotions />
          </material_1.IconButton>
          <material_1.TextField fullWidth multiline maxRows={4} value={newMessage} onChange={handleTyping} onKeyPress={handleKeyPress} placeholder="Type a message..." sx={{ mx: 2 }}/>
          <material_1.Button variant="contained" endIcon={<icons_material_1.Send />} onClick={handleSendMessage} disabled={!newMessage.trim()}>
            Send
          </material_1.Button>
        </material_1.Box>
      </material_1.Paper>
    </material_1.Box>);
};
exports.ChatRoom = ChatRoom;
exports.default = exports.ChatRoom;
export {};
//# sourceMappingURL=ChatRoom.js.map
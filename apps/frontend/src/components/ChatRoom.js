var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, Smile } from 'lucide-react';
import { nanoid } from 'nanoid';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { MessageType } from '@/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
export var ChatRoom = function (_a) {
    var roomId = _a.roomId, title = _a.title;
    var _b = useState([]), messages = _b[0], setMessages = _b[1];
    var _c = useState(''), newMessage = _c[0], setNewMessage = _c[1];
    var _d = useState([]), members = _d[0], setMembers = _d[1];
    var _e = useState(true), loading = _e[0], setLoading = _e[1];
    var error = useState(null)[0];
    var messagesEndRef = useRef(null);
    var socket = useSocket();
    var user = useAuth().user;
    var scrollToBottom = function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(function () {
        if (!socket || !roomId)
            return;
        socket.emit('join_room', { roomId: roomId });
        socket.emit('get_room_messages', { roomId: roomId }, function (response) {
            setMessages(response.messages);
            setLoading(false);
        });
        socket.emit('get_room_members', { roomId: roomId }, function (response) {
            setMembers(response.members);
        });
        var handleNewMessage = function (message) {
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [message], false); });
            scrollToBottom();
        };
        var handleTypingStatus = function (_a) {
            var userId = _a.userId, isTyping = _a.isTyping;
            setMembers(function (prev) {
                return prev.map(function (member) { return (member.id === userId ? __assign(__assign({}, member), { isTyping: isTyping }) : member); });
            });
        };
        var handleMemberJoined = function (member) {
            setMembers(function (prev) { return __spreadArray(__spreadArray([], prev, true), [member], false); });
        };
        var handleMemberLeft = function (memberId) {
            setMembers(function (prev) { return prev.filter(function (m) { return m.id !== memberId; }); });
        };
        socket.on('new_message', handleNewMessage);
        socket.on('typing_status', handleTypingStatus);
        socket.on('member_joined', handleMemberJoined);
        socket.on('member_left', handleMemberLeft);
        return function () {
            socket.emit('leave_room', { roomId: roomId });
            socket.off('new_message', handleNewMessage);
            socket.off('typing_status', handleTypingStatus);
            socket.off('member_joined', handleMemberJoined);
            socket.off('member_left', handleMemberLeft);
        };
    }, [socket, roomId]);
    useEffect(function () {
        scrollToBottom();
    }, [messages]);
    var handleTyping = function (event) {
        var value = event.target.value;
        setNewMessage(value);
        if (socket) {
            socket.emit('typing', { roomId: roomId, isTyping: value.length > 0 });
        }
    };
    var handleSendMessage = function () {
        if (!newMessage.trim() || !socket || !user)
            return;
        var message = {
            id: nanoid(),
            roomId: roomId,
            senderId: user.id,
            content: newMessage,
            type: MessageType.TEXT,
            timestamp: new Date().toISOString(),
        };
        socket.emit('send_message', message, function (response) {
            if (response.success) {
                setNewMessage('');
                socket.emit('typing', { roomId: roomId, isTyping: false });
            }
        });
    };
    var handleKeyPress = function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };
    var renderMessage = function (message) {
        var _a;
        var isSelf = message.senderId === (user === null || user === void 0 ? void 0 : user.id);
        var sender = members.find(function (m) { return m.id === message.senderId; });
        return (_jsxs("div", { className: "flex items-start gap-3 my-4 ".concat(isSelf ? 'flex-row-reverse' : ''), children: [_jsxs(Avatar, { children: [_jsx(AvatarImage, { src: sender === null || sender === void 0 ? void 0 : sender.avatar, alt: sender === null || sender === void 0 ? void 0 : sender.name }), _jsx(AvatarFallback, { children: (_a = sender === null || sender === void 0 ? void 0 : sender.name) === null || _a === void 0 ? void 0 : _a.charAt(0) })] }), _jsxs("div", { className: "flex flex-col gap-1 ".concat(isSelf ? 'items-end' : ''), children: [_jsxs("div", { className: "rounded-lg p-3 ".concat(isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'), children: [_jsx("p", { className: "font-semibold text-sm", children: sender === null || sender === void 0 ? void 0 : sender.name }), message.type === MessageType.TEXT && _jsx("p", { className: "text-sm", children: message.content }), message.type === MessageType.MARKDOWN && _jsx(MarkdownRenderer, { content: message.content })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatDistanceToNow(new Date(message.timestamp), { addSuffix: true }) })] })] }, message.id));
    };
    if (loading) {
        return _jsx("div", { children: "Loading..." });
    }
    if (error) {
        return _jsx("div", { children: error });
    }
    return (_jsxs(Card, { className: "h-full flex flex-col", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: title || "Chat Room ".concat(roomId) }), _jsx("div", { className: "flex items-center gap-2", children: members.map(function (member) { return (_jsxs(Avatar, { title: "".concat(member.name).concat(member.isTyping ? ' (typing...)' : ''), children: [_jsx(AvatarImage, { src: member.avatar, alt: member.name }), _jsx(AvatarFallback, { children: member.name.charAt(0) })] }, member.id)); }) })] }), _jsx(CardContent, { className: "flex-1 overflow-hidden", children: _jsx(ScrollArea, { className: "h-full", children: _jsxs("div", { className: "p-4", children: [messages.map(renderMessage), _jsx("div", { ref: messagesEndRef })] }) }) }), _jsx(CardFooter, { children: _jsxs("div", { className: "flex items-center gap-2 w-full", children: [_jsx(Button, { variant: "ghost", size: "icon", children: _jsx(Paperclip, { className: "w-5 h-5" }) }), _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(Smile, { className: "w-5 h-5" }) }), _jsx(Input, { value: newMessage, onChange: handleTyping, onKeyPress: handleKeyPress, placeholder: "Type a message...", className: "flex-1" }), _jsx(Button, { onClick: handleSendMessage, disabled: !newMessage.trim(), children: _jsx(Send, { className: "w-5 h-5" }) })] }) })] }));
};

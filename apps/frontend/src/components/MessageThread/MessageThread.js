"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageThread = void 0;
import react_1 from 'react';
import { format } from 'date-fns';
import ui_1 from '../../shared/components/ui';
import MessageReactions_1 from '../MessageReactions/MessageReactions';
import MarkdownRenderer_1 from '../MarkdownRenderer';
var MessageThread = function (_a) {
    var parentMessage = _a.parentMessage, replies = _a.replies, onReply = _a.onReply, onClose = _a.onClose, currentUserId = _a.currentUserId;
    var _b = (0, react_1.useState)(''), replyContent = _b[0], setReplyContent = _b[1];
    var _c = (0, react_1.useState)(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var handleSubmitReply = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!replyContent.trim())
                        return [2 /*return*/];
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onReply(replyContent, parentMessage.id)];
                case 2:
                    _a.sent();
                    setReplyContent('');
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error submitting reply:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(ui_1.Card, { variant: "default", className: "w-full max-w-2xl mx-auto", children: [_jsx(ui_1.CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Thread" }), _jsx(ui_1.Button, { variant: "default", size: "small", onClick: onClose, className: "!p-1", children: _jsx(icons_material_1.Close, { className: "w-5 h-5" }) })] }) }), _jsxs(ui_1.CardContent, { children: [_jsx("div", { className: "mb-6 p-4 bg-gray-50 rounded-lg", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center", children: _jsx("span", { className: "text-blue-600 font-medium", children: parentMessage.sender.charAt(0).toUpperCase() }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "font-medium", children: parentMessage.sender }), _jsx("span", { className: "text-sm text-gray-500", children: format(new Date(parentMessage.timestamp), 'MMM d, h:mm a') })] }), _jsx("div", { className: "prose prose-sm max-w-none", children: _jsx(MarkdownRenderer_1.default, { content: parentMessage.content }) }), _jsx(MessageReactions_1.default, { messageId: parentMessage.id, reactions: parentMessage.reactions || [], currentUserId: currentUserId })] })] }) }), _jsx("div", { className: "space-y-4", children: replies.map(function (reply) { return (_jsx("div", { className: "p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center", children: _jsx("span", { className: "text-gray-600 font-medium", children: reply.sender.charAt(0).toUpperCase() }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "font-medium", children: reply.sender }), _jsx("span", { className: "text-sm text-gray-500", children: format(new Date(reply.timestamp), 'MMM d, h:mm a') })] }), _jsx("div", { className: "prose prose-sm max-w-none", children: _jsx(MarkdownRenderer_1.default, { content: reply.content }) }), _jsx(MessageReactions_1.default, { messageId: reply.id, reactions: reply.reactions || [], currentUserId: currentUserId })] })] }) }, reply.id)); }) }), _jsx("div", { className: "mt-6", children: _jsxs("div", { className: "flex space-x-4", children: [_jsx("div", { className: "flex-1", children: _jsx("textarea", { value: replyContent, onChange: function (e) { return setReplyContent(e.target.value); }, placeholder: "Write your reply...", className: "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none", disabled: isSubmitting }) }), _jsx(ui_1.Button, { variant: "gradient", onClick: handleSubmitReply, disabled: isSubmitting || !replyContent.trim(), className: "self-end", children: isSubmitting ? (_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsx(icons_material_1.Send, { className: "w-5 h-5" })) })] }) })] })] }));
};
exports.MessageThread = MessageThread;
exports.default = exports.MessageThread;

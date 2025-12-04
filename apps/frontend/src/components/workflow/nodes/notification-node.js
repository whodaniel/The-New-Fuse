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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
var NotificationNode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    // Handle notification title change
    var handleTitleChange = function (title) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { title: title })
            });
        }
    };
    // Handle notification message change
    var handleMessageChange = function (message) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { message: message })
            });
        }
    };
    // Handle notification type change
    var handleTypeChange = function (type) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { type: type })
            });
        }
    };
    // Handle notification channel change
    var handleChannelChange = function (channel) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, data.config), { channel: channel })
            });
        }
    };
    var inputHandles = [
        { id: 'default', label: 'Input' }
    ];
    var outputHandles = [
        { id: 'default', label: 'Output' }
    ];
    var renderContent = function () {
        var _a, _b, _c, _d;
        return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "notification-type-".concat(id), className: "text-xs", children: "Notification Type" }), _jsxs("select", { id: "notification-type-".concat(id), className: "w-full text-xs h-8 rounded-md border border-input", value: ((_a = data.config) === null || _a === void 0 ? void 0 : _a.type) || 'info', onChange: function (e) { return handleTypeChange(e.target.value); }, children: [_jsx("option", { value: "info", children: "Info" }), _jsx("option", { value: "success", children: "Success" }), _jsx("option", { value: "warning", children: "Warning" }), _jsx("option", { value: "error", children: "Error" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "notification-channel-".concat(id), className: "text-xs", children: "Channel" }), _jsxs("select", { id: "notification-channel-".concat(id), className: "w-full text-xs h-8 rounded-md border border-input", value: ((_b = data.config) === null || _b === void 0 ? void 0 : _b.channel) || 'ui', onChange: function (e) { return handleChannelChange(e.target.value); }, children: [_jsx("option", { value: "ui", children: "UI Toast" }), _jsx("option", { value: "email", children: "Email" }), _jsx("option", { value: "slack", children: "Slack" }), _jsx("option", { value: "webhook", children: "Webhook" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "notification-title-".concat(id), className: "text-xs", children: "Title" }), _jsx(Input, { id: "notification-title-".concat(id), className: "h-7 text-xs", placeholder: "Notification Title", value: ((_c = data.config) === null || _c === void 0 ? void 0 : _c.title) || '', onChange: function (e) { return handleTitleChange(e.target.value); } })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "notification-message-".concat(id), className: "text-xs", children: "Message" }), _jsx(Textarea, { id: "notification-message-".concat(id), className: "h-20 text-xs resize-none", placeholder: "Notification message...", value: ((_d = data.config) === null || _d === void 0 ? void 0 : _d.message) || '', onChange: function (e) { return handleMessageChange(e.target.value); } }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["You can use template variables like ", { variable: variable }, " in your message."] })] })] }));
    };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: data.name || 'Notification', type: 'notification', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
NotificationNode.displayName = 'NotificationNode';
export { NotificationNode };

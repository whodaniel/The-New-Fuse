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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { webSocketService } from '@/services/websocket';
export default function WorkspaceMembers() {
    var _this = this;
    var currentWorkspace = useWorkspace().currentWorkspace;
    var _a = useState(false), showInviteDialog = _a[0], setShowInviteDialog = _a[1];
    var _b = useState(''), inviteEmail = _b[0], setInviteEmail = _b[1];
    var _c = useState(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var members = (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.members) || [];
    var handleInvite = function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            e.preventDefault();
            if (!currentWorkspace)
                return [2 /*return*/];
            try {
                setIsSubmitting(true);
                webSocketService.send('inviteMember', {
                    workspaceId: currentWorkspace.id,
                    email: inviteEmail
                });
                setShowInviteDialog(false);
                setInviteEmail('');
            }
            catch (error) {
                console.error('Failed to invite member:', error);
            }
            finally {
                setIsSubmitting(false);
            }
            return [2 /*return*/];
        });
    }); };
    var handleRoleChange = function (memberId, newRole) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!currentWorkspace)
                return [2 /*return*/];
            try {
                webSocketService.send('updateMemberRole', {
                    workspaceId: currentWorkspace.id,
                    memberId: memberId,
                    role: newRole
                });
            }
            catch (error) {
                console.error('Failed to update member role:', error);
            }
            return [2 /*return*/];
        });
    }); };
    var handleRemoveMember = function (memberId) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!currentWorkspace)
                return [2 /*return*/];
            try {
                webSocketService.send('removeMember', {
                    workspaceId: currentWorkspace.id,
                    memberId: memberId
                });
            }
            catch (error) {
                console.error('Failed to remove member:', error);
            }
            return [2 /*return*/];
        });
    }); };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Team Members" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Manage your workspace members and their roles" })] }), _jsxs(Button, { onClick: function () { return setShowInviteDialog(true); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Invite Member"] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Members" }), _jsxs(CardDescription, { children: [members.length, " member", members.length !== 1 ? 's' : '', " in workspace"] })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: members.map(function (member) { return (_jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-10 w-10 rounded-full bg-muted flex items-center justify-center", children: member.avatarUrl ? (_jsx("img", { src: member.avatarUrl, alt: member.name, className: "h-full w-full rounded-full object-cover" })) : (_jsx("span", { className: "text-lg font-medium", children: member.name[0].toUpperCase() })) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: member.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: member.email })] })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", children: [_jsx("span", { className: "mr-2", children: member.role }), _jsx(MoreHorizontal, { className: "h-4 w-4" })] }) }), _jsx(DropdownMenuContent, { align: "end", children: member.role !== 'owner' && (_jsxs(_Fragment, { children: [_jsx(DropdownMenuItem, { onClick: function () { return handleRoleChange(member.id, 'admin'); }, children: "Make Admin" }), _jsx(DropdownMenuItem, { onClick: function () { return handleRoleChange(member.id, 'member'); }, children: "Make Member" }), _jsx(DropdownMenuItem, { onClick: function () { return handleRemoveMember(member.id); }, className: "text-destructive", children: "Remove Member" })] })) })] })] }, member.id)); }) }) })] }), _jsx(Dialog, { open: showInviteDialog, onOpenChange: setShowInviteDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Invite Team Member" }), _jsx(DialogDescription, { children: "Invite a new member to join your workspace." })] }), _jsxs("form", { onSubmit: handleInvite, children: [_jsx("div", { className: "space-y-4 py-4", children: _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "email", className: "text-sm font-medium", children: "Email Address" }), _jsx(Input, { id: "email", type: "email", value: inviteEmail, onChange: function (e) { return setInviteEmail(e.target.value); }, placeholder: "Enter email address", required: true })] }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: function () { return setShowInviteDialog(false); }, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Sending Invite...' : 'Send Invite' })] })] })] }) })] }));
}

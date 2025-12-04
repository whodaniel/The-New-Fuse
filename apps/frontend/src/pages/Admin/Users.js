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
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, } from '@/components/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Plus } from 'lucide-react';
var Users = function () {
    var _a = useState(''), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = useState(false), showCreateDialog = _b[0], setShowCreateDialog = _b[1];
    var users = [
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
            status: 'active',
            workspaces: 3,
            lastActive: '2 hours ago',
        },
    ];
    var handleCreateUser = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            e.preventDefault();
            setShowCreateDialog(false);
            return [2 /*return*/];
        });
    }); };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Users" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Manage system users and their permissions" })] }), _jsxs(Button, { onClick: function () { return setShowCreateDialog(true); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create User"] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "All Users" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search users...", className: "pl-8", value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); } })] }) })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "border rounded-lg", children: [_jsxs("div", { className: "grid grid-cols-6 gap-4 p-4 text-sm font-medium text-muted-foreground", children: [_jsx("div", { children: "Name" }), _jsx("div", { children: "Email" }), _jsx("div", { children: "Role" }), _jsx("div", { children: "Status" }), _jsx("div", { children: "Workspaces" }), _jsx("div", { children: "Last Active" })] }), users.map(function (user) { return (_jsxs("div", { className: "grid grid-cols-6 gap-4 p-4 border-t items-center", children: [_jsx("div", { className: "font-medium", children: user.name }), _jsx("div", { className: "text-muted-foreground", children: user.email }), _jsx("div", { children: _jsx("span", { className: "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary", children: user.role }) }), _jsx("div", { children: _jsx("span", { className: "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ".concat(user.status === 'active'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'), children: user.status }) }), _jsx("div", { children: user.workspaces }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: user.lastActive }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { children: "View Details" }), _jsx(DropdownMenuItem, { children: "Edit User" }), _jsx(DropdownMenuItem, { className: "text-destructive", children: "Deactivate User" })] })] })] })] }, user.id)); })] }) }) })] }), _jsx(Dialog, { open: showCreateDialog, onOpenChange: setShowCreateDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create User" }), _jsx(DialogDescription, { children: "Add a new user to the system" })] }), _jsxs("form", { onSubmit: handleCreateUser, className: "space-y-4", children: [_jsx(Input, { placeholder: "Name" }), _jsx(Input, { type: "email", placeholder: "Email" }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: function () { return setShowCreateDialog(false); }, children: "Cancel" }), _jsx(Button, { type: "submit", children: "Create User" })] })] })] }) })] }));
};
export default Users;

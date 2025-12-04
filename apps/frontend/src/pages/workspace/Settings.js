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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
var WorkspaceSettings = function () {
    var navigate = useNavigate();
    var _a = useWorkspace(), currentWorkspace = _a.currentWorkspace, loading = _a.loading, error = _a.error;
    var _b = useState(false), showDeleteDialog = _b[0], setShowDeleteDialog = _b[1];
    var _c = useState(''), deleteConfirmation = _c[0], setDeleteConfirmation = _c[1];
    React.useEffect(function () {
        if (!loading && !currentWorkspace) {
            navigate('/workspace/overview');
        }
    }, [loading, currentWorkspace, navigate]);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("div", { className: "text-lg text-muted-foreground", children: "Loading workspace settings..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsxs("div", { className: "text-lg text-red-500", children: ["Error loading workspace settings: ", error.message] }) }));
    }
    var handleUpdateWorkspace = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            e.preventDefault();
            return [2 /*return*/];
        });
    }); };
    var handleDeleteWorkspace = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (deleteConfirmation !== (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name)) {
                return [2 /*return*/];
            }
            setShowDeleteDialog(false);
            setDeleteConfirmation('');
            navigate('/workspace');
            return [2 /*return*/];
        });
    }); };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Workspace Settings" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Manage your workspace settings and preferences" })] }), _jsx("form", { onSubmit: handleUpdateWorkspace, children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "General Settings" }), _jsx(CardDescription, { children: "Update your workspace information" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "text-sm font-medium", children: "Workspace Name" }), _jsx(Input, { id: "name", defaultValue: currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name, className: "mt-1" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "text-sm font-medium", children: "Description" }), _jsx(Input, { id: "description", defaultValue: currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.description, className: "mt-1" })] }), _jsx(Button, { type: "submit", children: "Save Changes" })] })] }) }), _jsxs(Card, { className: "border-destructive", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-destructive", children: "Danger Zone" }), _jsx(CardDescription, { children: "Irreversible and destructive actions" })] }), _jsx(CardContent, { children: _jsx(Button, { variant: "destructive", onClick: function () { return setShowDeleteDialog(true); }, children: "Delete Workspace" }) })] }), _jsx(Dialog.Root, { open: showDeleteDialog, onOpenChange: setShowDeleteDialog, children: _jsxs(Dialog.Content, { children: [_jsxs(Dialog.Header, { children: [_jsx(Dialog.Title, { children: "Delete Workspace" }), _jsx(Dialog.Description, { children: "This action cannot be undone. This will permanently delete your workspace and remove all associated data." })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-destructive" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Please type ", _jsx("span", { className: "font-medium", children: currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name }), " to confirm"] })] }), _jsx(Input, { value: deleteConfirmation, onChange: function (e) { return setDeleteConfirmation(e.target.value); }, placeholder: "Enter workspace name" })] }), _jsx(Dialog.Footer, { children: _jsx(Button, { variant: "destructive", onClick: handleDeleteWorkspace, disabled: deleteConfirmation !== (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name), children: "Delete Workspace" }) })] }) })] }));
};
export default WorkspaceSettings;

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
import { useState, useEffect } from 'react';
import { Button } from '@the-new-fuse/ui-consolidated';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Eye, Info } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';
export var OnboardingStepsConfig = function (_a) {
    var onSave = _a.onSave, onChange = _a.onChange, hasUnsavedChanges = _a.hasUnsavedChanges;
    var _b = useState(false), isOpen = _b[0], setIsOpen = _b[1];
    var _c = useState([]), steps = _c[0], setSteps = _c[1];
    var _d = useState(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    var onOpen = function () { return setIsOpen(true); };
    var onClose = function () { return setIsOpen(false); };
    var showToast = function (title, description, status) {
        if (status === void 0) { status = 'success'; }
        // Simple toast implementation - in a real app you might use a toast library
        console.log("Toast: ".concat(title, " - ").concat(description, " (").concat(status, ")"));
    };
    // Fetch steps from API
    useEffect(function () {
        var fetchSteps = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setIsLoading(true);
                        setError(null);
                        return [4 /*yield*/, OnboardingAdminService.getSteps()];
                    case 1:
                        data = _a.sent();
                        setSteps(data);
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Error fetching onboarding steps:', err_1);
                        setError('Failed to load onboarding steps. Please try again.');
                        // Set default steps if API fails
                        setSteps([
                            {
                                id: '1',
                                type: 'welcome',
                                title: 'Welcome',
                                description: 'Introduction to The New Fuse platform',
                                enabled: true,
                                required: true,
                                userTypes: ['human', 'ai_agent'],
                                content: {
                                    heading: 'Welcome to The New Fuse',
                                    subheading: 'The AI agent coordination platform that enables intelligent interaction between different AI systems.',
                                    imageUrl: '/assets/images/welcome.png',
                                    buttonText: 'Get Started'
                                }
                            },
                            {
                                id: '2',
                                type: 'profile',
                                title: 'User Profile',
                                description: 'Collect user information',
                                enabled: true,
                                required: true,
                                userTypes: ['human'],
                                content: {
                                    heading: 'Tell us about yourself',
                                    subheading: 'This information helps us personalize your experience.'
                                }
                            },
                            {
                                id: '3',
                                type: 'completion',
                                title: 'Complete',
                                description: 'Onboarding completion',
                                enabled: true,
                                required: true,
                                userTypes: ['human', 'ai_agent'],
                                content: {
                                    heading: 'All Set!',
                                    subheading: 'You\'re ready to start using The New Fuse.',
                                    buttonText: 'Get Started'
                                }
                            }
                        ]);
                        return [3 /*break*/, 4];
                    case 3:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchSteps();
    }, []);
    var _f = useState(null), currentStep = _f[0], setCurrentStep = _f[1];
    var _g = useState(false), isEditing = _g[0], setIsEditing = _g[1];
    var handleAddStep = function () {
        var newStep = {
            id: "step-".concat(Date.now()),
            type: 'custom',
            title: 'New Step',
            description: 'Description of the new step',
            enabled: true,
            required: false,
            userTypes: ['human'],
            content: {
                heading: 'New Step',
                subheading: 'Description of the new step'
            },
            customFields: []
        };
        setCurrentStep(newStep);
        setIsEditing(false);
        onOpen();
    };
    var handleEditStep = function (step) {
        setCurrentStep(__assign({}, step));
        setIsEditing(true);
        onOpen();
    };
    var handleDeleteStep = function (id) {
        setSteps(steps.filter(function (step) { return step.id !== id; }));
        onChange();
        showToast('Step deleted', undefined, 'success');
    };
    var handleSaveStep = function () {
        if (!currentStep)
            return;
        if (isEditing) {
            setSteps(steps.map(function (step) { return step.id === currentStep.id ? currentStep : step; }));
        }
        else {
            setSteps(__spreadArray(__spreadArray([], steps, true), [currentStep], false));
        }
        onChange();
        onClose();
        showToast(isEditing ? 'Step updated' : 'Step added', undefined, 'success');
    };
    var handleMoveStep = function (id, direction) {
        var _a;
        var index = steps.findIndex(function (step) { return step.id === id; });
        if ((direction === 'up' && index === 0) ||
            (direction === 'down' && index === steps.length - 1)) {
            return;
        }
        var newSteps = __spreadArray([], steps, true);
        var newIndex = direction === 'up' ? index - 1 : index + 1;
        _a = [newSteps[newIndex], newSteps[index]], newSteps[index] = _a[0], newSteps[newIndex] = _a[1];
        setSteps(newSteps);
        onChange();
    };
    var handleToggleStep = function (id) {
        setSteps(steps.map(function (step) {
            return step.id === id ? __assign(__assign({}, step), { enabled: !step.enabled }) : step;
        }));
        onChange();
    };
    var handleDragEnd = function (result) {
        if (!result.destination)
            return;
        var items = Array.from(steps);
        var reorderedItem = items.splice(result.source.index, 1)[0];
        items.splice(result.destination.index, 0, reorderedItem);
        setSteps(items);
        onChange();
    };
    var handleSaveChanges = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, OnboardingAdminService.updateSteps(steps)];
                case 1:
                    _a.sent();
                    onSave();
                    showToast('Changes saved', 'Onboarding steps configuration has been saved.', 'success');
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error('Error saving onboarding steps:', err_2);
                    showToast('Error saving changes', 'There was an error saving your changes. Please try again.', 'error');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleInputChange = function (e) {
        var _a, _b;
        if (!currentStep)
            return;
        var _c = e.target, name = _c.name, value = _c.value;
        if (name.startsWith('content.')) {
            var contentKey = name.split('.')[1];
            setCurrentStep(__assign(__assign({}, currentStep), { content: __assign(__assign({}, currentStep.content), (_a = {}, _a[contentKey] = value, _a)) }));
        }
        else {
            setCurrentStep(__assign(__assign({}, currentStep), (_b = {}, _b[name] = value, _b)));
        }
    };
    var handleSwitchChange = function (name, checked) {
        var _a;
        if (!currentStep)
            return;
        setCurrentStep(__assign(__assign({}, currentStep), (_a = {}, _a[name] = checked, _a)));
    };
    var handleUserTypeToggle = function (userType) {
        if (!currentStep)
            return;
        var userTypes = currentStep.userTypes.includes(userType)
            ? currentStep.userTypes.filter(function (type) { return type !== userType; })
            : __spreadArray(__spreadArray([], currentStep.userTypes, true), [userType], false);
        setCurrentStep(__assign(__assign({}, currentStep), { userTypes: userTypes }));
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Onboarding Wizard Steps" }), _jsxs(Button, { onClick: handleAddStep, disabled: isLoading, className: "flex items-center gap-2", children: [_jsx(Plus, {}), "Add Step"] })] }), _jsxs("div", { className: "flex items-center mb-4 gap-2", children: [_jsx("p", { className: "text-gray-600", children: "Configure the steps in your onboarding wizard. Drag and drop to reorder steps." }), _jsxs("div", { className: "relative group", children: [_jsx(Info, { className: "text-gray-400 cursor-help" }), _jsx("div", { className: "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10", children: "Each step represents a screen in the onboarding wizard. Steps can be customized for different user types." })] })] }), isLoading && (_jsxs("div", { className: "text-center py-10", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading onboarding steps..." })] })), error && !isLoading && (_jsxs("div", { className: "p-4 mb-4 bg-red-50 border border-red-200 rounded-md", children: [_jsx("h3", { className: "text-sm font-semibold text-red-800 mb-2", children: "Error Loading Steps" }), _jsx("p", { className: "text-red-600 mb-2", children: error }), _jsx(Button, { onClick: function () { return window.location.reload(); }, className: "bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1", children: "Retry" })] })), _jsx(DragDropContext, { onDragEnd: handleDragEnd, children: _jsx(Droppable, { droppableId: "steps", children: function (provided) { return (_jsxs("div", __assign({ className: "space-y-4" }, provided.droppableProps, { ref: provided.innerRef, children: [steps.map(function (step, index) { return (_jsx(Draggable, { draggableId: step.id, index: index, children: function (provided) { return (_jsxs("div", __assign({ ref: provided.innerRef }, provided.draggableProps, provided.dragHandleProps, { className: "border border-gray-200 bg-white shadow-sm rounded-md ".concat(step.enabled ? 'opacity-100' : 'opacity-60'), children: [_jsx("div", { className: "p-4 pb-2", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-sm font-semibold", children: step.title }), _jsx("span", { className: "px-2 py-1 text-xs rounded-full ".concat(step.required
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-green-100 text-green-800'), children: step.required ? 'Required' : 'Optional' }), !step.enabled && (_jsx("span", { className: "px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800", children: "Disabled" }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: function () { return handleMoveStep(step.id, 'up'); }, disabled: index === 0, className: "p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Move step up", children: _jsx(ArrowUp, {}) }), _jsx("button", { onClick: function () { return handleMoveStep(step.id, 'down'); }, disabled: index === steps.length - 1, className: "p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Move step down", children: _jsx(ArrowDown, {}) }), _jsx("button", { onClick: function () { return handleToggleStep(step.id); }, className: "p-1 ".concat(step.enabled ? 'text-blue-600' : 'text-gray-400', " hover:text-blue-800"), "aria-label": "Toggle step", children: _jsx(Eye, {}) }), _jsx("button", { onClick: function () { return handleEditStep(step); }, className: "p-1 text-gray-400 hover:text-gray-600", "aria-label": "Edit step", children: _jsx(Edit2, {}) }), _jsx("button", { onClick: function () { return handleDeleteStep(step.id); }, className: "p-1 text-gray-400 hover:text-red-600", "aria-label": "Delete step", children: _jsx(Trash2, {}) })] })] }) }), _jsxs("div", { className: "px-4 pb-4", children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: step.description }), _jsx("div", { className: "flex flex-wrap gap-1", children: step.userTypes.map(function (userType) { return (_jsx("span", { className: "px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full", children: userType }, userType)); }) })] })] }))); } }, step.id)); }), provided.placeholder] }))); } }) }), hasUnsavedChanges && (_jsx("div", { className: "mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("p", { className: "text-yellow-800", children: "You have unsaved changes." }), _jsx(Button, { onClick: handleSaveChanges, className: "bg-blue-600 hover:bg-blue-700 text-white", children: "Save Changes" })] }) })), isOpen && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center p-6 border-b", children: [_jsx("h2", { className: "text-lg font-semibold", children: isEditing ? 'Edit Step' : 'Add New Step' }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: "\u00D7" })] }), _jsx("div", { className: "p-6", children: currentStep && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Step Type", _jsx("span", { className: "ml-1 text-gray-400", children: _jsx(FiInfo, { className: "inline w-3 h-3" }) })] }), _jsxs("select", { name: "type", value: currentStep.type, onChange: handleInputChange, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", "aria-label": "Step type", title: "Select the type of onboarding step", children: [_jsx("option", { value: "welcome", children: "Welcome" }), _jsx("option", { value: "profile", children: "User Profile" }), _jsx("option", { value: "ai_preferences", children: "AI Preferences" }), _jsx("option", { value: "workspace", children: "Workspace Setup" }), _jsx("option", { value: "tools", children: "Tools & Integrations" }), _jsx("option", { value: "greeter", children: "Greeter Agent" }), _jsx("option", { value: "completion", children: "Completion" }), _jsx("option", { value: "custom", children: "Custom Step" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Title" }), _jsx("input", { type: "text", name: "title", value: currentStep.title, onChange: handleInputChange, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Enter step title", "aria-label": "Step title" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("textarea", { name: "description", value: currentStep.description, onChange: handleInputChange, rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Enter step description", "aria-label": "Step description" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "enabled", checked: currentStep.enabled, onChange: function (e) { return handleSwitchChange('enabled', e.target.checked); }, className: "mr-2" }), _jsx("label", { htmlFor: "enabled", className: "text-sm font-medium text-gray-700", children: "Enabled" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "required", checked: currentStep.required, onChange: function (e) { return handleSwitchChange('required', e.target.checked); }, className: "mr-2" }), _jsx("label", { htmlFor: "required", className: "text-sm font-medium text-gray-700", children: "Required" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["User Types", _jsx("span", { className: "ml-1 text-gray-400", children: _jsx(FiInfo, { className: "inline w-3 h-3" }) })] }), _jsx("div", { className: "flex gap-4", children: ['human', 'ai_agent'].map(function (userType) { return (_jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: userType, checked: currentStep.userTypes.includes(userType), onChange: function () { return handleUserTypeToggle(userType); }, className: "mr-2" }), _jsx("label", { htmlFor: userType, className: "text-sm text-gray-700", children: userType === 'ai_agent' ? 'AI Agent' : 'Human' })] }, userType)); }) })] })] })) }), _jsxs("div", { className: "flex justify-end gap-3 p-6 border-t", children: [_jsx(Button, { onClick: onClose, variant: "outline", children: "Cancel" }), _jsx(Button, { onClick: handleSaveStep, className: "bg-blue-600 hover:bg-blue-700 text-white", children: isEditing ? 'Update Step' : 'Add Step' })] })] }) }))] }));
};

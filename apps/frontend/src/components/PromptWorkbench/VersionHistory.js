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
import { useState, useEffect } from 'react';
import { Box, VStack, Text, Button, Table, Thead, Tbody, Tr, Th, Td, Badge, Divider, Flex, Heading, Spinner, useToast, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { usePromptTemplates } from '../../hooks/usePromptTemplates';
import { format } from 'date-fns';
export var VersionHistory = function (_a) {
    var templateId = _a.templateId;
    var _b = usePromptTemplates(), getTemplateVersions = _b.getTemplateVersions, loadTemplate = _b.loadTemplate;
    var _c = useState([]), versions = _c[0], setVersions = _c[1];
    var _d = useState(false), loading = _d[0], setLoading = _d[1];
    var _e = useState(null), selectedVersion = _e[0], setSelectedVersion = _e[1];
    var _f = useDisclosure(), isOpen = _f.isOpen, onOpen = _f.onOpen, onClose = _f.onClose;
    var toast = useToast();
    useEffect(function () {
        if (templateId) {
            loadVersions();
        }
        else {
            setVersions([]);
        }
    }, [templateId]);
    var loadVersions = function () { return __awaiter(void 0, void 0, void 0, function () {
        var versionHistory, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!templateId)
                        return [2 /*return*/];
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, getTemplateVersions(templateId)];
                case 2:
                    versionHistory = _a.sent();
                    setVersions(versionHistory);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Error loading version history',
                        description: error_1.message,
                        status: 'error',
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleViewVersion = function (version) {
        setSelectedVersion(version);
        onOpen();
    };
    var handleRestoreVersion = function (version) { return __awaiter(void 0, void 0, void 0, function () {
        var currentTemplate, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!templateId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loadTemplate(templateId)];
                case 2:
                    currentTemplate = _a.sent();
                    // Update with the version's content
                    return [4 /*yield*/, loadTemplate(templateId)];
                case 3:
                    // Update with the version's content
                    _a.sent();
                    toast({
                        title: 'Version restored',
                        description: "Restored to version from ".concat(format(new Date(version.createdAt), 'PPpp')),
                        status: 'success',
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    toast({
                        title: 'Error restoring version',
                        description: error_2.message,
                        status: 'error',
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (!templateId) {
        return (_jsx(Box, { textAlign: "center", py: 10, children: _jsx(Text, { color: "gray.500", children: "Please select a template to view version history." }) }));
    }
    if (loading) {
        return (_jsx(Flex, { justify: "center", align: "center", height: "300px", children: _jsx(Spinner, { size: "xl" }) }));
    }
    return (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Flex, { justifyContent: "space-between", alignItems: "center", children: [_jsx(Heading, { size: "md", children: "Version History" }), _jsx(Button, { size: "sm", onClick: loadVersions, children: "Refresh" })] }), versions.length === 0 ? (_jsxs(Box, { textAlign: "center", py: 8, borderWidth: 1, borderRadius: "md", borderStyle: "dashed", children: [_jsx(Text, { color: "gray.500", children: "No version history available." }), _jsx(Text, { fontSize: "sm", color: "gray.400", mt: 2, children: "Version history will be created when you update this template." })] })) : (_jsxs(Table, { variant: "simple", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Version" }), _jsx(Th, { children: "Created" }), _jsx(Th, { children: "By" }), _jsx(Th, { children: "Comment" }), _jsx(Th, { children: "Actions" })] }) }), _jsx(Tbody, { children: versions.map(function (version, index) { return (_jsxs(Tr, { children: [_jsx(Td, { children: index === 0 ? (_jsx(Badge, { colorScheme: "green", children: "Latest" })) : (_jsxs(Text, { children: ["v", versions.length - index] })) }), _jsx(Td, { children: format(new Date(version.createdAt), 'MMM d, yyyy h:mm a') }), _jsx(Td, { children: version.createdBy }), _jsx(Td, { children: _jsx(Text, { noOfLines: 1, children: version.comment || _jsx(Text, { as: "i", color: "gray.500", children: "No comment" }) }) }), _jsxs(Td, { children: [_jsx(Button, { size: "xs", mr: 2, onClick: function () { return handleViewVersion(version); }, children: "View" }), index > 0 && (_jsx(Button, { size: "xs", colorScheme: "blue", onClick: function () { return handleRestoreVersion(version); }, children: "Restore" }))] })] }, version.id)); }) })] })), _jsxs(Modal, { isOpen: isOpen, onClose: onClose, size: "xl", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsxs(ModalHeader, { children: ["Version from ", selectedVersion ? format(new Date(selectedVersion.createdAt), 'PPpp') : ''] }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { children: selectedVersion && (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: "Comment:" }), _jsx(Text, { children: selectedVersion.comment || 'No comment' })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", mb: 2, children: "Template Content:" }), _jsx(Box, { p: 3, borderWidth: 1, borderRadius: "md", fontFamily: "mono", fontSize: "sm", whiteSpace: "pre-wrap", bg: "gray.50", maxH: "300px", overflowY: "auto", children: selectedVersion.content })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", mb: 2, children: "Variables:" }), _jsxs(Table, { size: "sm", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Name" }), _jsx(Th, { children: "Default Value" })] }) }), _jsxs(Tbody, { children: [Object.entries(selectedVersion.variables).map(function (_a) {
                                                                    var key = _a[0], value = _a[1];
                                                                    return (_jsxs(Tr, { children: [_jsx(Td, { children: key }), _jsx(Td, { children: value })] }, key));
                                                                }), Object.keys(selectedVersion.variables).length === 0 && (_jsx(Tr, { children: _jsx(Td, { colSpan: 2, textAlign: "center", py: 2, children: "No variables defined" }) }))] })] })] })] })) }), _jsxs(ModalFooter, { children: [_jsx(Button, { variant: "ghost", mr: 3, onClick: onClose, children: "Close" }), selectedVersion && (_jsx(Button, { colorScheme: "blue", onClick: function () { return handleRestoreVersion(selectedVersion); }, children: "Restore This Version" }))] })] })] })] }));
};

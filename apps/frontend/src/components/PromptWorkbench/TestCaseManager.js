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
import { useState } from 'react';
import { Box, VStack, HStack, Text, Input, Button, IconButton, Table, Thead, Tbody, Tr, Th, Td, useToast, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
export var TestCaseManager = function (_a) {
    var testCases = _a.testCases, onChange = _a.onChange;
    var toast = useToast();
    var _b = useState({
        id: '',
        name: '',
        description: '',
        variables: {}
    }), newTestCase = _b[0], setNewTestCase = _b[1];
    var _c = useState(null), isEditing = _c[0], setIsEditing = _c[1];
    var _d = useState(''), newVarName = _d[0], setNewVarName = _d[1];
    var _e = useState(''), newVarValue = _e[0], setNewVarValue = _e[1];
    var handleAddTestCase = function () {
        if (!newTestCase.name.trim()) {
            toast({
                title: 'Test case name required',
                status: 'warning',
                duration: 2000,
            });
            return;
        }
        var id = isEditing || "test-".concat(Date.now());
        var updatedTestCases = isEditing
            ? testCases.map(function (tc) { return (tc.id === id ? __assign(__assign({}, newTestCase), { id: id }) : tc); })
            : __spreadArray(__spreadArray([], testCases, true), [__assign(__assign({}, newTestCase), { id: id })], false);
        onChange(updatedTestCases);
        // Reset form
        setNewTestCase({
            id: '',
            name: '',
            description: '',
            variables: {}
        });
        setIsEditing(null);
    };
    var handleDeleteTestCase = function (id) {
        onChange(testCases.filter(function (tc) { return tc.id !== id; }));
    };
    var handleEditTestCase = function (testCase) {
        setNewTestCase(testCase);
        setIsEditing(testCase.id);
    };
    var handleAddVariable = function () {
        var _a;
        if (!newVarName.trim()) {
            toast({
                title: 'Variable name required',
                status: 'warning',
                duration: 2000,
            });
            return;
        }
        setNewTestCase(__assign(__assign({}, newTestCase), { variables: __assign(__assign({}, newTestCase.variables), (_a = {}, _a[newVarName] = newVarValue, _a)) }));
        // Clear inputs
        setNewVarName('');
        setNewVarValue('');
    };
    var handleDeleteVariable = function (name) {
        var updatedVariables = __assign({}, newTestCase.variables);
        delete updatedVariables[name];
        setNewTestCase(__assign(__assign({}, newTestCase), { variables: updatedVariables }));
    };
    return (_jsxs(VStack, { spacing: 6, align: "stretch", children: [_jsx(Box, { p: 4, borderWidth: 1, borderRadius: "md", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsx(Text, { fontWeight: "bold", fontSize: "lg", children: isEditing ? 'Edit Test Case' : 'New Test Case' }), _jsx(Input, { placeholder: "Test Case Name", value: newTestCase.name, onChange: function (e) { return setNewTestCase(__assign(__assign({}, newTestCase), { name: e.target.value })); } }), _jsx(Input, { placeholder: "Description (optional)", value: newTestCase.description, onChange: function (e) { return setNewTestCase(__assign(__assign({}, newTestCase), { description: e.target.value })); } }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "medium", mb: 2, children: "Test Variables" }), _jsxs(HStack, { mb: 3, children: [_jsx(Input, { placeholder: "Variable Name", size: "sm", value: newVarName, onChange: function (e) { return setNewVarName(e.target.value); } }), _jsx(Input, { placeholder: "Value", size: "sm", value: newVarValue, onChange: function (e) { return setNewVarValue(e.target.value); } }), _jsx(Button, { size: "sm", leftIcon: _jsx(FaPlus, {}), onClick: handleAddVariable, children: "Add" })] }), _jsxs(Table, { size: "sm", variant: "simple", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Variable" }), _jsx(Th, { children: "Value" }), _jsx(Th, { width: "50px", children: "Actions" })] }) }), _jsxs(Tbody, { children: [Object.entries(newTestCase.variables).map(function (_a) {
                                                    var name = _a[0], value = _a[1];
                                                    return (_jsxs(Tr, { children: [_jsx(Td, { children: name }), _jsx(Td, { children: value }), _jsx(Td, { children: _jsx(IconButton, { "aria-label": "Delete variable", icon: _jsx(FaTrash, {}), size: "xs", colorScheme: "red", variant: "ghost", onClick: function () { return handleDeleteVariable(name); } }) })] }, name));
                                                }), Object.keys(newTestCase.variables).length === 0 && (_jsx(Tr, { children: _jsx(Td, { colSpan: 3, textAlign: "center", py: 2, children: _jsx(Text, { fontSize: "sm", color: "gray.500", children: "No variables added" }) }) }))] })] })] }), _jsx(Button, { colorScheme: "blue", alignSelf: "flex-end", onClick: handleAddTestCase, children: isEditing ? 'Update Test Case' : 'Add Test Case' })] }) }), _jsxs(Box, { children: [_jsxs(Text, { fontWeight: "bold", fontSize: "lg", mb: 4, children: ["Test Cases (", testCases.length, ")"] }), _jsx(Accordion, { allowMultiple: true, children: testCases.map(function (testCase) { return (_jsxs(AccordionItem, { children: [_jsx("h2", { children: _jsxs(AccordionButton, { children: [_jsx(Box, { flex: "1", textAlign: "left", children: _jsxs(HStack, { children: [_jsx(Text, { fontWeight: "medium", children: testCase.name }), _jsxs(Badge, { children: [Object.keys(testCase.variables).length, " variables"] })] }) }), _jsx(AccordionIcon, {})] }) }), _jsx(AccordionPanel, { pb: 4, children: _jsxs(VStack, { align: "stretch", spacing: 3, children: [testCase.description && (_jsx(Text, { fontSize: "sm", color: "gray.600", children: testCase.description })), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "medium", fontSize: "sm", mb: 1, children: "Variables:" }), _jsxs(Table, { size: "sm", variant: "simple", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Name" }), _jsx(Th, { children: "Value" })] }) }), _jsx(Tbody, { children: Object.entries(testCase.variables).map(function (_a) {
                                                                    var name = _a[0], value = _a[1];
                                                                    return (_jsxs(Tr, { children: [_jsx(Td, { children: name }), _jsx(Td, { children: value })] }, name));
                                                                }) })] })] }), _jsxs(HStack, { justifyContent: "flex-end", children: [_jsx(Button, { size: "sm", leftIcon: _jsx(FaEdit, {}), onClick: function () { return handleEditTestCase(testCase); }, children: "Edit" }), _jsx(Button, { size: "sm", colorScheme: "red", leftIcon: _jsx(FaTrash, {}), onClick: function () { return handleDeleteTestCase(testCase.id); }, children: "Delete" })] })] }) })] }, testCase.id)); }) }), testCases.length === 0 && (_jsx(Box, { textAlign: "center", py: 6, borderWidth: 1, borderRadius: "md", borderStyle: "dashed", children: _jsx(Text, { color: "gray.500", children: "No test cases added yet" }) }))] })] }));
};

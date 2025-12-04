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
import { useState } from 'react';
import { Box, VStack, HStack, Text, Input, Button, IconButton, Table, Thead, Tbody, Tr, Th, Td, useToast } from '@chakra-ui/react';
import { FaPlus, FaTrash } from 'react-icons/fa';
export var VariableManager = function (_a) {
    var variables = _a.variables, onChange = _a.onChange;
    var toast = useToast();
    var _b = useState(''), newVarName = _b[0], setNewVarName = _b[1];
    var _c = useState(''), newVarValue = _c[0], setNewVarValue = _c[1];
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
        if (variables.hasOwnProperty(newVarName)) {
            toast({
                title: 'Variable already exists',
                status: 'warning',
                duration: 2000,
            });
            return;
        }
        var updatedVariables = __assign(__assign({}, variables), (_a = {}, _a[newVarName] = newVarValue, _a));
        onChange(updatedVariables);
        // Clear the input fields
        setNewVarName('');
        setNewVarValue('');
    };
    var handleUpdateVariable = function (name, value) {
        var _a;
        var updatedVariables = __assign(__assign({}, variables), (_a = {}, _a[name] = value, _a));
        onChange(updatedVariables);
    };
    var handleDeleteVariable = function (name) {
        var updatedVariables = __assign({}, variables);
        delete updatedVariables[name];
        onChange(updatedVariables);
    };
    return (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(HStack, { children: [_jsx(Input, { placeholder: "Variable Name", value: newVarName, onChange: function (e) { return setNewVarName(e.target.value); } }), _jsx(Input, { placeholder: "Value", value: newVarValue, onChange: function (e) { return setNewVarValue(e.target.value); } }), _jsx(Button, { leftIcon: _jsx(FaPlus, {}), colorScheme: "blue", onClick: handleAddVariable, children: "Add" })] }), _jsx(Box, { border: "1px", borderColor: "gray.200", borderRadius: "md", overflow: "hidden", children: _jsxs(Table, { variant: "simple", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Variable" }), _jsx(Th, { children: "Value" }), _jsx(Th, { width: "80px", children: "Actions" })] }) }), _jsxs(Tbody, { children: [Object.entries(variables).map(function (_a) {
                                    var name = _a[0], value = _a[1];
                                    return (_jsxs(Tr, { children: [_jsx(Td, { children: _jsx(Text, { fontWeight: "medium", children: name }) }), _jsx(Td, { children: _jsx(Input, { value: value, onChange: function (e) { return handleUpdateVariable(name, e.target.value); }, size: "sm" }) }), _jsx(Td, { children: _jsx(IconButton, { "aria-label": "Delete variable", icon: _jsx(FaTrash, {}), size: "sm", colorScheme: "red", variant: "ghost", onClick: function () { return handleDeleteVariable(name); } }) })] }, name));
                                }), Object.keys(variables).length === 0 && (_jsx(Tr, { children: _jsx(Td, { colSpan: 3, children: _jsx(Text, { textAlign: "center", py: 4, color: "gray.500", children: "No variables defined" }) }) }))] })] }) })] }));
};

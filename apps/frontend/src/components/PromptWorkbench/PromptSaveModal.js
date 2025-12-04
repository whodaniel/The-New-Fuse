import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, FormControl, FormLabel, Input, Textarea, VStack } from '@chakra-ui/react';
export var PromptSaveModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onSave = _a.onSave, initialData = _a.initialData;
    var _b = useState(''), name = _b[0], setName = _b[1];
    var _c = useState(''), description = _c[0], setDescription = _c[1];
    var _d = useState(''), comment = _d[0], setComment = _d[1];
    var isUpdate = !!(initialData === null || initialData === void 0 ? void 0 : initialData.id);
    useEffect(function () {
        if (initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setComment('');
        }
        else {
            setName('');
            setDescription('');
            setComment('');
        }
    }, [initialData, isOpen]);
    var handleSave = function () {
        onSave(name, description, comment);
        onClose();
    };
    return (_jsxs(Modal, { isOpen: isOpen, onClose: onClose, size: "md", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: isUpdate ? 'Update Prompt Template' : 'Save Prompt Template' }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { children: _jsxs(VStack, { spacing: 4, children: [_jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { children: "Template Name" }), _jsx(Input, { placeholder: "Enter a name for this template", value: name, onChange: function (e) { return setName(e.target.value); } })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(Textarea, { placeholder: "Describe the purpose of this template", value: description, onChange: function (e) { return setDescription(e.target.value); }, rows: 3 })] }), isUpdate && (_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Version Comment" }), _jsx(Textarea, { placeholder: "What changed in this version? (optional)", value: comment, onChange: function (e) { return setComment(e.target.value); }, rows: 2 })] }))] }) }), _jsxs(ModalFooter, { children: [_jsx(Button, { variant: "ghost", mr: 3, onClick: onClose, children: "Cancel" }), _jsx(Button, { colorScheme: "blue", onClick: handleSave, isDisabled: !name.trim(), children: isUpdate ? 'Update' : 'Save' })] })] })] }));
};

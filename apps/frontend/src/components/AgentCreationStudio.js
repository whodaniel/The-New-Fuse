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
import { useState, useCallback } from 'react';
import { Box, Text, VStack, HStack, Button, Input, Select, SliderTrack, SliderFilledTrack, SliderThumb, Slider as ChakraSlider, useColorMode, } from '@chakra-ui/react';
var AgentCreationStudio = function (_b) {
    var onSubmit = _b.onSubmit;
    var colorMode = useColorMode().colorMode;
    var _c = useState(0), currentStep = _c[0], setCurrentStep = _c[1];
    var _d = useState({
        name: '',
        type: 'humanoid',
        status: 'idle',
        personality: {
            openness: 0.5,
            conscientiousness: 0.5,
            extraversion: 0.5,
            agreeableness: 0.5,
            neuroticism: 0.5,
        },
        skills: [],
        avatar: '',
    }), agentData = _d[0], setAgentData = _d[1];
    var handleFieldChange = useCallback(function (field, value) {
        setAgentData(function (prev) {
            var _b;
            return (Object.assign(Object.assign({}, prev), (_b = {}, _b[field] = value, _b)));
        });
    }, []);
    var handleSkillChange = useCallback(function (skill, value) {
        setAgentData(function (prev) { return (Object.assign(Object.assign({}, prev), { skills: __spreadArray(__spreadArray([], (prev.skills || []), true), [skill], false) })); });
    }, []);
    var handleTraitChange = useCallback(function (trait, value) {
        setAgentData(function (prev) {
            var _b;
            return (Object.assign(Object.assign({}, prev), { personality: prev.personality ? Object.assign(Object.assign({}, prev.personality), (_b = {}, _b[trait] = value, _b)) : undefined }));
        });
    }, []);
    var handleSubmit = useCallback(function (e) {
        e.preventDefault();
        if (agentData.name && agentData.type && agentData.status) {
            onSubmit(agentData);
        }
    }, [agentData, onSubmit]);
    var renderStep = function (step) {
        var _a;
        switch (step) {
            case 0:
                return (_jsxs(VStack, { gap: 4, children: [_jsxs(Box, { children: [_jsx(Text, { mb: 2, children: "Name" }), _jsx(Input, { value: agentData.name, onChange: function (e) { return handleFieldChange('name', e.target.value); } })] }), _jsxs(Box, { children: [_jsx(Text, { mb: 2, children: "Type" }), _jsxs(Select, { value: agentData.type, onChange: function (e) { return handleFieldChange('type', e.target.value); }, placeholder: "Select agent type", children: [_jsx("option", { value: "humanoid", children: "Humanoid" }), _jsx("option", { value: "robotic", children: "Robotic" }), _jsx("option", { value: "abstract", children: "Abstract" })] })] })] }));
            case 1:
                return (_jsx(VStack, { gap: 4, children: Object.entries(agentData.personality || {}).map(function (_b) {
                        var trait = _b[0], value = _b[1];
                        return (_jsxs(Box, { width: "100%", children: [_jsx(Text, { mb: 2, children: trait }), _jsxs(ChakraSlider, { value: value, onChange: function (val) { return handleTraitChange(trait, val); }, min: 0, max: 1, step: 0.1, children: [_jsx(SliderTrack, { children: _jsx(SliderFilledTrack, {}) }), _jsx(SliderThumb, {})] })] }, trait));
                    }) }));
            case 2:
                return (_jsxs(VStack, { gap: 4, children: [(_a = agentData.skills) === null || _a === void 0 ? void 0 : _a.map(function (skill, index) { return (_jsxs(HStack, { width: "100%", children: [_jsx(Text, { children: skill }), _jsx(Button, { onClick: function () { return setAgentData(function (prev) {
                                        var _a;
                                        return (Object.assign(Object.assign({}, prev), { skills: (_a = prev.skills) === null || _a === void 0 ? void 0 : _a.filter(function (_, i) { return i !== index; }) }));
                                    }); }, children: "Remove" })] }, index)); }), _jsx(Button, { onClick: function () { var _a; return handleSkillChange("Skill ".concat((((_a = agentData.skills) === null || _a === void 0 ? void 0 : _a.length) || 0) + 1), 0); }, children: "Add Skill" })] }));
            default:
                return null;
        }
    };
    return (_jsx(Box, { p: 4, borderWidth: "1px", borderRadius: "lg", children: _jsxs("form", { onSubmit: handleSubmit, children: [renderStep(currentStep), _jsxs(HStack, { mt: 4, gap: 4, children: [currentStep > 0 && (_jsx(Button, { onClick: function () { return setCurrentStep(function (prev) { return prev - 1; }); }, children: "Previous" })), currentStep < 2 ? (_jsx(Button, { onClick: function () { return setCurrentStep(function (prev) { return prev + 1; }); }, children: "Next" })) : (_jsx(Button, { type: "submit", colorScheme: "blue", children: "Create Agent" }))] })] }) }));
};
export default AgentCreationStudio;

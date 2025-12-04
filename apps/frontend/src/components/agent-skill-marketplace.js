import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Input, Button, Text, VStack } from '@chakra-ui/react';
export var AgentSkillMarketplace = function (_a) {
    var agentId = _a.agentId;
    var _b = useState(''), searchTerm = _b[0], setSearchTerm = _b[1];
    var skills = useState([
        { id: '1', name: 'Natural Language Processing', description: 'Advanced text processing and understanding', level: 1 },
        { id: '2', name: 'Computer Vision', description: 'Image and video analysis', level: 1 },
        { id: '3', name: 'Data Analysis', description: 'Statistical analysis and data processing', level: 1 },
    ])[0];
    var handleInstallSkill = function (skillId) {
    };
    var filteredSkills = skills.filter(function (skill) { return skill.name.toLowerCase().includes(searchTerm.toLowerCase()); });
    return (_jsxs(Box, { p: 4, children: [_jsx(Input, { placeholder: "Search skills...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, mb: 4 }), _jsx(VStack, { spacing: 2, align: "stretch", children: filteredSkills.map(function (skill) { return (_jsxs(Box, { p: 4, borderWidth: "1px", borderRadius: "md", display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { children: [_jsx(Text, { fontWeight: "bold", children: skill.name }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: skill.description })] }), _jsx(Button, { colorScheme: "blue", size: "sm", onClick: function () { return handleInstallSkill(skill.id); }, children: "Install" })] }, skill.id)); }) })] }));
};

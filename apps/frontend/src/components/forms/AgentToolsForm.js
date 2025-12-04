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
import { Checkbox, FormControl, Stack, Heading, Box, Text, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { AgentToolType } from '@the-new-fuse/types/src/agent';
export var AgentToolsForm = function (_a) {
    var selectedTools = _a.selectedTools, onChange = _a.onChange;
    var handleToolToggle = function (tool) {
        if (selectedTools.includes(tool)) {
            onChange(selectedTools.filter(function (t) { return t !== tool; }));
        }
        else {
            onChange(__spreadArray(__spreadArray([], selectedTools, true), [tool], false));
        }
    };
    var toolCategories = [
        {
            name: 'File Management',
            tools: [
                { id: AgentToolType.SAVE_FILE, label: 'Save File', description: 'Create new files with content' },
                { id: AgentToolType.EDIT_FILE, label: 'Edit File', description: 'View, create, and edit files' },
                { id: AgentToolType.REMOVE_FILES, label: 'Remove Files', description: 'Safely delete files' },
            ]
        },
        {
            name: 'Web Interaction',
            tools: [
                { id: AgentToolType.OPEN_BROWSER, label: 'Open Browser', description: 'Open URLs in the default browser' },
                { id: AgentToolType.WEB_SEARCH, label: 'Web Search', description: 'Search the web for information' },
                { id: AgentToolType.WEB_FETCH, label: 'Web Fetch', description: 'Fetch and convert webpage content to Markdown' },
            ]
        },
        {
            name: 'Process Management',
            tools: [
                { id: AgentToolType.LAUNCH_PROCESS, label: 'Launch Process', description: 'Run shell commands' },
                { id: AgentToolType.KILL_PROCESS, label: 'Kill Process', description: 'Terminate processes' },
                { id: AgentToolType.READ_PROCESS, label: 'Read Process', description: 'Read output from a terminal' },
                { id: AgentToolType.WRITE_PROCESS, label: 'Write Process', description: 'Write input to a terminal' },
                { id: AgentToolType.LIST_PROCESSES, label: 'List Processes', description: 'List all known terminals and their states' },
            ]
        },
        {
            name: 'Code Analysis',
            tools: [
                { id: AgentToolType.DIAGNOSTICS, label: 'Diagnostics', description: 'Get issues from the IDE' },
                { id: AgentToolType.CODEBASE_RETRIEVAL, label: 'Codebase Retrieval', description: 'Search the codebase for information' },
            ]
        },
        {
            name: 'Integration Tools',
            tools: [
                { id: AgentToolType.GITHUB_API, label: 'GitHub API', description: 'Interact with GitHub API' },
                { id: AgentToolType.LINEAR, label: 'Linear', description: 'Interact with Linear API' },
                { id: AgentToolType.JIRA, label: 'Jira', description: 'Interact with Jira API' },
                { id: AgentToolType.CONFLUENCE, label: 'Confluence', description: 'Interact with Confluence API' },
                { id: AgentToolType.NOTION, label: 'Notion', description: 'Interact with Notion API' },
                { id: AgentToolType.SUPABASE, label: 'Supabase', description: 'Interact with Supabase API' },
            ]
        },
        {
            name: 'Memory Tools',
            tools: [
                { id: AgentToolType.REMEMBER, label: 'Remember', description: 'Create long-term memories' },
            ]
        },
    ];
    return (_jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 4, children: "Agent Tools" }), _jsx(Text, { mb: 4, children: "Select the tools this agent can use:" }), _jsx(Accordion, { allowMultiple: true, defaultIndex: [0], children: toolCategories.map(function (category, idx) { return (_jsxs(AccordionItem, { children: [_jsx("h2", { children: _jsxs(AccordionButton, { children: [_jsx(Box, { flex: "1", textAlign: "left", fontWeight: "medium", children: category.name }), _jsx(AccordionIcon, {})] }) }), _jsx(AccordionPanel, { pb: 4, children: _jsx(Stack, { spacing: 2, children: category.tools.map(function (tool) { return (_jsx(FormControl, { children: _jsx(Checkbox, { isChecked: selectedTools.includes(tool.id), onChange: function () { return handleToolToggle(tool.id); }, children: _jsxs(Box, { children: [_jsx(Text, { fontWeight: "medium", children: tool.label }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: tool.description })] }) }) }, tool.id)); }) }) })] }, idx)); }) })] }));
};

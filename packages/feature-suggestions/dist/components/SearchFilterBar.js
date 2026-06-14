"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchFilterBar = void 0;
const react_1 = require("react");
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
const SearchFilterBar = ({ searchTerm, priority, selectedTags, availableTags, onSearchChange, onPriorityChange, onTagsChange, }) => {
    const theme = (0, material_1.useTheme)();
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            p: 2,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
        }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { size: "small", placeholder: "Search features...", value: searchTerm, onChange: (e) => onSearchChange(e.target.value), sx: { minWidth: 200 }, InputProps: {
                    'aria-label': 'Search features',
                } }), (0, jsx_runtime_1.jsx)(material_1.Autocomplete, { multiple: true, size: "small", options: PRIORITY_OPTIONS, value: priority, onChange: (_, newValue) => onPriorityChange(newValue), renderInput: (params) => ((0, jsx_runtime_1.jsx)(material_1.TextField, { ...params, placeholder: "Priority", sx: { minWidth: 150 }, InputLabelProps: {
                        shrink: true
                    } })), renderTags: (value, getTagProps) => value.map((option, index) => ((0, react_1.createElement)(material_1.Chip, { ...getTagProps({ index }), key: option, label: option, size: "small", sx: {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                    } }))) }), (0, jsx_runtime_1.jsx)(material_1.Autocomplete, { multiple: true, size: "small", options: availableTags, value: selectedTags, onChange: (_, newValue) => onTagsChange(newValue), renderInput: (params) => ((0, jsx_runtime_1.jsx)(material_1.TextField, { ...params, placeholder: "Tags", sx: { minWidth: 200 }, InputLabelProps: {
                        shrink: true
                    } })), renderTags: (value, getTagProps) => value.map((option, index) => ((0, react_1.createElement)(material_1.Chip, { ...getTagProps({ index }), key: option, label: option, size: "small" }))) })] }));
};
exports.SearchFilterBar = SearchFilterBar;
//# sourceMappingURL=SearchFilterBar.js.map
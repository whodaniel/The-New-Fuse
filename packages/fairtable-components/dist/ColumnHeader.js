import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { DataType, DATA_TYPE_OPTIONS, SINGLE_SELECT_COLOR_PALETTE, DEFAULT_COLUMN_WIDTH, NEW_COLUMN_DEFAULT_NAME } from '@the-new-fuse/fairtable-core';
import { PencilIcon, TrashIcon, ChevronDownIcon, PlusIcon, GripVerticalIcon, LinkIcon, FormulaIcon, DateIcon, AttachmentIcon, UrlIcon, EmailIcon, ClockIcon, ArrowUpIcon } from './Icons';
import Modal from './Modal';
import EditableText from './EditableText';
import SelectInput from './SelectInput';
import { generateId } from '@the-new-fuse/fairtable-utils';
const DataTypeDisplay = ({ type }) => {
    const typeInfo = DATA_TYPE_OPTIONS.find((opt) => opt.value === type);
    let iconComponent;
    switch (type) {
        case DataType.LINKED_RECORD:
            iconComponent = _jsx(LinkIcon, { className: "w-3.5 h-3.5" });
            break;
        case DataType.FORMULA:
            iconComponent = _jsx(FormulaIcon, { className: "w-3.5 h-3.5" });
            break;
        case DataType.DATE:
            iconComponent = _jsx(DateIcon, { className: "w-3.5 h-3.5" });
            break;
        case DataType.ATTACHMENT:
            iconComponent = _jsx(AttachmentIcon, { className: "w-3.5 h-3.5" });
            break;
        case DataType.URL:
            iconComponent = _jsx(UrlIcon, { className: "w-3.5 h-3.5" });
            break;
        case DataType.EMAIL:
            iconComponent = _jsx(EmailIcon, { className: "w-3.5 h-3.5" });
            break;
        case DataType.CREATED_TIME:
        case DataType.LAST_MODIFIED_TIME:
            iconComponent = _jsx(ClockIcon, { className: "w-3.5 h-3.5" });
            break;
        case DataType.VOTES:
            iconComponent = _jsx(ArrowUpIcon, { className: "w-3.5 h-3.5" });
            break;
        default: iconComponent = _jsx("span", { className: "text-xs", children: typeInfo?.icon || type.charAt(0) });
    }
    return (_jsx("span", { className: "text-slate-500 mr-1.5 flex items-center", title: typeInfo?.label, children: iconComponent }));
};
const ColumnHeader = ({ column, allTables, onUpdateColumn, onDeleteColumn, onStartResize, onColumnDragStart, onColumnDragOver, onColumnDrop, isDragTarget }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const menuRef = useRef(null);
    const headerRef = useRef(null);
    const [editingName, setEditingName] = useState(column.name);
    const [editingType, setEditingType] = useState(column.type);
    const [editingOptions, setEditingOptions] = useState(column.options || []);
    const [newOptionName, setNewOptionName] = useState('');
    const [selectedColor, setSelectedColor] = useState(SINGLE_SELECT_COLOR_PALETTE[0].value);
    const [editingLinkedTableId, setEditingLinkedTableId] = useState(column.linkedTableId);
    const [editingFormulaString, setEditingFormulaString] = useState(column.formulaString);
    useEffect(() => {
        setEditingName(column.name);
        setEditingType(column.type);
        setEditingOptions(column.options || []);
        setEditingLinkedTableId(column.linkedTableId);
        setEditingFormulaString(column.formulaString);
    }, [column, isSettingsModalOpen]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleNameSave = (newName) => {
        onUpdateColumn(column.id, { name: newName });
    };
    const handleSaveChanges = () => {
        const updates = {
            name: editingName,
            type: editingType,
        };
        if (editingType === DataType.SINGLE_SELECT) {
            updates.options = editingOptions;
        }
        else {
            updates.options = undefined;
        }
        if (editingType === DataType.LINKED_RECORD) {
            updates.linkedTableId = editingLinkedTableId;
        }
        else {
            updates.linkedTableId = undefined;
        }
        if (editingType === DataType.FORMULA) {
            updates.formulaString = editingFormulaString;
        }
        else {
            updates.formulaString = undefined;
        }
        onUpdateColumn(column.id, updates);
        setIsSettingsModalOpen(false);
    };
    const handleAddOption = () => {
        if (newOptionName.trim() === '')
            return;
        setEditingOptions([...editingOptions, { id: generateId(), name: newOptionName.trim(), colorClass: selectedColor }]);
        setNewOptionName('');
    };
    const handleRemoveOption = (optionId) => {
        setEditingOptions(editingOptions.filter(opt => opt.id !== optionId));
    };
    const dataTypeOptionsForSelect = DATA_TYPE_OPTIONS.map((dt) => ({
        value: dt.value,
        label: (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2 w-4_", children: dt.icon }), _jsx("span", { children: dt.label })] }))
    }));
    const tableOptionsForSelect = allTables
        .filter((t) => t.id !== column.id)
        .map((t) => ({ value: t.id, label: t.name }));
    const readOnlyColumnType = column.type === DataType.CREATED_TIME || column.type === DataType.LAST_MODIFIED_TIME || column.type === DataType.VOTES;
    return (_jsxs("th", { ref: headerRef, draggable: !readOnlyColumnType, onDragStart: (e) => !readOnlyColumnType && onColumnDragStart(e, column.id), onDragOver: (e) => !readOnlyColumnType && onColumnDragOver(e, column.id), onDrop: (e) => !readOnlyColumnType && onColumnDrop(e, column.id), className: `sticky top-0 z-10 bg-slate-50 p-0 border-b border-r border-slate-300 select-none group relative ${isDragTarget ? 'bg-sky-100' : ''}`, style: { minWidth: `${column.width || DEFAULT_COLUMN_WIDTH}px`, width: `${column.width || DEFAULT_COLUMN_WIDTH}px` }, title: column.name, children: [_jsxs("div", { className: "flex items-center justify-between h-full px-2 py-2", children: [!readOnlyColumnType && (_jsx("div", { className: "flex items-center cursor-grab mr-1 text-slate-400 group-hover:text-slate-500", title: "Drag to reorder", children: _jsx(GripVerticalIcon, { className: "w-3 h-5" }) })), _jsxs("div", { className: "flex items-center overflow-hidden flex-grow", children: [_jsx(DataTypeDisplay, { type: column.type }), _jsx(EditableText, { initialValue: column.name, onSave: handleNameSave, className: "font-semibold text-sm text-slate-700 truncate hover:bg-slate-200", inputClassName: "text-sm font-semibold", placeholder: NEW_COLUMN_DEFAULT_NAME, disabled: readOnlyColumnType && column.type !== DataType.VOTES /* Votes name can be edited */ })] }), !(column.type === DataType.CREATED_TIME || column.type === DataType.LAST_MODIFIED_TIME) && ( // No menu for pure read-only types
                    _jsxs("div", { ref: menuRef, className: "relative", children: [_jsx("button", { onClick: () => setIsMenuOpen(!isMenuOpen), className: "p-1 rounded hover:bg-slate-300 text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity", "aria-label": "Column options", children: _jsx(ChevronDownIcon, { className: "w-4 h-4" }) }), isMenuOpen && (_jsxs("div", { className: "absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg py-1 z-20 border border-slate-200", children: [column.type !== DataType.VOTES && /* Votes type cannot be changed from menu */ (_jsxs("button", { onClick: () => { setIsSettingsModalOpen(true); setIsMenuOpen(false); }, className: "w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center", children: [_jsx(PencilIcon, { className: "w-4 h-4 mr-2" }), " Edit column property"] })), _jsx("div", { className: "my-1 border-t border-slate-200" }), _jsxs("button", { onClick: () => { onDeleteColumn(column.id); setIsMenuOpen(false); }, className: "w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center", children: [_jsx(TrashIcon, { className: "w-4 h-4 mr-2" }), " Delete column"] })] }))] }))] }), !readOnlyColumnType && (_jsx("div", { className: "absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-sky-400 transition-opacity", onMouseDown: (e) => onStartResize(column.id, e.clientX), title: "Resize column" })), _jsx(Modal, { isOpen: isSettingsModalOpen && column.type !== DataType.VOTES, onClose: () => setIsSettingsModalOpen(false), title: `Edit Column: ${column.name}`, size: "lg", footer: _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: () => setIsSettingsModalOpen(false), className: "px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleSaveChanges, className: "px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors", children: "Save Changes" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "columnName", className: "block text-sm font-medium text-slate-700 mb-1", children: "Column Name" }), _jsx("input", { id: "columnName", type: "text", value: editingName, onChange: (e) => setEditingName(e.target.value), className: "w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "columnType", className: "block text-sm font-medium text-slate-700 mb-1", children: "Column Type" }), _jsx(SelectInput, { options: dataTypeOptionsForSelect.filter(dt => dt.value !== DataType.VOTES && dt.value !== DataType.CREATED_TIME && dt.value !== DataType.LAST_MODIFIED_TIME), value: editingType, onChange: (val) => setEditingType(val) })] }), editingType === DataType.SINGLE_SELECT && (_jsxs("div", { className: "border-t border-slate-200 pt-4 mt-4", children: [_jsx("h4", { className: "text-sm font-medium text-slate-700 mb-2", children: "Options" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2", children: editingOptions.map((opt) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-slate-50 rounded", children: [_jsx("span", { className: `px-2 py-0.5 text-xs rounded-full ${opt.colorClass}`, children: opt.name }), _jsx("button", { onClick: () => handleRemoveOption(opt.id), className: "text-red-500 hover:text-red-700", "aria-label": "Remove option", children: _jsx(TrashIcon, { className: "w-4 h-4" }) })] }, opt.id))) }), _jsxs("div", { className: "mt-3 flex items-center space-x-2", children: [_jsx("input", { type: "text", value: newOptionName, onChange: (e) => setNewOptionName(e.target.value), placeholder: "New option name", className: "flex-grow px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" }), _jsx(SelectInput, { options: SINGLE_SELECT_COLOR_PALETTE.map((c) => ({ value: c.value, label: _jsx("span", { className: `px-2 py-0.5 text-xs rounded-full ${c.value}`, children: c.name }) })), value: selectedColor, onChange: (val) => setSelectedColor(val), className: "w-36" }), _jsx("button", { onClick: handleAddOption, className: "p-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors", title: "Add option", children: _jsx(PlusIcon, { className: "w-5 h-5" }) })] })] })), editingType === DataType.LINKED_RECORD && (_jsxs("div", { className: "border-t border-slate-200 pt-4 mt-4", children: [_jsx("label", { htmlFor: "linkedTable", className: "block text-sm font-medium text-slate-700 mb-1", children: "Link to Table" }), _jsx(SelectInput, { options: tableOptionsForSelect, value: editingLinkedTableId, onChange: (val) => setEditingLinkedTableId(val), placeholder: "Select a table to link..." }), tableOptionsForSelect.length === 0 && _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "No other tables available to link." })] })), editingType === DataType.FORMULA && (_jsxs("div", { className: "border-t border-slate-200 pt-4 mt-4", children: [_jsx("label", { htmlFor: "formulaString", className: "block text-sm font-medium text-slate-700 mb-1", children: "Formula" }), _jsx("textarea", { id: "formulaString", value: editingFormulaString || '', onChange: (e) => setEditingFormulaString(e.target.value), placeholder: "e.g., {Field A} + {Field B}", className: "w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm custom-scrollbar", rows: 3 }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Note: Formula evaluation is not yet fully implemented." })] }))] }) })] }));
};
export default ColumnHeader;
//# sourceMappingURL=ColumnHeader.js.map
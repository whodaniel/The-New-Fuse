import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataType, evaluateFormula } from '@the-new-fuse/fairtable-core';
import SelectInput from './SelectInput';
import { PencilIcon, TrashIcon, PlusIcon, ArrowUpIcon } from './Icons';
import { generateId } from '@the-new-fuse/fairtable-utils';
const formatDateForInput = (isoDateString) => {
    if (!isoDateString)
        return '';
    try {
        return new Date(isoDateString).toISOString().split('T')[0];
    }
    catch (e) {
        return '';
    }
};
const formatDateTimeForDisplay = (isoDateString) => {
    if (!isoDateString)
        return '';
    try {
        return new Date(isoDateString).toLocaleString();
    }
    catch (e) {
        return 'Invalid Date';
    }
};
const TableCell = ({ value, row, column, appState, onUpdateCell, onOpenLinkRecordModal }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef(null);
    const selectRef = useRef(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);
    useEffect(() => {
        if (isEditing && (column.type === DataType.TEXT || column.type === DataType.NUMBER || column.type === DataType.LONG_TEXT || column.type === DataType.DATE || column.type === DataType.URL || column.type === DataType.EMAIL)) {
            inputRef.current?.focus();
            if (inputRef.current instanceof HTMLInputElement) {
                inputRef.current.select();
            }
        }
    }, [isEditing, column.type]);
    const handleSave = useCallback(() => {
        if (currentValue !== value) {
            let finalValue = currentValue;
            if (column.type === DataType.NUMBER || column.type === DataType.VOTES) { // Votes are numbers
                const num = parseFloat(String(currentValue));
                finalValue = isNaN(num) ? 0 : num; // Default to 0 for votes if invalid
            }
            else if (column.type === DataType.DATE) {
                finalValue = currentValue ? new Date(currentValue).toISOString() : null;
            }
            onUpdateCell(finalValue);
        }
        setIsEditing(false);
    }, [currentValue, value, column.type, onUpdateCell]);
    const handleBlur = (e) => {
        if (column.type === DataType.SINGLE_SELECT && selectRef.current?.contains(e.relatedTarget)) {
            return;
        }
        if (column.type === DataType.LONG_TEXT && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
            return;
        }
        if (column.type !== DataType.ATTACHMENT) {
            handleSave();
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !(e.shiftKey && column.type === DataType.LONG_TEXT)) {
            e.preventDefault();
            handleSave();
        }
        else if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };
    const isReadOnly = column.type === DataType.FORMULA ||
        column.type === DataType.CREATED_TIME ||
        column.type === DataType.LAST_MODIFIED_TIME ||
        column.type === DataType.VOTES; // Votes are edited via button
    const handleDoubleClick = () => {
        if (!isReadOnly && column.type !== DataType.BOOLEAN && column.type !== DataType.LINKED_RECORD && column.type !== DataType.ATTACHMENT && column.type !== DataType.VOTES) {
            setIsEditing(true);
        }
    };
    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newAttachments = Array.from(files).map(file => ({
                id: generateId(),
                name: file.name,
                url: '',
                type: file.type,
                size: file.size,
            }));
            const existingAttachments = Array.isArray(currentValue) ? currentValue : [];
            onUpdateCell([...existingAttachments, ...newAttachments]);
        }
    };
    const removeAttachment = (fileId) => {
        const updatedAttachments = (Array.isArray(currentValue) ? currentValue : []).filter(f => f.id !== fileId);
        onUpdateCell(updatedAttachments);
    };
    const handleUpvote = () => {
        if (column.type === DataType.VOTES) {
            const currentVotes = typeof value === 'number' ? value : 0;
            onUpdateCell(currentVotes + 1);
        }
    };
    const renderEditingControl = () => {
        switch (column.type) {
            case DataType.TEXT:
                return (_jsx("input", { ref: inputRef, type: "text", value: String(currentValue ?? ''), onChange: (e) => setCurrentValue(e.target.value), onBlur: handleBlur, onKeyDown: handleKeyDown, className: "w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm" }));
            case DataType.NUMBER: // Also used by VOTES internally for editing if ever enabled
                return (_jsx("input", { ref: inputRef, type: "number", value: String(currentValue ?? ''), onChange: (e) => setCurrentValue(e.target.value), onBlur: handleBlur, onKeyDown: handleKeyDown, className: "w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm text-right" }));
            case DataType.LONG_TEXT:
                return (_jsx("textarea", { ref: inputRef, value: String(currentValue ?? ''), onChange: (e) => setCurrentValue(e.target.value), onBlur: handleBlur, onKeyDown: handleKeyDown, className: "w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm resize-none absolute top-0 left-0 custom-scrollbar z-10", style: { minHeight: '80px' } }));
            case DataType.DATE:
                return (_jsx("input", { ref: inputRef, type: "date", value: formatDateForInput(currentValue), onChange: (e) => setCurrentValue(e.target.value ? new Date(e.target.value).toISOString() : null), onBlur: handleBlur, onKeyDown: handleKeyDown, className: "w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm" }));
            case DataType.URL:
                return (_jsx("input", { ref: inputRef, type: "url", value: String(currentValue ?? ''), onChange: (e) => setCurrentValue(e.target.value), onBlur: handleBlur, onKeyDown: handleKeyDown, placeholder: "https://example.com", className: "w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm" }));
            case DataType.EMAIL:
                return (_jsx("input", { ref: inputRef, type: "email", value: String(currentValue ?? ''), onChange: (e) => setCurrentValue(e.target.value), onBlur: handleBlur, onKeyDown: handleKeyDown, placeholder: "name@example.com", className: "w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm" }));
            case DataType.SINGLE_SELECT:
                const selectOptions = (column.options || []).map((opt) => ({
                    value: opt.id,
                    label: _jsx("span", { className: `px-2 py-0.5 text-xs rounded-full ${opt.colorClass}`, children: opt.name }),
                    colorClass: opt.colorClass,
                }));
                return (_jsx("div", { ref: selectRef, className: "w-full h-full p-0.5 bg-sky-100", children: _jsx(SelectInput, { options: [{ value: '', label: _jsx("span", { className: "text-slate-400", children: "Clear selection" }) }, ...selectOptions], value: currentValue, onChange: (val) => {
                            const finalVal = val === '' ? null : val;
                            setCurrentValue(finalVal);
                            onUpdateCell(finalVal);
                            setIsEditing(false);
                        }, className: "h-full" }) }));
            default:
                if (Array.isArray(currentValue)) {
                    return currentValue.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(", ");
                }
                return String(currentValue ?? '');
        }
    };
    const renderViewControl = () => {
        const emptyDisplay = _jsx("span", { className: "text-slate-400 italic", children: "Empty" });
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            if (column.type === DataType.BOOLEAN || column.type === DataType.ATTACHMENT || column.type === DataType.LINKED_RECORD || column.type === DataType.VOTES) {
                // Votes will show 0 if null/undefined
            }
            else {
                return emptyDisplay;
            }
        }
        switch (column.type) {
            case DataType.BOOLEAN:
                return (_jsx("div", { className: "w-full h-full flex items-center justify-center p-2", onClick: () => !isReadOnly && onUpdateCell(!value), children: _jsx("input", { type: "checkbox", readOnly: true, checked: !!value, className: `form-checkbox h-5 w-5 text-sky-600 rounded border-slate-400 focus:ring-sky-500 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}` }) }));
            case DataType.SINGLE_SELECT:
                const selectedOption = (column.options || []).find((opt) => opt.id === value);
                return selectedOption ?
                    _jsx("span", { className: `px-2 py-0.5 text-xs rounded-full ${selectedOption.colorClass}`, children: selectedOption.name })
                    : emptyDisplay;
            case DataType.TEXT:
                return _jsx("span", { className: "truncate", children: String(value) });
            case DataType.LONG_TEXT:
                return _jsx("span", { className: "whitespace-normal break-words", children: String(value) });
            case DataType.NUMBER:
                return _jsx("span", { className: "text-right w-full block", children: String(value) });
            case DataType.VOTES:
                const voteCount = typeof value === 'number' ? value : 0;
                return (_jsxs("div", { className: "flex items-center justify-between w-full group", children: [_jsx("span", { className: "text-right flex-grow pr-2", children: voteCount }), _jsx("button", { onClick: handleUpvote, className: "p-1 rounded text-sky-500 hover:bg-sky-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity", title: "Upvote", children: _jsx(ArrowUpIcon, { className: "w-4 h-4" }) })] }));
            case DataType.DATE:
                return _jsx("span", { children: formatDateTimeForDisplay(value) });
            case DataType.URL:
                return _jsx("a", { href: String(value).startsWith('http') ? String(value) : `http://${String(value)}`, target: "_blank", rel: "noopener noreferrer", className: "text-sky-600 hover:text-sky-700 hover:underline truncate block", children: String(value) });
            case DataType.EMAIL:
                return _jsx("a", { href: `mailto:${String(value)}`, className: "text-sky-600 hover:text-sky-700 hover:underline truncate block", children: String(value) });
            case DataType.LINKED_RECORD: {
                const currentLinkedIds = Array.isArray(value) ? value : [];
                if (currentLinkedIds.length === 0) {
                    return (_jsx("button", { onClick: () => column.linkedTableId && onOpenLinkRecordModal(row.id, column.id, column.linkedTableId, []), className: "w-full h-full flex items-center justify-center text-slate-400 hover:text-sky-600 rounded", title: "Link records", children: _jsx(PlusIcon, { className: "w-4 h-4" }) }));
                }
                const linkedTable = appState.tables.find((t) => t.id === column.linkedTableId);
                const primaryColumnOfLinkedTable = linkedTable?.columns.find((c) => c.id === linkedTable.columnOrder[0]);
                return (_jsx("button", { onClick: () => column.linkedTableId && onOpenLinkRecordModal(row.id, column.id, column.linkedTableId, currentLinkedIds), className: "w-full h-full flex flex-col items-start text-left text-sky-600 hover:text-sky-700 hover:bg-sky-50 p-1 rounded", children: currentLinkedIds.map(linkedId => {
                        const linkedRow = linkedTable?.rows.find((r) => r.id === linkedId);
                        let displayValue = linkedId;
                        if (linkedRow && primaryColumnOfLinkedTable) {
                            displayValue = String(linkedRow.data[primaryColumnOfLinkedTable.id] ?? linkedId);
                        }
                        return _jsx("span", { className: "text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full my-0.5 truncate max-w-full", children: displayValue }, linkedId);
                    }) }));
            }
            case DataType.FORMULA:
                const activeTable = appState.tables.find((t) => t.id === appState.activeTableId);
                const formulaResult = evaluateFormula(column.formulaString || '', row, activeTable?.columns || [], activeTable?.rows || [], appState.tables);
                let formulaDisplayValue;
                if (formulaResult.value === null || formulaResult.value === undefined) {
                    formulaDisplayValue = 'Empty';
                }
                else if (Array.isArray(formulaResult.value)) {
                    formulaDisplayValue = formulaResult.value.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(', ');
                }
                else if (typeof formulaResult.value === 'object') {
                    formulaDisplayValue = JSON.stringify(formulaResult.value);
                }
                else {
                    formulaDisplayValue = String(formulaResult.value);
                }
                return _jsx("span", { className: "text-slate-700 italic truncate", children: formulaResult.error ? `⚠️ ${formulaResult.error}` : formulaDisplayValue });
            case DataType.ATTACHMENT:
                const attachments = Array.isArray(value) ? value : [];
                return (_jsxs("div", { className: "w-full h-full p-1 space-y-0.5", children: [attachments.map(file => (_jsxs("div", { className: "flex items-center justify-between text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full group", children: [_jsx("span", { className: "truncate", children: file.name }), _jsx("button", { onClick: () => removeAttachment(file.id), className: "ml-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100", "aria-label": `Remove attachment ${file.name}`, children: _jsx(TrashIcon, { className: "w-3 h-3" }) })] }, file.id))), _jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "w-full flex items-center justify-center text-slate-400 hover:text-sky-600 rounded text-xs py-0.5", title: "Add attachment", children: [_jsx(PlusIcon, { className: "w-3.5 h-3.5" }), " Add"] }), _jsx("input", { type: "file", ref: fileInputRef, multiple: true, onChange: handleFileChange, className: "hidden" })] }));
            case DataType.CREATED_TIME:
            case DataType.LAST_MODIFIED_TIME:
                return _jsx("span", { className: "text-slate-500", children: formatDateTimeForDisplay(value) });
            default:
                if (Array.isArray(value)) {
                    return value.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(", ");
                }
                return String(value ?? '');
        }
    };
    if (isEditing && !isReadOnly && column.type !== DataType.BOOLEAN && column.type !== DataType.ATTACHMENT && column.type !== DataType.VOTES) {
        return (_jsx("td", { className: "p-0 border-b border-r border-slate-300 relative", children: renderEditingControl() }));
    }
    return (_jsxs("td", { onDoubleClick: handleDoubleClick, className: `p-0 border-b border-r border-slate-300 text-sm text-slate-700 relative group 
                  ${isReadOnly ? 'bg-slate-50' : 'cursor-default'}
                  ${column.type === DataType.ATTACHMENT || column.type === DataType.LINKED_RECORD || column.type === DataType.VOTES ? '' : 'truncate'}`, style: { lineHeight: '1.5rem' }, children: [_jsx("div", { className: "h-full w-full p-2 overflow-hidden", children: renderViewControl() }), !isReadOnly && column.type !== DataType.BOOLEAN && column.type !== DataType.LINKED_RECORD && column.type !== DataType.ATTACHMENT && column.type !== DataType.VOTES && (_jsx("button", { className: "absolute top-0.5 right-0.5 p-0.5 bg-slate-100 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-slate-500 hover:text-slate-700", onClick: () => setIsEditing(true), "aria-label": "Edit cell", children: _jsx(PencilIcon, { className: "w-3 h-3" }) }))] }));
};
export default React.memo(TableCell);
//# sourceMappingURL=TableCell.js.map
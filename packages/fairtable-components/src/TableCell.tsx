
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Column, DataType, CellValue, SelectOption as ColumnSelectOption, AttachmentFile, AppState, Table, Row, evaluateFormula } from '@the-new-fuse/fairtable-core';
import SelectInput, { SelectOptionItem } from './SelectInput';
import { PencilIcon, LinkIcon, TrashIcon, PlusIcon, ArrowUpIcon } from './Icons'; 
import { generateId } from '@the-new-fuse/fairtable-utils';
 

interface TableCellProps {
  value: CellValue;
  row: Row; 
  column: Column;
  appState: AppState; 
  onUpdateCell: (newValue: CellValue) => void;
  onOpenLinkRecordModal: (
    rowId: string, 
    columnId: string, 
    linkedTableId: string, 
    currentLinkedIds: string[]
  ) => void;
}

const formatDateForInput = (isoDateString: string | null | undefined): string => {
  if (!isoDateString) return '';
  try {
    return new Date(isoDateString).toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

const formatDateTimeForDisplay = (isoDateString: string | null | undefined): string => {
  if (!isoDateString) return '';
  try {
    return new Date(isoDateString).toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
};


const TableCell: React.FC<TableCellProps> = ({ value, row, column, appState, onUpdateCell, onOpenLinkRecordModal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState<CellValue>(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


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
      } else if (column.type === DataType.DATE) {
        finalValue = currentValue ? new Date(currentValue as string).toISOString() : null;
      }
      onUpdateCell(finalValue);
    }
    setIsEditing(false);
  }, [currentValue, value, column.type, onUpdateCell]);

  const handleBlur = (e: React.FocusEvent) => {
    if (column.type === DataType.SINGLE_SELECT && selectRef.current?.contains(e.relatedTarget as Node)) {
        return;
    }
    if (column.type === DataType.LONG_TEXT && e.relatedTarget && (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
        return;
    }
    if (column.type !== DataType.ATTACHMENT) { 
        handleSave();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.shiftKey && column.type === DataType.LONG_TEXT)) { 
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value); 
      setIsEditing(false);
    }
  };

  const isReadOnly = column.type === DataType.FORMULA || 
                     column.type === DataType.CREATED_TIME || 
                     column.type === DataType.LAST_MODIFIED_TIME ||
                     column.type === DataType.VOTES; // Votes are edited via button

  const handleDoubleClick = () => {
    if (!isReadOnly && column.type !== DataType.BOOLEAN && column.type !== DataType.LINKED_RECORD && column.type !== DataType.ATTACHMENT && column.type !== DataType.VOTES ) {
        setIsEditing(true);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
        id: generateId(),
        name: file.name,
        url: '', 
        type: file.type,
        size: file.size,
      }));
      const existingAttachments = Array.isArray(currentValue) ? currentValue as AttachmentFile[] : [];
      onUpdateCell([...existingAttachments, ...newAttachments]);
    }
  };

  const removeAttachment = (fileId: string) => {
    const updatedAttachments = (Array.isArray(currentValue) ? currentValue as AttachmentFile[] : []).filter(f => f.id !== fileId);
    onUpdateCell(updatedAttachments);
  };

  const handleUpvote = () => {
    if (column.type === DataType.VOTES) {
        const currentVotes = typeof value === 'number' ? value : 0;
        onUpdateCell(currentVotes + 1);
    }
  };

  const renderEditingControl = (): React.ReactNode => {
    switch (column.type) {
      case DataType.TEXT:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>} type="text"
            value={String(currentValue ?? '')} onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur} onKeyDown={handleKeyDown}
            className="w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm"
          />);
      case DataType.NUMBER: // Also used by VOTES internally for editing if ever enabled
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>} type="number"
            value={String(currentValue ?? '')} onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur} onKeyDown={handleKeyDown}
            className="w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm text-right"
          />);
      case DataType.LONG_TEXT:
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={String(currentValue ?? '')} onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur} onKeyDown={handleKeyDown}
            className="w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm resize-none absolute top-0 left-0 custom-scrollbar z-10"
            style={{ minHeight: '80px' }}
          />);
      case DataType.DATE:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>} type="date"
            value={formatDateForInput(currentValue as string | null)}
            onChange={(e) => setCurrentValue(e.target.value ? new Date(e.target.value).toISOString() : null)}
            onBlur={handleBlur} onKeyDown={handleKeyDown}
            className="w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm"
          />);
      case DataType.URL:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>} type="url"
            value={String(currentValue ?? '')} onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur} onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            className="w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm"
          />);
      case DataType.EMAIL:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>} type="email"
            value={String(currentValue ?? '')} onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur} onKeyDown={handleKeyDown}
            placeholder="name@example.com"
            className="w-full h-full p-2 border-2 border-sky-500 outline-none box-border text-sm"
          />);
      case DataType.SINGLE_SELECT:
        const selectOptions: SelectOptionItem[] = (column.options || []).map((opt: ColumnSelectOption) => ({
          value: opt.id,
          label: <span className={`px-2 py-0.5 text-xs rounded-full ${opt.colorClass}`}>{opt.name}</span>,
          colorClass: opt.colorClass,
        }));
        return (
          <div ref={selectRef} className="w-full h-full p-0.5 bg-sky-100">
            <SelectInput
              options={[{value: '', label: <span className="text-slate-400">Clear selection</span>}, ...selectOptions]}
              value={currentValue as string | undefined}
              onChange={(val) => {
                const finalVal = val === '' ? null : val;
                setCurrentValue(finalVal);
                onUpdateCell(finalVal); 
                setIsEditing(false);
              }}
              className="h-full"
            />
          </div>);
      default:
        if (Array.isArray(currentValue)) {
          return (currentValue as any[]).map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(", ");
        }
        return String(currentValue ?? '');
    }
  };

  const renderViewControl = (): React.ReactNode => {
    const emptyDisplay = <span className="text-slate-400 italic">Empty</span>;
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        if (column.type === DataType.BOOLEAN || column.type === DataType.ATTACHMENT || column.type === DataType.LINKED_RECORD || column.type === DataType.VOTES) { 
            // Votes will show 0 if null/undefined
        } else { return emptyDisplay; }
    }

    switch (column.type) {
      case DataType.BOOLEAN:
        return (
          <div className="w-full h-full flex items-center justify-center p-2" onClick={() => !isReadOnly && onUpdateCell(!value)}>
            <input type="checkbox" readOnly checked={!!value} className={`form-checkbox h-5 w-5 text-sky-600 rounded border-slate-400 focus:ring-sky-500 ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`} />
          </div>);
      case DataType.SINGLE_SELECT:
        const selectedOption = (column.options || []).find((opt: ColumnSelectOption) => opt.id === value);
        return selectedOption ? 
          <span className={`px-2 py-0.5 text-xs rounded-full ${selectedOption.colorClass}`}>{selectedOption.name}</span> 
          : emptyDisplay;
      case DataType.TEXT:
        return <span className="truncate">{String(value)}</span>;
      case DataType.LONG_TEXT:
        return <span className="whitespace-normal break-words">{String(value)}</span>;
      case DataType.NUMBER:
        return <span className="text-right w-full block">{String(value)}</span>;
      case DataType.VOTES:
        const voteCount = typeof value === 'number' ? value : 0;
        return (
            <div className="flex items-center justify-between w-full group">
                <span className="text-right flex-grow pr-2">{voteCount}</span>
                <button
                    onClick={handleUpvote}
                    className="p-1 rounded text-sky-500 hover:bg-sky-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Upvote"
                >
                    <ArrowUpIcon className="w-4 h-4" />
                </button>
            </div>
        );
      case DataType.DATE:
        return <span>{formatDateTimeForDisplay(value as string)}</span>;
      case DataType.URL:
        return <a href={String(value).startsWith('http') ? String(value) : `http://${String(value)}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 hover:underline truncate block">{String(value)}</a>;
      case DataType.EMAIL:
        return <a href={`mailto:${String(value)}`} className="text-sky-600 hover:text-sky-700 hover:underline truncate block">{String(value)}</a>;
      case DataType.LINKED_RECORD: {
        const currentLinkedIds: string[] = Array.isArray(value) ? (value as string[]) : [];
        if (currentLinkedIds.length === 0) {
          return (
            <button 
                onClick={() => column.linkedTableId && onOpenLinkRecordModal(row.id, column.id, column.linkedTableId, [])}
                className="w-full h-full flex items-center justify-center text-slate-400 hover:text-sky-600 rounded"
                title="Link records"
            >
                <PlusIcon className="w-4 h-4" />
            </button>
          );
        }
        
        const linkedTable = appState.tables.find((t: Table) => t.id === column.linkedTableId);
        const primaryColumnOfLinkedTable = linkedTable?.columns.find((c: Column) => c.id === linkedTable.columnOrder[0]);

        return (
            <button 
                onClick={() => column.linkedTableId && onOpenLinkRecordModal(row.id, column.id, column.linkedTableId, currentLinkedIds)}
                className="w-full h-full flex flex-col items-start text-left text-sky-600 hover:text-sky-700 hover:bg-sky-50 p-1 rounded"
            >
                {currentLinkedIds.map(linkedId => {
                    const linkedRow = linkedTable?.rows.find((r: Row) => r.id === linkedId);
                    let displayValue = linkedId;
                    if (linkedRow && primaryColumnOfLinkedTable) {
                        displayValue = String(linkedRow.data[primaryColumnOfLinkedTable.id] ?? linkedId);
                    }
                    return <span key={linkedId} className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full my-0.5 truncate max-w-full">{displayValue}</span>;
                })}
            </button>
        );
      }
      case DataType.FORMULA:
        const activeTable = appState.tables.find((t: Table) => t.id === appState.activeTableId); 
        const formulaResult = evaluateFormula(column.formulaString || '', row, activeTable?.columns || [], activeTable?.rows || [], appState.tables);
        
        let formulaDisplayValue: React.ReactNode;
        if (formulaResult.value === null || formulaResult.value === undefined) {
            formulaDisplayValue = 'Empty';
        } else if (Array.isArray(formulaResult.value)) {
            formulaDisplayValue = formulaResult.value.map((i: any) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(', ');
        } else if (typeof formulaResult.value === 'object') {
            formulaDisplayValue = JSON.stringify(formulaResult.value);
        } else {
            formulaDisplayValue = String(formulaResult.value);
        }
        
        return <span className="text-slate-700 italic truncate">{formulaResult.error ? `⚠️ ${formulaResult.error}` : formulaDisplayValue}</span>;
      case DataType.ATTACHMENT:
        const attachments = Array.isArray(value) ? value as AttachmentFile[] : [];
        return (
            <div className="w-full h-full p-1 space-y-0.5">
                {attachments.map(file => (
                    <div key={file.id} className="flex items-center justify-between text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full group">
                        <span className="truncate">{file.name}</span>
                        <button onClick={() => removeAttachment(file.id)} className="ml-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100" aria-label={`Remove attachment ${file.name}`}>
                            <TrashIcon className="w-3 h-3"/>
                        </button>
                    </div>
                ))}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center text-slate-400 hover:text-sky-600 rounded text-xs py-0.5"
                    title="Add attachment"
                >
                    <PlusIcon className="w-3.5 h-3.5"/> Add
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        );
      case DataType.CREATED_TIME:
      case DataType.LAST_MODIFIED_TIME:
        return <span className="text-slate-500">{formatDateTimeForDisplay(value as string)}</span>;
      default:
        if (Array.isArray(value)) {
          return value.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(", ");
        }
        return String(value ?? '');
    }
  };

  if (isEditing && !isReadOnly && column.type !== DataType.BOOLEAN && column.type !== DataType.ATTACHMENT && column.type !== DataType.VOTES) {
    return (
      <td className="p-0 border-b border-r border-slate-300 relative">
        {renderEditingControl()}
      </td>
    );
  }

  return (
    <td
      onDoubleClick={handleDoubleClick}
      className={`p-0 border-b border-r border-slate-300 text-sm text-slate-700 relative group 
                  ${isReadOnly ? 'bg-slate-50' : 'cursor-default'}
                  ${column.type === DataType.ATTACHMENT || column.type === DataType.LINKED_RECORD || column.type === DataType.VOTES ? '' : 'truncate'}`}
      style={{ lineHeight: '1.5rem' }} 
    >
      <div className="h-full w-full p-2 overflow-hidden">
        {renderViewControl()}
      </div>
      {!isReadOnly && column.type !== DataType.BOOLEAN && column.type !== DataType.LINKED_RECORD && column.type !== DataType.ATTACHMENT && column.type !== DataType.VOTES && (
        <button className="absolute top-0.5 right-0.5 p-0.5 bg-slate-100 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-slate-500 hover:text-slate-700"
             onClick={() => setIsEditing(true)}
             aria-label="Edit cell"
        >
            <PencilIcon className="w-3 h-3" />
        </button>
      )}
    </td>
  );
};

export default React.memo(TableCell);

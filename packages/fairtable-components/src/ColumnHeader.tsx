
import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { Column, DataType, SelectOption as ColumnSelectOption, Table, AppState } from "../../fairtable-core/src";
import { DATA_TYPE_OPTIONS, SINGLE_SELECT_COLOR_PALETTE, DEFAULT_COLUMN_WIDTH, NEW_COLUMN_DEFAULT_NAME, DATA_TYPE_ICONS } from '../../fairtable-core/src';
import { PencilIcon, TrashIcon, ChevronDownIcon, PlusIcon, GripVerticalIcon, LinkIcon, FormulaIcon, DateIcon, AttachmentIcon, UrlIcon, EmailIcon, ClockIcon, ArrowUpIcon } from './Icons';
import Modal from './Modal';
import EditableText from './EditableText';
import SelectInput, { SelectOptionItem } from './SelectInput';
import { generateId } from '../../fairtable-utils/src';

interface ColumnHeaderProps {
  column: Column;
  allTables: Table[]; // Needed for LINKED_RECORD type to select target table
  onUpdateColumn: (columnId: string, updates: Partial<Column>) => void;
  onDeleteColumn: (columnId: string) => void;
  onStartResize: (columnId: string, startX: number) => void;
  onColumnDragStart: (e: DragEvent<HTMLTableCellElement>, columnId: string) => void;
  onColumnDragOver: (e: DragEvent<HTMLTableCellElement>, columnId: string) => void;
  onColumnDrop: (e: DragEvent<HTMLTableCellElement>, columnId: string) => void;
  isDragTarget: boolean;
}

const DataTypeDisplay: React.FC<{type: DataType}> = ({ type }) => {
  const typeInfo = DATA_TYPE_OPTIONS.find((opt: any) => opt.value === type);
  let iconComponent;
  switch(type) {
    case DataType.LINKED_RECORD: iconComponent = <LinkIcon className="w-3.5 h-3.5" />; break;
    case DataType.FORMULA: iconComponent = <FormulaIcon className="w-3.5 h-3.5" />; break;
    case DataType.DATE: iconComponent = <DateIcon className="w-3.5 h-3.5" />; break;
    case DataType.ATTACHMENT: iconComponent = <AttachmentIcon className="w-3.5 h-3.5" />; break;
    case DataType.URL: iconComponent = <UrlIcon className="w-3.5 h-3.5" />; break;
    case DataType.EMAIL: iconComponent = <EmailIcon className="w-3.5 h-3.5" />; break;
    case DataType.CREATED_TIME:
    case DataType.LAST_MODIFIED_TIME: iconComponent = <ClockIcon className="w-3.5 h-3.5" />; break;
    case DataType.VOTES: iconComponent = <ArrowUpIcon className="w-3.5 h-3.5" />; break;
    default: iconComponent = <span className="text-xs">{typeInfo?.icon || type.charAt(0)}</span>;
  }
  return (
    <span className="text-slate-500 mr-1.5 flex items-center" title={typeInfo?.label}>
      {iconComponent}
    </span>
  );
}


const ColumnHeader: React.FC<ColumnHeaderProps> = ({ 
    column, 
    allTables,
    onUpdateColumn, 
    onDeleteColumn, 
    onStartResize,
    onColumnDragStart,
    onColumnDragOver,
    onColumnDrop,
    isDragTarget
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableCellElement>(null);

  const [editingName, setEditingName] = useState(column.name);
  const [editingType, setEditingType] = useState<DataType>(column.type);
  const [editingOptions, setEditingOptions] = useState<ColumnSelectOption[]>(column.options || []);
  const [newOptionName, setNewOptionName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(SINGLE_SELECT_COLOR_PALETTE[0].value);
  const [editingLinkedTableId, setEditingLinkedTableId] = useState<string | undefined>(column.linkedTableId);
  const [editingFormulaString, setEditingFormulaString] = useState<string | undefined>(column.formulaString);

  useEffect(() => {
    setEditingName(column.name);
    setEditingType(column.type);
    setEditingOptions(column.options || []);
    setEditingLinkedTableId(column.linkedTableId);
    setEditingFormulaString(column.formulaString);
  }, [column, isSettingsModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameSave = (newName: string) => {
    onUpdateColumn(column.id, { name: newName });
  };

  const handleSaveChanges = () => {
    const updates: Partial<Column> = {
      name: editingName,
      type: editingType,
    };
    if (editingType === DataType.SINGLE_SELECT) {
      updates.options = editingOptions;
    } else {
      updates.options = undefined;
    }
    if (editingType === DataType.LINKED_RECORD) {
      updates.linkedTableId = editingLinkedTableId;
    } else {
      updates.linkedTableId = undefined;
    }
    if (editingType === DataType.FORMULA) {
      updates.formulaString = editingFormulaString;
    } else {
      updates.formulaString = undefined;
    }

    onUpdateColumn(column.id, updates);
    setIsSettingsModalOpen(false);
  };

  const handleAddOption = () => {
    if (newOptionName.trim() === '') return;
    setEditingOptions([...editingOptions, { id: generateId(), name: newOptionName.trim(), colorClass: selectedColor }]);
    setNewOptionName('');
  };

  const handleRemoveOption = (optionId: string) => {
    setEditingOptions(editingOptions.filter(opt => opt.id !== optionId));
  };
  
  const dataTypeOptionsForSelect: SelectOptionItem[] = DATA_TYPE_OPTIONS.map((dt: any) => ({
    value: dt.value, 
    label: (
      <div className="flex items-center">
        <span className="mr-2 w-4_">{dt.icon}</span>
        <span>{dt.label}</span>
      </div>
    )
  }));
  
  const tableOptionsForSelect: SelectOptionItem[] = allTables
    .filter((t: Table) => t.id !== column.id) 
    .map((t: Table) => ({value: t.id, label: t.name}));

  const readOnlyColumnType = column.type === DataType.CREATED_TIME || column.type === DataType.LAST_MODIFIED_TIME || column.type === DataType.VOTES;

  return (
    <th
      ref={headerRef}
      draggable={!readOnlyColumnType}
      onDragStart={(e) => !readOnlyColumnType && onColumnDragStart(e, column.id)}
      onDragOver={(e) => !readOnlyColumnType && onColumnDragOver(e, column.id)}
      onDrop={(e) => !readOnlyColumnType && onColumnDrop(e, column.id)}
      className={`sticky top-0 z-10 bg-slate-50 p-0 border-b border-r border-slate-300 select-none group relative ${isDragTarget ? 'bg-sky-100' : ''}`}
      style={{ minWidth: `${column.width || DEFAULT_COLUMN_WIDTH}px`, width: `${column.width || DEFAULT_COLUMN_WIDTH}px` }}
      title={column.name}
    >
      <div className="flex items-center justify-between h-full px-2 py-2">
        {!readOnlyColumnType && (
            <div className="flex items-center cursor-grab mr-1 text-slate-400 group-hover:text-slate-500" title="Drag to reorder">
                <GripVerticalIcon className="w-3 h-5" />
            </div>
        )}
        <div className="flex items-center overflow-hidden flex-grow">
          <DataTypeDisplay type={column.type} />
          <EditableText
            initialValue={column.name}
            onSave={handleNameSave}
            className="font-semibold text-sm text-slate-700 truncate hover:bg-slate-200"
            inputClassName="text-sm font-semibold"
            placeholder={NEW_COLUMN_DEFAULT_NAME}
            disabled={readOnlyColumnType && column.type !== DataType.VOTES /* Votes name can be edited */}
          />
        </div>
        {!(column.type === DataType.CREATED_TIME || column.type === DataType.LAST_MODIFIED_TIME) && ( // No menu for pure read-only types
            <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded hover:bg-slate-300 text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity"
                aria-label="Column options"
            >
                <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg py-1 z-20 border border-slate-200">
                {column.type !== DataType.VOTES && /* Votes type cannot be changed from menu */ (
                  <button
                      onClick={() => { setIsSettingsModalOpen(true); setIsMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                  >
                      <PencilIcon className="w-4 h-4 mr-2" /> Edit column property
                  </button>
                )}
                
                <div className="my-1 border-t border-slate-200"></div>
                <button
                    onClick={() => { onDeleteColumn(column.id); setIsMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                    <TrashIcon className="w-4 h-4 mr-2" /> Delete column
                </button>
                </div>
            )}
            </div>
        )}
      </div>
      {!readOnlyColumnType && (
        <div 
            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-sky-400 transition-opacity"
            onMouseDown={(e) => onStartResize(column.id, e.clientX)}
            title="Resize column"
        />
      )}

      <Modal
        isOpen={isSettingsModalOpen && column.type !== DataType.VOTES} // Votes type cannot be changed
        onClose={() => setIsSettingsModalOpen(false)}
        title={`Edit Column: ${column.name}`}
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="columnName" className="block text-sm font-medium text-slate-700 mb-1">Column Name</label>
            <input
              id="columnName"
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="columnType" className="block text-sm font-medium text-slate-700 mb-1">Column Type</label>
            <SelectInput
                options={dataTypeOptionsForSelect.filter(dt => dt.value !== DataType.VOTES && dt.value !== DataType.CREATED_TIME && dt.value !== DataType.LAST_MODIFIED_TIME)} // Cannot change TO Votes type, or other read-only
                value={editingType}
                onChange={(val) => setEditingType(val as DataType)}
            />
          </div>

          {editingType === DataType.SINGLE_SELECT && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Options</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {editingOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${opt.colorClass}`}>{opt.name}</span>
                    <button onClick={() => handleRemoveOption(opt.id)} className="text-red-500 hover:text-red-700" aria-label="Remove option">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder="New option name"
                  className="flex-grow px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
                <SelectInput 
                    options={SINGLE_SELECT_COLOR_PALETTE.map((c: any) => ({value: c.value, label: <span className={`px-2 py-0.5 text-xs rounded-full ${c.value}`}>{c.name}</span>}))}
                    value={selectedColor}
                    onChange={(val) => setSelectedColor(val)}
                    className="w-36"
                />
                <button
                  onClick={handleAddOption}
                  className="p-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
                  title="Add option"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {editingType === DataType.LINKED_RECORD && (
             <div className="border-t border-slate-200 pt-4 mt-4">
                <label htmlFor="linkedTable" className="block text-sm font-medium text-slate-700 mb-1">Link to Table</label>
                <SelectInput
                    options={tableOptionsForSelect}
                    value={editingLinkedTableId}
                    onChange={(val) => setEditingLinkedTableId(val)}
                    placeholder="Select a table to link..."
                />
                {tableOptionsForSelect.length === 0 && <p className="text-xs text-slate-500 mt-1">No other tables available to link.</p>}
             </div>
          )}
          {editingType === DataType.FORMULA && (
            <div className="border-t border-slate-200 pt-4 mt-4">
                <label htmlFor="formulaString" className="block text-sm font-medium text-slate-700 mb-1">Formula</label>
                <textarea
                    id="formulaString"
                    value={editingFormulaString || ''}
                    onChange={(e) => setEditingFormulaString(e.target.value)}
                    placeholder="e.g., {Field A} + {Field B}"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm custom-scrollbar"
                    rows={3}
                />
                <p className="text-xs text-slate-500 mt-1">Note: Formula evaluation is not yet fully implemented.</p>
            </div>
          )}

        </div>
      </Modal>
    </th>
  );
};

export default ColumnHeader;

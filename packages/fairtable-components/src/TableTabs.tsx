
import React, { useState } from 'react';
import { Table } from "@the-new-fuse/fairtable-core";
import { PlusIcon, TrashIcon, TableCellsIcon } from './Icons';
import EditableText from './EditableText';
import Modal from './Modal'; // For delete confirmation

interface TableTabsProps {
  tables: Table[];
  activeTableId: string | null;
  onSelectTable: (tableId: string) => void;
  onAddTable: () => void;
  onDeleteTable: (tableId: string) => void;
  onRenameTable: (tableId: string, newName: string) => void;
}

const TableTabs: React.FC<TableTabsProps> = ({ tables, activeTableId, onSelectTable, onAddTable, onDeleteTable, onRenameTable }) => {
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation(); // Prevent tab selection
    setTableToDelete(table);
    setConfirmDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (tableToDelete) {
      onDeleteTable(tableToDelete.id);
    }
    setConfirmDeleteModalOpen(false);
    setTableToDelete(null);
  };
  
  return (
    <div className="flex items-center border-b border-slate-300 bg-slate-100 px-2 pt-2 custom-scrollbar overflow-x-auto">
      {tables.map((table) => (
        <div
          key={table.id}
          onClick={() => onSelectTable(table.id)}
          className={`flex items-center group px-3 py-2 border border-b-0 rounded-t-md cursor-pointer text-sm whitespace-nowrap
                        ${activeTableId === table.id 
                          ? 'bg-white text-sky-600 border-slate-300 shadow' 
                          : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-300 hover:text-slate-800'}`}
        >
          <TableCellsIcon className={`w-4 h-4 mr-2 ${activeTableId === table.id ? 'text-sky-500' : 'text-slate-500 group-hover:text-slate-700'}`} />
          <EditableText
            initialValue={table.name}
            onSave={(newName) => onRenameTable(table.id, newName)}
            className={`font-medium ${activeTableId === table.id ? 'text-sky-700' : 'text-slate-700 group-hover:text-slate-900'}`}
            inputClassName="text-sm"
          />
          {tables.length > 1 && (
             <button
                onClick={(e) => handleDeleteClick(e, table)}
                className={`ml-2 p-0.5 rounded hover:bg-red-100 text-slate-400 opacity-50 group-hover:opacity-100 hover:text-red-500 transition-opacity ${activeTableId === table.id ? 'opacity-100' : ''}`}
                title="Delete table"
             >
                <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAddTable}
        className="flex items-center ml-2 px-3 py-2 text-sm text-sky-600 hover:bg-sky-100 rounded-md transition-colors"
        title="Add new table"
      >
        <PlusIcon className="w-4 h-4 mr-1" /> Add Table
      </button>

      <Modal
        isOpen={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        title="Confirm Delete Table"
        size="sm"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setConfirmDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete the table "<strong>{tableToDelete?.name}</strong>"? This action cannot be undone.
          Any columns in other tables linking to this table will have their links cleared.
        </p>
      </Modal>
    </div>
  );
};

export default TableTabs;

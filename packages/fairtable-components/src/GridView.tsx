
// GridView Component
import React, { useState, useEffect, useCallback, DragEvent } from 'react';
import { Table, Column, Row, DataType, CellValue, AppState, View } from "@the-new-fuse/fairtable-core";
import { DEFAULT_COLUMN_WIDTH, ROW_HEIGHT } from '@the-new-fuse/fairtable-core';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, PlusSmallIcon } from './Icons';
import ColumnHeader from './ColumnHeader';
import TableCell from './TableCell';

interface GridViewProps {
  table: Table; 
  view: View; 
  appState: AppState; 
  columnsToDisplay: Column[]; 
  rowsToDisplay: Row[]; // These are already filtered and sorted by ActiveTableView
  onAddColumn: () => void;
  onUpdateColumn: (columnId: string, updates: Partial<Column>) => void;
  onDeleteColumn: (columnId: string) => void;
  onReorderColumn: (draggedColumnId: string, targetColumnId: string) => void;
  onAddRow: (parentId?: string | null) => void; // Modified to accept parentId
  onUpdateCell: (rowId: string, columnId: string, value: CellValue) => void;
  onDeleteRow: (rowId: string) => void;
  onToggleRowCollapse: (rowId: string) => void; // New prop
  onOpenLinkRecordModal: (
    rowId: string, 
    columnId: string, 
    linkedTableId: string, 
    currentLinkedIds: string[]
  ) => void;
}

const GridView: React.FC<GridViewProps> = ({
  table,
  view,
  appState,
  columnsToDisplay,
  rowsToDisplay, // These rows are already filtered/sorted from ActiveTableView
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumn,
  onAddRow,
  onUpdateCell,
  onDeleteRow,
  onToggleRowCollapse,
  onOpenLinkRecordModal,
}) => {
  const [resizingColumn, setResizingColumn] = useState<{ id: string; startX: number; startWidth: number } | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState<string | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn || !table) return;
    const currentWidth = resizingColumn.startWidth + (e.clientX - resizingColumn.startX);
    const newWidth = Math.max(currentWidth, DEFAULT_COLUMN_WIDTH / 2); 
    
    const colElement = document.querySelector(`th[data-column-id="${resizingColumn.id}"]`) as HTMLElement;
    if (colElement) colElement.style.width = `${newWidth}px`;

  }, [resizingColumn, table]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!resizingColumn || !table) return;
    const finalWidth = resizingColumn.startWidth + (e.clientX - resizingColumn.startX);
    const newWidth = Math.max(finalWidth, DEFAULT_COLUMN_WIDTH / 2);
    onUpdateColumn(resizingColumn.id, { width: newWidth });
    setResizingColumn(null);
  }, [resizingColumn, table, onUpdateColumn]);

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  const handleStartResize = (columnId: string, startX: number) => {
    const column = table.columns.find(c => c.id === columnId);
    if (column) {
      setResizingColumn({ id: columnId, startX, startWidth: column.width || DEFAULT_COLUMN_WIDTH });
    }
  };

  const handleColumnDragStart = (e: DragEvent<HTMLTableCellElement>, columnId: string) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e: DragEvent<HTMLTableCellElement>, columnId: string) => {
    e.preventDefault();
    if (columnId !== draggedColumnId) {
      setDropTargetColumnId(columnId);
    }
  };
  
  const handleColumnDragLeave = () => {
     setDropTargetColumnId(null);
  };

  const handleColumnDrop = (e: DragEvent<HTMLTableCellElement>, targetColumnId: string) => {
    e.preventDefault();
    if (draggedColumnId && draggedColumnId !== targetColumnId) {
      onReorderColumn(draggedColumnId, targetColumnId);
    }
    setDraggedColumnId(null);
    setDropTargetColumnId(null);
  };

  const getVisibleRows = useCallback(() => {
    const visible: Row[] = [];
    const processRow = (row: Row, parentCollapsed: boolean) => {
      if (!parentCollapsed) {
        visible.push(row);
        const children = rowsToDisplay.filter(child => child.parentId === row.id);
        children.forEach(child => processRow(child, row.isCollapsed));
      }
    };

    // Start processing with top-level rows
    rowsToDisplay.filter(r => r.parentId === null).forEach(topLevelRow => processRow(topLevelRow, false));
    return visible;
  }, [rowsToDisplay]);

  const displayableRows = getVisibleRows();

  if (!table || !view) {
    return <div className="p-8 text-center text-slate-500">Grid view data is missing.</div>;
  }
  
  return (
    <div className="flex-grow overflow-auto custom-scrollbar" style={{ userSelect: resizingColumn ? 'none' : 'auto'}}>
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50">
          <tr>
            <th 
              className="sticky top-0 left-0 z-20 bg-slate-100 p-2 border-b border-r border-slate-300 text-xs font-medium text-slate-500"
              style={{ width: '60px', minWidth: '60px' }} // Increased width for expander and sub-item button
            >
              #
            </th>
            {columnsToDisplay.map((col) => (
              <ColumnHeader
                key={col.id}
                column={col}
                allTables={appState.tables}
                onUpdateColumn={onUpdateColumn}
                onDeleteColumn={onDeleteColumn}
                onStartResize={handleStartResize}
                onColumnDragStart={handleColumnDragStart}
                onColumnDragOver={handleColumnDragOver}
                onColumnDrop={handleColumnDrop}
                isDragTarget={dropTargetColumnId === col.id && draggedColumnId !== col.id}
              />
            ))}
            <th className="sticky top-0 z-10 bg-slate-50 p-0 border-b border-slate-300" style={{width: '50px'}}>
              <div className="h-full flex items-center justify-center">
                  <button
                  onClick={onAddColumn}
                  className="p-2 text-sky-600 hover:bg-sky-100 rounded-full transition-colors"
                  title="Add new column"
                  >
                  <PlusIcon className="w-5 h-5" />
                  </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {displayableRows.map((row, visualRowIndex) => {
            const hasChildren = rowsToDisplay.some(r => r.parentId === row.id);
            return (
                <tr key={row.id} className="group hover:bg-slate-50" style={{ height: `${ROW_HEIGHT}px` }}>
                <td 
                    className="sticky left-0 bg-slate-50 group-hover:bg-slate-100 p-0 border-b border-r border-slate-300 text-xs text-slate-500 text-center select-none"
                    style={{ width: '60px', minWidth: '60px', paddingLeft: `${row.depth * 12}px` }}
                >
                    <div className="flex items-center justify-start h-full">
                    {hasChildren ? (
                        <button onClick={() => onToggleRowCollapse(row.id)} className="p-0.5 text-slate-500 hover:bg-slate-200 rounded">
                        {row.isCollapsed ? (
                            <ChevronRightIcon className="w-3.5 h-3.5" aria-label="Expand row" />
                        ) : (
                            <ChevronDownIcon className="w-3.5 h-3.5" aria-label="Collapse row" />
                        )}
                        </button>
                    ) : (
                        <span className="w-[18px] h-[18px] inline-block"></span> // Placeholder for alignment
                    )}
                    <span className="mx-1 group-hover:hidden">{visualRowIndex + 1}</span>
                    <div className="hidden group-hover:flex items-center">
                        <button 
                            onClick={() => onDeleteRow(row.id)}
                            className="text-red-400 hover:text-red-600 p-0.5"
                            title="Delete row"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onAddRow(row.id)}
                            className="text-sky-500 hover:text-sky-700 p-0.5"
                            title="Add sub-item"
                        >
                            <PlusSmallIcon className="w-4 h-4"/>
                        </button>
                    </div>
                    </div>
                </td>
                {columnsToDisplay.map((col) => (
                    <TableCell
                    key={`${row.id}-${col.id}`}
                    value={row.data[col.id]}
                    row={row} 
                    column={col}
                    appState={appState}
                    onUpdateCell={(newValue) => onUpdateCell(row.id, col.id, newValue)}
                    onOpenLinkRecordModal={onOpenLinkRecordModal}
                    />
                ))}
                <td className="border-b border-slate-300"></td> {/* Empty cell for alignment */}
                </tr>
            );
            })}
        </tbody>
      </table>
      {displayableRows.length === 0 && (
          <div className="p-8 text-center text-slate-400">
              This view is empty. Try adjusting filters, expanding items, or adding new rows.
          </div>
      )}
    </div>
  );
};

export default GridView;

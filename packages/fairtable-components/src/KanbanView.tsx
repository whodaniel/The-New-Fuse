import {
  AppState,
  CellValue,
  Column,
  DataType,
  KanbanViewOptions,
  Row,
  Table,
  View,
} from '@the-new-fuse/fairtable-core';
import React, { DragEvent, useMemo, useState } from 'react';
import { PlusIcon } from './Icons'; // For "Add new" in unclassified

interface KanbanViewProps {
  table: Table;
  view: View; // Active view configuration
  appState: AppState;
  columnsToDisplay: Column[]; // Columns to potentially show on cards
  rowsToDisplay: Row[]; // Filtered and sorted rows from ActiveTableView
  kanbanOptions: KanbanViewOptions;
  onUpdateCell: (rowId: string, columnId: string, value: CellValue) => void;
  onOpenLinkRecordModal: (
    rowId: string,
    columnId: string,
    linkedTableId: string,
    currentLinkedIds: string[]
  ) => void;
  onAddRow: (parentId?: string | null, defaultValues?: Partial<Row['data']>) => void;
}

interface KanbanLane {
  id: string; // Unique ID for the lane (e.g., optionId, linkedRecordId, or text value)
  title: string;
  colorClass?: string; // For single_select options
  rows: Row[];
  representativeValue: CellValue; // The actual value this lane represents for the groupByColumn
}

const KanbanView: React.FC<KanbanViewProps> = ({
  table,
  view,
  appState,
  columnsToDisplay,
  rowsToDisplay,
  kanbanOptions,
  onUpdateCell,
  onOpenLinkRecordModal,
  onAddRow,
}) => {
  const [draggedItem, setDraggedItem] = useState<{ rowId: string; originalLaneId: string } | null>(
    null
  );
  const [isDraggingOverLane, setIsDraggingOverLane] = useState<string | null>(null);

  const groupByColumn = useMemo(() => {
    return table.columns.find((c: Column) => c.id === kanbanOptions.groupByColumnId);
  }, [table.columns, kanbanOptions.groupByColumnId]);

  const lanes = useMemo(() => {
    if (!groupByColumn) return [];

    const grouped: Record<string, KanbanLane> = {};
    const uncategorizedId = '___uncategorized___';

    // Initialize lanes for SINGLE_SELECT options first to maintain their order
    if (groupByColumn.type === DataType.SINGLE_SELECT && groupByColumn.options) {
      groupByColumn.options.forEach((option: any) => {
        grouped[option.id] = {
          id: option.id,
          title: option.name,
          colorClass: option.colorClass,
          rows: [],
          representativeValue: option.id,
        };
      });
    }

    // Initialize uncategorized lane
    grouped[uncategorizedId] = {
      id: uncategorizedId,
      title: 'Uncategorized',
      rows: [],
      representativeValue: null,
    };

    rowsToDisplay.forEach((row) => {
      let groupValue = row.data[groupByColumn.id];
      let laneId: string | null = null;
      let representativeValueForLane: CellValue = groupValue;

      if (groupByColumn.type === DataType.SINGLE_SELECT) {
        laneId = groupValue as string | null;
      } else if (groupByColumn.type === DataType.LINKED_RECORD) {
        const linkedIds = Array.isArray(groupValue) ? (groupValue as string[]) : [];
        laneId = linkedIds.length > 0 ? linkedIds[0] : null;
        if (laneId && !grouped[laneId]) {
          const linkedTable = appState.tables.find(
            (t: Table) => t.id === groupByColumn.linkedTableId
          );
          const linkedRowData = linkedTable?.rows.find((r: Row) => r.id === laneId);
          const primaryColLinked = linkedTable?.columns.find(
            (c: Column) => c.id === linkedTable.columnOrder[0]
          );
          const title =
            linkedRowData && primaryColLinked
              ? String(linkedRowData.data[primaryColLinked.id] ?? laneId)
              : laneId || 'Unknown Link';
          grouped[laneId] = { id: laneId, title: title, rows: [], representativeValue: [laneId] }; // Store as array for LINKED_RECORD
        }
      } else {
        // For TEXT, BOOLEAN, NUMBER etc.
        laneId = groupValue !== null && groupValue !== undefined ? String(groupValue) : null;
        if (laneId && !grouped[laneId]) {
          grouped[laneId] = {
            id: laneId,
            title: laneId,
            rows: [],
            representativeValue: groupValue,
          };
        }
      }

      if (laneId && grouped[laneId]) {
        grouped[laneId].rows.push(row);
      } else {
        grouped[uncategorizedId].rows.push(row);
      }
    });

    let orderedLanes = Object.values(grouped);

    if (groupByColumn.type === DataType.SINGLE_SELECT && groupByColumn.options) {
      const optionOrder = groupByColumn.options.map((opt: any) => opt.id);
      orderedLanes.sort((a: KanbanLane, b: KanbanLane) => {
        if (a.id === uncategorizedId) return 1;
        if (b.id === uncategorizedId) return -1;
        const indexA = optionOrder.indexOf(a.id);
        const indexB = optionOrder.indexOf(b.id);
        return indexA - indexB;
      });
    }

    return orderedLanes.filter((lane) => lane.id !== uncategorizedId || lane.rows.length > 0);
  }, [groupByColumn, rowsToDisplay, appState.tables]);

  const primaryDisplayColumn = useMemo(() => {
    return (
      columnsToDisplay.find(
        (c: Column) => c.type === DataType.TEXT && c.id !== groupByColumn?.id
      ) || columnsToDisplay[0]
    );
  }, [columnsToDisplay, groupByColumn]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, rowId: string, originalLaneId: string) => {
    e.dataTransfer.setData('text/plain', rowId); // Necessary for Firefox
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ rowId, originalLaneId });
    // e.currentTarget.style.opacity = '0.5'; // Visual feedback
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, laneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (laneId !== isDraggingOverLane) {
      setIsDraggingOverLane(laneId);
    }
  };

  const handleDragLeaveLane = (e: DragEvent<HTMLDivElement>) => {
    setIsDraggingOverLane(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetLaneId: string) => {
    e.preventDefault();
    if (!draggedItem || !groupByColumn) return;

    const { rowId, originalLaneId } = draggedItem;
    if (originalLaneId !== targetLaneId) {
      const targetLane = lanes.find((l: KanbanLane) => l.id === targetLaneId);
      if (targetLane) {
        let newValue = targetLane.representativeValue;
        // Ensure the value format matches the column type (e.g., boolean string to boolean)
        if (groupByColumn.type === DataType.BOOLEAN) {
          newValue = String(newValue).toLowerCase() === 'true';
        } else if (groupByColumn.type === DataType.NUMBER && newValue !== null) {
          newValue = parseFloat(String(newValue));
          if (isNaN(newValue as number)) newValue = null;
        }
        onUpdateCell(rowId, groupByColumn.id, newValue);
      }
    }
    setDraggedItem(null);
    setIsDraggingOverLane(null);
    // e.currentTarget.style.opacity = '1'; // Reset opacity
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    // e.currentTarget.style.opacity = '1'; // Reset opacity if drag cancelled
    setDraggedItem(null);
    setIsDraggingOverLane(null);
  };

  if (!groupByColumn) {
    return (
      <div className="p-4 text-center text-red-500">
        Kanban view configuration error: Group By column not found.
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-x-auto overflow-y-hidden p-4 flex space-x-4 bg-slate-100 custom-scrollbar">
      {lanes.map((lane) => (
        <div
          key={lane.id}
          className={`w-72 flex-shrink-0 bg-slate-200 rounded-lg shadow ${isDraggingOverLane === lane.id ? 'ring-2 ring-sky-500' : ''}`}
          onDragOver={(e) => handleDragOver(e, lane.id)}
          onDrop={(e) => handleDrop(e, lane.id)}
          onDragLeave={handleDragLeaveLane}
        >
          <div
            className={`p-3 border-b border-slate-300 ${lane.colorClass ? `${lane.colorClass} text-opacity-75 rounded-t-lg` : 'text-slate-700'}`}
          >
            <h3 className={`font-semibold text-sm truncate ${lane.colorClass ? '' : ''}`}>
              {lane.title}
            </h3>
            <span className="text-xs opacity-80">
              {lane.rows.length} card{lane.rows.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="p-2 space-y-2 overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)]">
            {lane.rows.map((row) => (
              <div
                key={row.id}
                draggable
                onDragStart={(e) => handleDragStart(e, row.id, lane.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white p-3 rounded-md shadow hover:shadow-lg transition-shadow cursor-grab ${draggedItem?.rowId === row.id ? 'opacity-50 ring-2 ring-sky-400' : ''}`}
              >
                {primaryDisplayColumn && (
                  <p className="text-sm font-medium text-slate-800 truncate mb-1">
                    {String(row.data[primaryDisplayColumn.id] ?? 'Untitled Card')}
                  </p>
                )}
                {columnsToDisplay.slice(0, 3).map((col) => {
                  if (col.id === primaryDisplayColumn?.id || col.id === groupByColumn.id)
                    return null;
                  const cellValue = row.data[col.id];
                  let displayValue: React.ReactNode = String(cellValue ?? '');
                  if (
                    cellValue === null ||
                    cellValue === undefined ||
                    String(cellValue).trim() === ''
                  ) {
                    displayValue = <span className="text-slate-400 italic">empty</span>;
                  } else if (col.type === DataType.SINGLE_SELECT && col.options) {
                    const opt = col.options.find((o: any) => o.id === cellValue);
                    displayValue = opt ? (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${opt.colorClass}`}>
                        {opt.name}
                      </span>
                    ) : (
                      '...'
                    );
                  } else if (
                    col.type === DataType.LINKED_RECORD &&
                    Array.isArray(cellValue) &&
                    cellValue.length > 0
                  ) {
                    displayValue = (
                      <button
                        onClick={() =>
                          col.linkedTableId &&
                          onOpenLinkRecordModal(
                            row.id,
                            col.id,
                            col.linkedTableId,
                            cellValue as string[]
                          )
                        }
                        className="text-xs text-sky-600 hover:underline"
                      >
                        {cellValue.length} link(s)
                      </button>
                    );
                  } else if (col.type === DataType.BOOLEAN) {
                    displayValue = (
                      <input
                        type="checkbox"
                        checked={!!cellValue}
                        readOnly
                        className="form-checkbox h-3.5 w-3.5"
                      />
                    );
                  }

                  return (
                    <div key={col.id} className="text-xs text-slate-600 mt-1 flex items-center">
                      <span className="font-medium w-1/3 truncate mr-1">{col.name}:</span>
                      <span className="w-2/3 truncate">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            <button
              onClick={() => onAddRow(null, { [groupByColumn.id]: lane.representativeValue })}
              className="w-full mt-2 p-2 text-xs text-slate-500 hover:bg-slate-300 rounded flex items-center justify-center"
            >
              <PlusIcon className="w-3 h-3 mr-1" /> Add card
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanView;

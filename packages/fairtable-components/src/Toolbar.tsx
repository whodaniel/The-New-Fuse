
import React, { useState, useEffect, useRef } from 'react'; // Column is not used
import { Table, View, ViewType, Filter, Sort, FilterOperator, DataType, KanbanViewOptions, TimelineViewOptions } from "@the-new-fuse/fairtable-core";
import { PlusIcon, FilterIcon, SortAscendingIcon, EyeIcon, PencilIcon, TrashIcon, ChevronDownIcon, TableCellsIcon, KanbanIcon, CalendarIcon, GalleryIcon, TimelineIcon } from './Icons'; // NEW_VIEW_DEFAULT_NAME is not used
// import EditableText from './EditableText'; // EditableText is used, but not imported here. It's imported in ColumnHeader.tsx and TableTabs.tsx


interface ToolbarProps {
  table: Table;
  view: View;
  onSetActiveView: (viewId: string) => void;
  onAddView: (type: ViewType, options?: View['viewSpecificOptions']) => void;
  onRenameView: (viewId: string, newName: string) => void;
  onDeleteView: (viewId: string) => void;
  onUpdateViewSpecificOptions: (viewId: string, options: View['viewSpecificOptions']) => void; 
  onAddFilter: () => void;
  onUpdateFilter: (filterId: string, updates: Partial<Filter>) => void;
  onDeleteFilter: (filterId: string) => void;
  onAddSort: () => void;
  onUpdateSort: (sortId: string, updates: Partial<Sort>) => void;
  onDeleteSort: (sortId: string) => void;
  onAddRow: () => void;
}

const ViewTypeIconDisplay: React.FC<{type: ViewType, className?: string}> = ({type, className="w-4 h-4 mr-2"}) => {
    switch(type) {
        case ViewType.GRID: return <TableCellsIcon className={className} />;
        case ViewType.KANBAN: return <KanbanIcon className={className} />;
        case ViewType.CALENDAR: return <CalendarIcon className={className} />;
        case ViewType.GALLERY: return <GalleryIcon className={className} />;
        case ViewType.TIMELINE: return <TimelineIcon className={className} />;
        default: return <EyeIcon className={className} />;
    }
}

const Toolbar: React.FC<ToolbarProps> = ({
  table, view,
  onSetActiveView, onAddView, onRenameView, onDeleteView, onUpdateViewSpecificOptions,
  onAddFilter, onUpdateFilter, onDeleteFilter,
  onAddSort, onUpdateSort, onDeleteSort,
  onAddRow
}) => {
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  const [isAddViewModalOpen, setIsAddViewModalOpen] = useState(false);
  const [newViewType, setNewViewType] = useState<ViewType>(ViewType.GRID);
  
  const [isConfigureKanbanModalOpen, setIsConfigureKanbanModalOpen] = useState(false);
  const [kanbanGroupByColumnId, setKanbanGroupByColumnId] = useState<string | null>(null);

  const [isConfigureTimelineModalOpen, setIsConfigureTimelineModalOpen] = useState(false);
  const [timelineStartDateCol, setTimelineStartDateCol] = useState<string | null>(null);
  const [timelineEndDateCol, setTimelineEndDateCol] = useState<string | null>(null);
  const [timelineLabelCol, setTimelineLabelCol] = useState<string | null>(null);
  const [isEditingExistingViewConfig, setIsEditingExistingViewConfig] = useState(false);


  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) setIsViewDropdownOpen(false);
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) setIsFilterDropdownOpen(false);
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) setIsSortDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { 
    if (view.type === ViewType.KANBAN && view.viewSpecificOptions) {
        setKanbanGroupByColumnId((view.viewSpecificOptions as KanbanViewOptions).groupByColumnId);
    } else if (view.type === ViewType.TIMELINE && view.viewSpecificOptions) {
        const opts = view.viewSpecificOptions as TimelineViewOptions;
        setTimelineStartDateCol(opts.startDateColumnId || null);
        setTimelineEndDateCol(opts.endDateColumnId || null);
        setTimelineLabelCol(opts.labelColumnId || null);
    }
  }, [view.viewSpecificOptions, view.type, table.columns]);


  const columnOptions: SelectOptionItem[] = table.columns.map(col => ({ value: col.id, label: col.name }));
  const dateColumnOptions: SelectOptionItem[] = table.columns
    .filter(col => col.type === DataType.DATE)
    .map(col => ({ value: col.id, label: col.name }));
  const allColumnOptionsForLabel: SelectOptionItem[] = table.columns
    .map(col => ({ value: col.id, label: col.name }));
  
  const getApplicableFilterOperators = (columnId: string): SelectOptionItem[] => {
    const column = table.columns.find(c => c.id === columnId);
    if (!column) return [];
    return Object.entries(FILTER_OPERATOR_OPTIONS)
        .filter(([_, optDetails]) => optDetails.applicableTypes.includes(column.type))
        .map(([opKey, opDetails]) => ({ value: opKey, label: opDetails.label }));
  };

  const isValueNeededForOperator = (operator: FilterOperator): boolean => {
    return operator !== FilterOperator.IS_EMPTY && operator !== FilterOperator.IS_NOT_EMPTY;
  };

  const handleOpenConfigureViewModal = () => {
    setIsEditingExistingViewConfig(true);
    if (view.type === ViewType.KANBAN) {
        setKanbanGroupByColumnId((view.viewSpecificOptions as KanbanViewOptions)?.groupByColumnId || table.columns[0]?.id || null);
        setIsConfigureKanbanModalOpen(true);
    } else if (view.type === ViewType.TIMELINE) {
        const opts = view.viewSpecificOptions as TimelineViewOptions;
        setTimelineStartDateCol(opts.startDateColumnId || null);
        setTimelineEndDateCol(opts.endDateColumnId || null);
        setTimelineLabelCol(opts.labelColumnId);
        setIsConfigureTimelineModalOpen(true);
    }
  }

  const handleConfirmAddView = () => {
    setIsEditingExistingViewConfig(false); // For new view
    if (newViewType === ViewType.KANBAN) {
        const potentialGroupByCols = table.columns.filter(c => c.type === DataType.SINGLE_SELECT || c.type === DataType.LINKED_RECORD || c.type === DataType.TEXT);
        setKanbanGroupByColumnId(potentialGroupByCols[0]?.id || table.columns[0]?.id || null);
        setIsConfigureKanbanModalOpen(true); 
    } else if (newViewType === ViewType.TIMELINE) {
        const dateCols = table.columns.filter(c => c.type === DataType.DATE);
        const textCols = table.columns.filter(c => c.type === DataType.TEXT);
        setTimelineStartDateCol(dateCols[0]?.id || null);
        setTimelineEndDateCol(dateCols[1]?.id || null);
        setTimelineLabelCol(textCols[0]?.id || table.columns[0]?.id || null);
        setIsConfigureTimelineModalOpen(true);
    } else {
        onAddView(newViewType);
    }
    setIsAddViewModalOpen(false);
  };

  const handleConfirmKanbanConfig = () => {
    if (kanbanGroupByColumnId) {
        const options: KanbanViewOptions = { groupByColumnId: kanbanGroupByColumnId };
        if(isEditingExistingViewConfig) {
            onUpdateViewSpecificOptions(view.id, options);
        } else {
            onAddView(ViewType.KANBAN, options);
        }
    }
    setIsConfigureKanbanModalOpen(false);
  };

  const handleConfirmTimelineConfig = () => {
    if (timelineStartDateCol) {
        const options: TimelineViewOptions = { 
            startDateColumnId: timelineStartDateCol,
            endDateColumnId: timelineEndDateCol,
            labelColumnId: timelineLabelCol,
        };
        if(isEditingExistingViewConfig) {
            onUpdateViewSpecificOptions(view.id, options);
        } else {
            onAddView(ViewType.TIMELINE, options);
        }
    }
    setIsConfigureTimelineModalOpen(false);
  };

  const viewTypeOptions: SelectOptionItem[] = [
    { value: ViewType.GRID, label: <div className="flex items-center"><TableCellsIcon className="w-4 h-4 mr-2"/>Grid</div> },
    { value: ViewType.KANBAN, label: <div className="flex items-center"><KanbanIcon className="w-4 h-4 mr-2"/>Kanban</div> },
    { value: ViewType.TIMELINE, label: <div className="flex items-center"><TimelineIcon className="w-4 h-4 mr-2"/>Timeline</div> },
    // { value: ViewType.CALENDAR, label: <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>Calendar</div> },
    // { value: ViewType.GALLERY, label: <div className="flex items-center"><GalleryIcon className="w-4 h-4 mr-2"/>Gallery</div> },
  ];

  const getFilterInputType = (columnId: string): string => {
    const col = table.columns.find(c => c.id === columnId);
    if (!col) return "text";
    switch(col.type) {
        case DataType.NUMBER: return "number";
        case DataType.DATE: return "date";
        case DataType.BOOLEAN: return "checkbox";
        default: return "text";
    }
  }

  const canConfigureCurrentView = view.type === ViewType.KANBAN || view.type === ViewType.TIMELINE;


  return (
    <div className="p-2 border-b border-slate-300 bg-slate-50 flex items-center space-x-3 text-sm text-slate-700 sticky top-0 z-10">
      {/* View Switcher */}
      <div className="relative" ref={viewDropdownRef}>
        <button
          onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
          className="flex items-center px-3 py-1.5 hover:bg-slate-200 rounded-md"
        >
          <ViewTypeIconDisplay type={view.type} />
          <EditableText 
            initialValue={view.name} 
            onSave={(newName) => onRenameView(view.id, newName)}
            className="font-medium"
            inputClassName="font-medium text-sm"
           />
          <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isViewDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {isViewDropdownOpen && (
          <div className="absolute left-0 mt-1 w-60 bg-white rounded-md shadow-lg py-1 z-30 border border-slate-200">
            {table.views.map(v => (
              <button
                key={v.id}
                onClick={() => { onSetActiveView(v.id); setIsViewDropdownOpen(false); }}
                className={`w-full text-left px-3 py-1.5 flex items-center hover:bg-slate-100 ${v.id === view.id ? 'bg-sky-50 text-sky-700 font-semibold' : ''}`}
              >
                <ViewTypeIconDisplay type={v.type} />
                {v.name}
                {v.id === view.id && ( 
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (table.views.length > 1) onDeleteView(v.id); 
                            else alert("Cannot delete the last view.");
                            setIsViewDropdownOpen(false);
                        }}
                        className="ml-auto p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete view"
                        disabled={table.views.length <=1}
                    >
                        <TrashIcon className="w-3.5 h-3.5"/>
                    </button>
                )}
              </button>
            ))}
            <div className="my-1 border-t border-slate-200"></div>
            <button
              onClick={() => { setIsAddViewModalOpen(true); setIsViewDropdownOpen(false); }}
              className="w-full text-left px-3 py-1.5 flex items-center hover:bg-slate-100 text-sky-600"
            >
              <PlusIcon className="w-4 h-4 mr-2" /> Create new view...
            </button>
            {canConfigureCurrentView && (
                <>
                <div className="my-1 border-t border-slate-200"></div>
                 <button
                    onClick={() => { handleOpenConfigureViewModal(); setIsViewDropdownOpen(false);}}
                    className="w-full text-left px-3 py-1.5 flex items-center hover:bg-slate-100 text-slate-700"
                    >
                    <PencilIcon className="w-4 h-4 mr-2" /> Configure current view
                </button>
                </>
            )}
          </div>
        )}
      </div>

      {/* Filter Button & Dropdown */}
      <div className="relative" ref={filterDropdownRef}>
        <button
          onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          className="flex items-center px-3 py-1.5 hover:bg-slate-200 rounded-md"
          title="Filter rows"
        >
          <FilterIcon className="w-4 h-4 mr-1" /> Filter {view.filters.length > 0 && `(${view.filters.length})`}
        </button>
        {isFilterDropdownOpen && (
          <div className="absolute left-0 mt-1 w-[450px] bg-white rounded-md shadow-lg p-3 z-30 border border-slate-200 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {view.filters.map((filter) => (
              <div key={filter.id} className="space-y-1 p-2 bg-slate-50 rounded">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <SelectInput options={columnOptions} value={filter.columnId} onChange={(val) => onUpdateFilter(filter.id, { columnId: val, value: '' })} /> {/* Reset value on column change */}
                  <SelectInput options={getApplicableFilterOperators(filter.columnId)} value={filter.operator} onChange={(val) => onUpdateFilter(filter.id, { operator: val as FilterOperator })} />
                   <button onClick={() => onDeleteFilter(filter.id)} className="text-red-500 hover:text-red-700 justify-self-end p-1">
                       <TrashIcon className="w-4 h-4" />
                   </button>
                </div>
                {isValueNeededForOperator(filter.operator) && (
                    table.columns.find(c => c.id === filter.columnId)?.type === DataType.BOOLEAN ? (
                        <SelectInput
                            options={[{value: 'true', label: 'Checked'}, {value: 'false', label: 'Unchecked'}]}
                            value={String(filter.value || 'false')}
                            onChange={(val) => onUpdateFilter(filter.id, {value: val === 'true' ? true : false})}
                            className="w-full"
                        />
                    ) : (
                        <input
                            type={getFilterInputType(filter.columnId)}
                            value={filter.value || ''}
                            onChange={(e) => onUpdateFilter(filter.id, { value: getFilterInputType(filter.columnId) === 'checkbox' ? e.target.checked : e.target.value })}
                            placeholder="Value"
                            className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"
                        />
                    )
                )}
              </div>
            ))}
            <button onClick={onAddFilter} className="w-full mt-2 px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-100 rounded-md border border-sky-200">
              + Add filter condition
            </button>
          </div>
        )}
      </div>

      {/* Sort Button & Dropdown */}
       <div className="relative" ref={sortDropdownRef}>
        <button
          onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
          className="flex items-center px-3 py-1.5 hover:bg-slate-200 rounded-md"
          title="Sort rows"
        >
          <SortAscendingIcon className="w-4 h-4 mr-1" /> Sort {view.sorts.length > 0 && `(${view.sorts.length})`}
        </button>
        {isSortDropdownOpen && (
          <div className="absolute left-0 mt-1 w-80 bg-white rounded-md shadow-lg p-3 z-30 border border-slate-200 space-y-2">
            {view.sorts.map(sortRule => (
              <div key={sortRule.id} className="flex items-center space-x-2 p-2 bg-slate-50 rounded">
                <SelectInput options={columnOptions} value={sortRule.columnId} onChange={(val) => onUpdateSort(sortRule.id, { columnId: val })} className="flex-grow"/>
                <SelectInput
                  options={[{value: 'ASC', label: 'Ascending'}, {value: 'DESC', label: 'Descending'}]}
                  value={sortRule.direction}
                  onChange={(val) => onUpdateSort(sortRule.id, { direction: val as 'ASC' | 'DESC' })}
                  className="w-32"
                />
                <button onClick={() => onDeleteSort(sortRule.id)} className="text-red-500 hover:text-red-700 p-1">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={onAddSort} className="w-full mt-2 px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-100 rounded-md border border-sky-200">
              + Add sort condition
            </button>
          </div>
        )}
      </div>
      
      {/* Add Row Button */}
      <button
        onClick={onAddRow}
        className="ml-auto px-3 py-1.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm transition-colors flex items-center"
      >
        <PlusIcon className="w-4 h-4 mr-1" /> Add Row
      </button>

      {/* Add View Modal */}
      <Modal
        isOpen={isAddViewModalOpen}
        onClose={() => setIsAddViewModalOpen(false)}
        title="Create New View"
        footer={
            <div className="flex justify-end space-x-2">
                <button onClick={() => setIsAddViewModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Cancel</button>
                <button onClick={handleConfirmAddView} className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 rounded-md">Next</button>
            </div>
        }
      >
        <p className="text-sm text-slate-600 mb-2">Choose a view type:</p>
        <SelectInput
            options={viewTypeOptions}
            value={newViewType}
            onChange={(val) => setNewViewType(val as ViewType)}
        />
         <p className="text-xs text-slate-500 mt-2">Note: Calendar and Gallery views are placeholders.</p>
      </Modal>

      {/* Configure Kanban Modal */}
        <Modal
            isOpen={isConfigureKanbanModalOpen}
            onClose={() => setIsConfigureKanbanModalOpen(false)}
            title={isEditingExistingViewConfig ? "Configure Kanban View" : "Setup Kanban View"}
            size="md"
            footer={
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsConfigureKanbanModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Cancel</button>
                    <button 
                        onClick={handleConfirmKanbanConfig} 
                        className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 rounded-md"
                        disabled={!kanbanGroupByColumnId}
                    >
                        {isEditingExistingViewConfig ? "Save Changes" : "Create View"}
                    </button>
                </div>
            }
        >
            <div className="space-y-3">
                <label htmlFor="kanbanGroupBy" className="block text-sm font-medium text-slate-700">Group by column:</label>
                <SelectInput
                    options={table.columns
                        .filter(col => [DataType.SINGLE_SELECT, DataType.LINKED_RECORD, DataType.TEXT, DataType.BOOLEAN, DataType.NUMBER].includes(col.type)) 
                        .map(col => ({value: col.id, label: col.name}))
                    }
                    value={kanbanGroupByColumnId || ""}
                    onChange={(val) => setKanbanGroupByColumnId(val)}
                    placeholder="Select a column..."
                />
                {!kanbanGroupByColumnId && <p className="text-xs text-red-500">Please select a column to group by.</p>}
                <p className="text-xs text-slate-500 mt-1">Choose a column whose unique values will become the Kanban lanes.</p>
            </div>
        </Modal>

      {/* Configure Timeline Modal */}
        <Modal
            isOpen={isConfigureTimelineModalOpen}
            onClose={() => setIsConfigureTimelineModalOpen(false)}
            title={isEditingExistingViewConfig ? "Configure Timeline View" : "Setup Timeline View"}
            size="md"
            footer={
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsConfigureTimelineModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Cancel</button>
                    <button 
                        onClick={handleConfirmTimelineConfig} 
                        className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 rounded-md"
                        disabled={!timelineStartDateCol}
                    >
                        {isEditingExistingViewConfig ? "Save Changes" : "Create View"}
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="timelineStartDate" className="block text-sm font-medium text-slate-700 mb-1">Start Date Column <span className="text-red-500">*</span></label>
                    <SelectInput
                        options={dateColumnOptions}
                        value={timelineStartDateCol || ""}
                        onChange={(val) => setTimelineStartDateCol(val)}
                        placeholder="Select start date column..."
                    />
                    {!timelineStartDateCol && <p className="text-xs text-red-500 mt-1">Start date column is required.</p>}
                </div>
                 <div>
                    <label htmlFor="timelineEndDate" className="block text-sm font-medium text-slate-700 mb-1">End Date Column (Optional)</label>
                    <SelectInput
                        options={[{value: '', label: 'None (use default duration)'}, ...dateColumnOptions]}
                        value={timelineEndDateCol || ""}
                        onChange={(val) => setTimelineEndDateCol(val === '' ? null : val)}
                        placeholder="Select end date column..."
                    />
                     <p className="text-xs text-slate-500 mt-1">If not set, items will have a default duration.</p>
                </div>
                 <div>
                    <label htmlFor="timelineLabel" className="block text-sm font-medium text-slate-700 mb-1">Label Column (Optional)</label>
                    <SelectInput
                        options={[{value: '', label: 'Default (Primary Column)'}, ...allColumnOptionsForLabel]}
                        value={timelineLabelCol || ""}
                        onChange={(val) => setTimelineLabelCol(val === '' ? null : val)}
                        placeholder="Select label column..."
                    />
                    <p className="text-xs text-slate-500 mt-1">Column to display as the item label on the timeline.</p>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default Toolbar;

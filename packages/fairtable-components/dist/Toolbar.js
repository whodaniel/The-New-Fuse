import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react'; // Column is not used
import { ViewType, FilterOperator, DataType } from '@the-new-fuse/fairtable-core';
import { PlusIcon, FilterIcon, SortAscendingIcon, EyeIcon, PencilIcon, TrashIcon, ChevronDownIcon, TableCellsIcon, KanbanIcon, CalendarIcon, GalleryIcon, TimelineIcon } from './Icons'; // NEW_VIEW_DEFAULT_NAME is not used
import EditableText from './EditableText';
import SelectInput from './SelectInput';
import Modal from './Modal';
// Example FILTER_OPERATOR_OPTIONS definition. Expand as needed.
const FILTER_OPERATOR_OPTIONS = {
    EQUALS: { label: 'Equals', applicableTypes: [DataType.TEXT, DataType.NUMBER, DataType.DATE, DataType.BOOLEAN] },
    NOT_EQUALS: { label: 'Does not equal', applicableTypes: [DataType.TEXT, DataType.NUMBER, DataType.DATE, DataType.BOOLEAN] },
    CONTAINS: { label: 'Contains', applicableTypes: [DataType.TEXT] },
    NOT_CONTAINS: { label: 'Does not contain', applicableTypes: [DataType.TEXT] },
    IS_EMPTY: { label: 'Is empty', applicableTypes: [DataType.TEXT, DataType.NUMBER, DataType.DATE, DataType.BOOLEAN] },
    IS_NOT_EMPTY: { label: 'Is not empty', applicableTypes: [DataType.TEXT, DataType.NUMBER, DataType.DATE, DataType.BOOLEAN] },
    GREATER_THAN: { label: 'Greater than', applicableTypes: [DataType.NUMBER, DataType.DATE] },
    LESS_THAN: { label: 'Less than', applicableTypes: [DataType.NUMBER, DataType.DATE] },
};
const ViewTypeIconDisplay = ({ type, className = "w-4 h-4 mr-2" }) => {
    switch (type) {
        case ViewType.GRID: return _jsx(TableCellsIcon, { className: className });
        case ViewType.KANBAN: return _jsx(KanbanIcon, { className: className });
        case ViewType.CALENDAR: return _jsx(CalendarIcon, { className: className });
        case ViewType.GALLERY: return _jsx(GalleryIcon, { className: className });
        case ViewType.TIMELINE: return _jsx(TimelineIcon, { className: className });
        default: return _jsx(EyeIcon, { className: className });
    }
};
const Toolbar = ({ table, view, onSetActiveView, onAddView, onRenameView, onDeleteView, onUpdateViewSpecificOptions, onAddFilter, onUpdateFilter, onDeleteFilter, onAddSort, onUpdateSort, onDeleteSort, onAddRow }) => {
    const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [isAddViewModalOpen, setIsAddViewModalOpen] = useState(false);
    const [newViewType, setNewViewType] = useState(ViewType.GRID);
    const [isConfigureKanbanModalOpen, setIsConfigureKanbanModalOpen] = useState(false);
    const [kanbanGroupByColumnId, setKanbanGroupByColumnId] = useState(null);
    const [isConfigureTimelineModalOpen, setIsConfigureTimelineModalOpen] = useState(false);
    const [timelineStartDateCol, setTimelineStartDateCol] = useState(null);
    const [timelineEndDateCol, setTimelineEndDateCol] = useState(null);
    const [timelineLabelCol, setTimelineLabelCol] = useState(null);
    const [isEditingExistingViewConfig, setIsEditingExistingViewConfig] = useState(false);
    const viewDropdownRef = useRef(null);
    const filterDropdownRef = useRef(null);
    const sortDropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target))
                setIsViewDropdownOpen(false);
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target))
                setIsFilterDropdownOpen(false);
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target))
                setIsSortDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    useEffect(() => {
        if (view.type === ViewType.KANBAN && view.viewSpecificOptions) {
            setKanbanGroupByColumnId(view.viewSpecificOptions.groupByColumnId);
        }
        else if (view.type === ViewType.TIMELINE && view.viewSpecificOptions) {
            const opts = view.viewSpecificOptions;
            setTimelineStartDateCol(opts.startDateColumnId || null);
            setTimelineEndDateCol(opts.endDateColumnId || null);
            setTimelineLabelCol(opts.labelColumnId || null);
        }
    }, [view.viewSpecificOptions, view.type, table.columns]);
    const columnOptions = table.columns.map((col) => ({ value: col.id, label: col.name }));
    const dateColumnOptions = table.columns
        .filter((col) => col.type === DataType.DATE)
        .map((col) => ({ value: col.id, label: col.name }));
    const allColumnOptionsForLabel = table.columns
        .map((col) => ({ value: col.id, label: col.name }));
    const getApplicableFilterOperators = (columnId) => {
        const column = table.columns.find((c) => c.id === columnId);
        if (!column)
            return [];
        return Object.entries(FILTER_OPERATOR_OPTIONS)
            .filter(([_, optDetails]) => optDetails.applicableTypes.includes(column.type))
            .map(([opKey, opDetails]) => ({ value: opKey, label: opDetails.label }));
    };
    const isValueNeededForOperator = (operator) => {
        return operator !== FilterOperator.IS_EMPTY && operator !== FilterOperator.IS_NOT_EMPTY;
    };
    const handleOpenConfigureViewModal = () => {
        setIsEditingExistingViewConfig(true);
        if (view.type === ViewType.KANBAN) {
            setKanbanGroupByColumnId(view.viewSpecificOptions?.groupByColumnId || table.columns[0]?.id || null);
            setIsConfigureKanbanModalOpen(true);
        }
        else if (view.type === ViewType.TIMELINE) {
            const opts = view.viewSpecificOptions;
            setTimelineStartDateCol(opts.startDateColumnId || null);
            setTimelineEndDateCol(opts.endDateColumnId || null);
            setTimelineLabelCol(opts.labelColumnId ?? null);
            setIsConfigureTimelineModalOpen(true);
        }
    };
    const handleConfirmAddView = () => {
        setIsEditingExistingViewConfig(false); // For new view
        if (newViewType === ViewType.KANBAN) {
            const potentialGroupByCols = table.columns.filter((c) => c.type === DataType.SINGLE_SELECT || c.type === DataType.LINKED_RECORD || c.type === DataType.TEXT);
            setKanbanGroupByColumnId(potentialGroupByCols[0]?.id || table.columns[0]?.id || null);
            setIsConfigureKanbanModalOpen(true);
        }
        else if (newViewType === ViewType.TIMELINE) {
            const dateCols = table.columns.filter((c) => c.type === DataType.DATE);
            const textCols = table.columns.filter((c) => c.type === DataType.TEXT);
            setTimelineStartDateCol(dateCols[0]?.id || null);
            setTimelineEndDateCol(dateCols[1]?.id || null);
            setTimelineLabelCol(textCols[0]?.id || table.columns[0]?.id || null);
            setIsConfigureTimelineModalOpen(true);
        }
        else {
            onAddView(newViewType);
        }
        setIsAddViewModalOpen(false);
    };
    const handleConfirmKanbanConfig = () => {
        if (kanbanGroupByColumnId) {
            const options = { groupByColumnId: kanbanGroupByColumnId };
            if (isEditingExistingViewConfig) {
                onUpdateViewSpecificOptions(view.id, options);
            }
            else {
                onAddView(ViewType.KANBAN, options);
            }
        }
        setIsConfigureKanbanModalOpen(false);
    };
    const handleConfirmTimelineConfig = () => {
        if (timelineStartDateCol) {
            const options = {
                startDateColumnId: timelineStartDateCol,
                endDateColumnId: timelineEndDateCol,
                labelColumnId: timelineLabelCol,
            };
            if (isEditingExistingViewConfig) {
                onUpdateViewSpecificOptions(view.id, options);
            }
            else {
                onAddView(ViewType.TIMELINE, options);
            }
        }
        setIsConfigureTimelineModalOpen(false);
    };
    const viewTypeOptions = [
        { value: ViewType.GRID, label: _jsxs("div", { className: "flex items-center", children: [_jsx(TableCellsIcon, { className: "w-4 h-4 mr-2" }), "Grid"] }) },
        { value: ViewType.KANBAN, label: _jsxs("div", { className: "flex items-center", children: [_jsx(KanbanIcon, { className: "w-4 h-4 mr-2" }), "Kanban"] }) },
        { value: ViewType.TIMELINE, label: _jsxs("div", { className: "flex items-center", children: [_jsx(TimelineIcon, { className: "w-4 h-4 mr-2" }), "Timeline"] }) },
        // { value: ViewType.CALENDAR, label: <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>Calendar</div> },
        // { value: ViewType.GALLERY, label: <div className="flex items-center"><GalleryIcon className="w-4 h-4 mr-2"/>Gallery</div> },
    ];
    const getFilterInputType = (columnId) => {
        const col = table.columns.find((c) => c.id === columnId);
        if (!col)
            return "text";
        switch (col.type) {
            case DataType.NUMBER: return "number";
            case DataType.DATE: return "date";
            case DataType.BOOLEAN: return "checkbox";
            default: return "text";
        }
    };
    const canConfigureCurrentView = view.type === ViewType.KANBAN || view.type === ViewType.TIMELINE;
    return (_jsxs("div", { className: "p-2 border-b border-slate-300 bg-slate-50 flex items-center space-x-3 text-sm text-slate-700 sticky top-0 z-10", children: [_jsxs("div", { className: "relative", ref: viewDropdownRef, children: [_jsxs("button", { onClick: () => setIsViewDropdownOpen(!isViewDropdownOpen), className: "flex items-center px-3 py-1.5 hover:bg-slate-200 rounded-md", title: "Switch view", "aria-label": "Switch view", children: [_jsx(ViewTypeIconDisplay, { type: view.type }), _jsx(EditableText, { initialValue: view.name, onSave: (newName) => onRenameView(view.id, newName), className: "font-medium", inputClassName: "font-medium text-sm" }), _jsx(ChevronDownIcon, { className: `w-4 h-4 ml-1 transition-transform ${isViewDropdownOpen ? 'rotate-180' : ''}` })] }), isViewDropdownOpen && (_jsxs("div", { className: "absolute left-0 mt-1 w-60 bg-white rounded-md shadow-lg py-1 z-30 border border-slate-200", children: [table.views.map((v) => (_jsxs("button", { onClick: () => { onSetActiveView(v.id); setIsViewDropdownOpen(false); }, className: `w-full text-left px-3 py-1.5 flex items-center hover:bg-slate-100 ${v.id === view.id ? 'bg-sky-50 text-sky-700 font-semibold' : ''}`, children: [_jsx(ViewTypeIconDisplay, { type: v.type }), v.name, v.id === view.id && (_jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            if (table.views.length > 1)
                                                onDeleteView(v.id);
                                            else
                                                alert("Cannot delete the last view.");
                                            setIsViewDropdownOpen(false);
                                        }, className: "ml-auto p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded disabled:opacity-50 disabled:cursor-not-allowed", title: "Delete view", disabled: table.views.length <= 1, children: _jsx(TrashIcon, { className: "w-3.5 h-3.5" }) }))] }, v.id))), _jsx("div", { className: "my-1 border-t border-slate-200" }), _jsxs("button", { onClick: () => { setIsAddViewModalOpen(true); setIsViewDropdownOpen(false); }, className: "w-full text-left px-3 py-1.5 flex items-center hover:bg-slate-100 text-sky-600", children: [_jsx(PlusIcon, { className: "w-4 h-4 mr-2" }), " Create new view..."] }), canConfigureCurrentView && (_jsxs(_Fragment, { children: [_jsx("div", { className: "my-1 border-t border-slate-200" }), _jsxs("button", { onClick: () => { handleOpenConfigureViewModal(); setIsViewDropdownOpen(false); }, className: "w-full text-left px-3 py-1.5 flex items-center hover:bg-slate-100 text-slate-700", children: [_jsx(PencilIcon, { className: "w-4 h-4 mr-2" }), " Configure current view"] })] }))] }))] }), _jsxs("div", { className: "relative", ref: filterDropdownRef, children: [_jsxs("button", { onClick: () => setIsFilterDropdownOpen(!isFilterDropdownOpen), className: "flex items-center px-3 py-1.5 hover:bg-slate-200 rounded-md", title: "Filter rows", "aria-label": "Filter rows", children: [_jsx(FilterIcon, { className: "w-4 h-4 mr-1" }), " Filter ", view.filters.length > 0 && `(${view.filters.length})`] }), isFilterDropdownOpen && (_jsxs("div", { className: "absolute left-0 mt-1 w-[450px] bg-white rounded-md shadow-lg p-3 z-30 border border-slate-200 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar", children: [view.filters.map((filter) => (_jsxs("div", { className: "space-y-1 p-2 bg-slate-50 rounded", children: [_jsxs("div", { className: "grid grid-cols-[1fr_1fr_auto] gap-2 items-center", children: [_jsx(SelectInput, { options: columnOptions, value: filter.columnId, onChange: (val) => onUpdateFilter(filter.id, { columnId: val, value: '' }) }), " ", _jsx(SelectInput, { options: getApplicableFilterOperators(filter.columnId), value: filter.operator, onChange: (val) => onUpdateFilter(filter.id, { operator: val }) }), _jsx("button", { onClick: () => onDeleteFilter(filter.id), className: "text-red-500 hover:text-red-700 justify-self-end p-1", title: "Delete filter", "aria-label": "Delete filter", children: _jsx(TrashIcon, { className: "w-4 h-4" }) })] }), isValueNeededForOperator(filter.operator) && (table.columns.find((c) => c.id === filter.columnId)?.type === DataType.BOOLEAN ? (_jsx(SelectInput, { options: [{ value: 'true', label: 'Checked' }, { value: 'false', label: 'Unchecked' }], value: String(filter.value || 'false'), onChange: (val) => onUpdateFilter(filter.id, { value: val === 'true' ? true : false }), className: "w-full" })) : (_jsx("input", { type: getFilterInputType(filter.columnId), value: filter.value || '', onChange: (e) => onUpdateFilter(filter.id, { value: getFilterInputType(filter.columnId) === 'checkbox' ? e.target.checked : e.target.value }), placeholder: "Value", className: "w-full px-2 py-1 border border-slate-300 rounded-md text-sm" })))] }, filter.id))), _jsx("button", { onClick: onAddFilter, className: "w-full mt-2 px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-100 rounded-md border border-sky-200", children: "+ Add filter condition" })] }))] }), _jsxs("div", { className: "relative", ref: sortDropdownRef, children: [_jsxs("button", { onClick: () => setIsSortDropdownOpen(!isSortDropdownOpen), className: "flex items-center px-3 py-1.5 hover:bg-slate-200 rounded-md", title: "Sort rows", "aria-label": "Sort rows", children: [_jsx(SortAscendingIcon, { className: "w-4 h-4 mr-1" }), " Sort ", view.sorts.length > 0 && `(${view.sorts.length})`] }), isSortDropdownOpen && (_jsxs("div", { className: "absolute left-0 mt-1 w-80 bg-white rounded-md shadow-lg p-3 z-30 border border-slate-200 space-y-2", children: [view.sorts.map((sortRule) => (_jsxs("div", { className: "flex items-center space-x-2 p-2 bg-slate-50 rounded", children: [_jsx(SelectInput, { options: columnOptions, value: sortRule.columnId, onChange: (val) => onUpdateSort(sortRule.id, { columnId: val }), className: "flex-grow" }), _jsx(SelectInput, { options: [{ value: 'ASC', label: 'Ascending' }, { value: 'DESC', label: 'Descending' }], value: sortRule.direction, onChange: (val) => onUpdateSort(sortRule.id, { direction: val }), className: "w-32" }), _jsx("button", { onClick: () => onDeleteSort(sortRule.id), className: "text-red-500 hover:text-red-700 p-1", title: "Delete sort rule", "aria-label": "Delete sort rule", children: _jsx(TrashIcon, { className: "w-4 h-4" }) })] }, sortRule.id))), _jsx("button", { onClick: onAddSort, className: "w-full mt-2 px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-100 rounded-md border border-sky-200", children: "+ Add sort condition" })] }))] }), _jsxs("button", { onClick: onAddRow, className: "ml-auto px-3 py-1.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm transition-colors flex items-center", title: "Add new row", children: [_jsx(PlusIcon, { className: "w-4 h-4 mr-1" }), " Add Row"] }), _jsxs(Modal, { isOpen: isAddViewModalOpen, onClose: () => setIsAddViewModalOpen(false), title: "Create New View", footer: _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: () => setIsAddViewModalOpen(false), className: "px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md", "aria-label": "Cancel", children: "Cancel" }), _jsx("button", { onClick: handleConfirmAddView, className: "px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 rounded-md", "aria-label": "Next", children: "Next" })] }), children: [_jsx("p", { className: "text-sm text-slate-600 mb-2", children: "Choose a view type:" }), _jsx(SelectInput, { options: viewTypeOptions, value: newViewType, onChange: (val) => setNewViewType(val) }), _jsx("p", { className: "text-xs text-slate-500 mt-2", children: "Note: Calendar and Gallery views are placeholders." })] }), _jsx(Modal, { isOpen: isConfigureKanbanModalOpen, onClose: () => setIsConfigureKanbanModalOpen(false), title: isEditingExistingViewConfig ? "Configure Kanban View" : "Setup Kanban View", size: "md", footer: _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: () => setIsConfigureKanbanModalOpen(false), className: "px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md", "aria-label": "Cancel", children: "Cancel" }), _jsx("button", { onClick: handleConfirmKanbanConfig, className: "px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 rounded-md", disabled: !kanbanGroupByColumnId, children: isEditingExistingViewConfig ? "Save Changes" : "Create View" })] }), children: _jsxs("div", { className: "space-y-3", children: [_jsx("label", { htmlFor: "kanbanGroupBy", className: "block text-sm font-medium text-slate-700", children: "Group by column:" }), _jsx(SelectInput, { options: table.columns
                                .filter((col) => [DataType.SINGLE_SELECT, DataType.LINKED_RECORD, DataType.TEXT, DataType.BOOLEAN, DataType.NUMBER].includes(col.type))
                                .map((col) => ({ value: col.id, label: col.name })), value: kanbanGroupByColumnId || "", onChange: (val) => setKanbanGroupByColumnId(val), placeholder: "Select a column..." }), !kanbanGroupByColumnId && _jsx("p", { className: "text-xs text-red-500", children: "Please select a column to group by." }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Choose a column whose unique values will become the Kanban lanes." })] }) }), _jsx(Modal, { isOpen: isConfigureTimelineModalOpen, onClose: () => setIsConfigureTimelineModalOpen(false), title: isEditingExistingViewConfig ? "Configure Timeline View" : "Setup Timeline View", size: "md", footer: _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: () => setIsConfigureTimelineModalOpen(false), className: "px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md", "aria-label": "Cancel", children: "Cancel" }), _jsx("button", { onClick: handleConfirmTimelineConfig, className: "px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 rounded-md", disabled: !timelineStartDateCol, children: isEditingExistingViewConfig ? "Save Changes" : "Create View" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "timelineStartDate", className: "block text-sm font-medium text-slate-700 mb-1", children: ["Start Date Column ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(SelectInput, { options: dateColumnOptions, value: timelineStartDateCol || "", onChange: (val) => setTimelineStartDateCol(val), placeholder: "Select start date column..." }), !timelineStartDateCol && _jsx("p", { className: "text-xs text-red-500 mt-1", children: "Start date column is required." })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "timelineEndDate", className: "block text-sm font-medium text-slate-700 mb-1", children: "End Date Column (Optional)" }), _jsx(SelectInput, { options: [{ value: '', label: 'None (use default duration)' }, ...dateColumnOptions], value: timelineEndDateCol || "", onChange: (val) => setTimelineEndDateCol(val === '' ? null : val), placeholder: "Select end date column..." }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "If not set, items will have a default duration." })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "timelineLabel", className: "block text-sm font-medium text-slate-700 mb-1", children: "Label Column (Optional)" }), _jsx(SelectInput, { options: [{ value: '', label: 'Default (Primary Column)' }, ...allColumnOptionsForLabel], value: timelineLabelCol || "", onChange: (val) => setTimelineLabelCol(val === '' ? null : val), placeholder: "Select label column..." }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Column to display as the item label on the timeline." })] })] }) })] }));
};
export default Toolbar;
//# sourceMappingURL=Toolbar.js.map
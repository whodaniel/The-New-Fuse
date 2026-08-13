import { WorkspaceApiService } from '@/api/workspace';
import { isFairtableComponentsFeatureEnabled } from '@/config/featureFlags';
import {
  Activity,
  Calendar,
  Columns,
  Database,
  Grid,
  MoreVertical,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DataType,
  ViewType,
  evaluateFormula,
  type AppState as FairtableAppState,
  type CellValue,
  type Column as FairtableColumn,
  type Row as FairtableRow,
  type Table as FairtableTable,
  type View as FairtableView,
} from '@the-new-fuse/fairtable-core';
import { GridView, KanbanView, TableView } from '@the-new-fuse/fairtable-components';

interface WorkspaceTableSummary {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  lastModified: string;
  collaborators: number;
  viewType: 'grid' | 'kanban' | 'timeline';
  status: 'active' | 'archived' | 'draft';
}

type FairtableViewMode = 'grid' | 'kanban' | 'timeline';

const normalizeViewMode = (value?: string): FairtableViewMode => {
  if (value === 'kanban' || value === 'timeline' || value === 'grid') {
    return value;
  }
  return 'grid';
};

const PREVIEW_TABLE: FairtableTable = {
  id: 'ft_preview_table',
  name: 'Fairtable Preview',
  columns: [
    { id: 'col_title', name: 'Title', type: DataType.TEXT },
    {
      id: 'col_status',
      name: 'Status',
      type: DataType.SINGLE_SELECT,
      options: [
        { id: 'status_todo', name: 'Todo', colorClass: 'bg-slate-200 text-slate-700' },
        {
          id: 'status_progress',
          name: 'In Progress',
          colorClass: 'bg-blue-200 text-blue-700',
        },
        { id: 'status_done', name: 'Done', colorClass: 'bg-green-200 text-green-700' },
      ],
    },
    { id: 'col_estimate', name: 'Estimate', type: DataType.NUMBER },
    { id: 'col_owner', name: 'Owner', type: DataType.TEXT },
    { id: 'col_due', name: 'Due Date', type: DataType.DATE },
  ],
  rows: [
    {
      id: 'row_preview_1',
      data: {
        col_title: 'Reconnect fairtable dashboard',
        col_status: 'status_progress',
        col_estimate: 3,
        col_owner: 'TNF Core',
        col_due: '2026-05-20',
      },
      createdAt: '2026-05-17T00:00:00.000Z',
      updatedAt: '2026-05-17T00:00:00.000Z',
      parentId: null,
      depth: 0,
      isCollapsed: false,
    },
    {
      id: 'row_preview_2',
      data: {
        col_title: 'Restore adapter bridge',
        col_status: 'status_todo',
        col_estimate: 5,
        col_owner: 'Relay',
        col_due: '2026-05-24',
      },
      createdAt: '2026-05-17T00:00:00.000Z',
      updatedAt: '2026-05-17T00:00:00.000Z',
      parentId: null,
      depth: 0,
      isCollapsed: false,
    },
    {
      id: 'row_preview_3',
      data: {
        col_title: 'Write cross-package tests',
        col_status: 'status_done',
        col_estimate: 2,
        col_owner: 'QA',
        col_due: '2026-05-18',
      },
      createdAt: '2026-05-17T00:00:00.000Z',
      updatedAt: '2026-05-17T00:00:00.000Z',
      parentId: null,
      depth: 0,
      isCollapsed: false,
    },
  ],
  columnOrder: ['col_title', 'col_status', 'col_estimate', 'col_owner', 'col_due'],
  views: [
    {
      id: 'view_preview_grid',
      name: 'Grid',
      type: ViewType.GRID,
      filters: [],
      sorts: [],
      groupBy: [],
      columnOrder: ['col_title', 'col_status', 'col_estimate', 'col_owner', 'col_due'],
      columnVisibility: {},
      columnWidths: {},
      viewSpecificOptions: {},
    },
    {
      id: 'view_preview_kanban',
      name: 'Kanban',
      type: ViewType.KANBAN,
      filters: [],
      sorts: [],
      groupBy: [],
      columnOrder: ['col_title', 'col_status', 'col_estimate', 'col_owner', 'col_due'],
      columnVisibility: {},
      columnWidths: {},
      viewSpecificOptions: { groupByColumnId: 'col_status' },
    },
  ],
  activeViewId: 'view_preview_grid',
};

const PREVIEW_APP_STATE: FairtableAppState = {
  tables: [PREVIEW_TABLE],
  activeTableId: PREVIEW_TABLE.id,
};

const PREVIEW_COLUMNS_TO_DISPLAY = PREVIEW_TABLE.columnOrder
  .map((columnId) => PREVIEW_TABLE.columns.find((column) => column.id === columnId))
  .filter(Boolean) as FairtableColumn[];

const PREVIEW_GRID_VIEW = PREVIEW_TABLE.views.find((view) => view.id === 'view_preview_grid') as FairtableView;
const PREVIEW_KANBAN_VIEW = PREVIEW_TABLE.views.find(
  (view) => view.id === 'view_preview_kanban'
) as FairtableView;

const FairtableDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { viewType } = useParams<{ viewType?: string }>();

  const [tables, setTables] = useState<WorkspaceTableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<FairtableViewMode>(normalizeViewMode(viewType));

  useEffect(() => {
    setSelectedView(normalizeViewMode(viewType));
  }, [viewType]);

  useEffect(() => {
    loadTables();
  }, []);

  const fairtableComponentsEnabled = isFairtableComponentsFeatureEnabled();

  const fairtableComponentRegistry = useMemo(
    () => ({ grid: GridView, kanban: KanbanView, table: TableView }),
    []
  );

  const formulaProbe = useMemo(() => {
    const result = evaluateFormula(
      '{Estimate} * 2',
      PREVIEW_TABLE.rows[0],
      PREVIEW_TABLE.columns,
      PREVIEW_TABLE.rows,
      PREVIEW_APP_STATE.tables
    );

    if (result.error) {
      return `Formula error: ${result.error}`;
    }

    return `Formula check (Estimate*2): ${String(result.value)}`;
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const workspaceService = new WorkspaceApiService();
      const response = await workspaceService.getCurrentWorkspace();
      const responseError =
        typeof response.error === 'string' ? response.error : response.error?.message;

      if (response.success && response.data) {
        const actualTables: WorkspaceTableSummary[] = (response.data as any)?.tables || [];
        setTables(actualTables);
      } else {
        throw new Error(responseError || 'Failed to load workspace data');
      }
    } catch (error) {
      console.error('Error loading tables', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewTable = () => {
    console.log('Create table clicked');
  };

  const openTable = (table: WorkspaceTableSummary) => {
    const route = `/fairtable/${table.viewType}?id=${table.id}`;
    navigate(route);
  };

  const getViewIcon = (viewMode: string) => {
    switch (viewMode) {
      case 'grid':
        return <Grid className="w-4 h-4" />;
      case 'kanban':
        return <Columns className="w-4 h-4" />;
      case 'timeline':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Grid className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const onNoopAddColumn = () => undefined;

  const onNoopUpdateColumn = (columnId: string, updates: Partial<FairtableColumn>) => {
    void columnId;
    void updates;
  };

  const onNoopDeleteColumn = (columnId: string) => {
    void columnId;
  };

  const onNoopReorderColumn = (draggedColumnId: string, targetColumnId: string) => {
    void draggedColumnId;
    void targetColumnId;
  };

  const onNoopAddRow = (parentId?: string | null, defaultValues?: Partial<FairtableRow['data']>) => {
    void parentId;
    void defaultValues;
  };

  const onNoopUpdateCell = (rowId: string, columnId: string, value: CellValue) => {
    void rowId;
    void columnId;
    void value;
  };

  const onNoopDeleteRow = (rowId: string) => {
    void rowId;
  };

  const onNoopToggleCollapse = (rowId: string) => {
    void rowId;
  };

  const onNoopOpenLinkRecord = (
    rowId: string,
    columnId: string,
    linkedTableId: string,
    currentLinkedIds: string[]
  ) => {
    void rowId;
    void columnId;
    void linkedTableId;
    void currentLinkedIds;
  };

  const previewTableView = (
    <TableView
      table={PREVIEW_TABLE}
      view={PREVIEW_GRID_VIEW}
      appState={PREVIEW_APP_STATE}
      columnsToDisplay={PREVIEW_COLUMNS_TO_DISPLAY}
      rowsToDisplay={PREVIEW_TABLE.rows}
      onAddColumn={onNoopAddColumn}
      onUpdateColumn={onNoopUpdateColumn}
      onDeleteColumn={onNoopDeleteColumn}
      onReorderColumn={onNoopReorderColumn}
      onAddRow={onNoopAddColumn}
      onUpdateCell={onNoopUpdateCell}
      onDeleteRow={onNoopDeleteRow}
      onOpenLinkRecordModal={onNoopOpenLinkRecord}
    />
  );

  const previewGridView = (
    <GridView
      table={PREVIEW_TABLE}
      view={PREVIEW_GRID_VIEW}
      appState={PREVIEW_APP_STATE}
      columnsToDisplay={PREVIEW_COLUMNS_TO_DISPLAY}
      rowsToDisplay={PREVIEW_TABLE.rows}
      onAddColumn={onNoopAddColumn}
      onUpdateColumn={onNoopUpdateColumn}
      onDeleteColumn={onNoopDeleteColumn}
      onReorderColumn={onNoopReorderColumn}
      onAddRow={onNoopAddRow}
      onUpdateCell={onNoopUpdateCell}
      onDeleteRow={onNoopDeleteRow}
      onToggleRowCollapse={onNoopToggleCollapse}
      onOpenLinkRecordModal={onNoopOpenLinkRecord}
    />
  );

  const previewKanbanView = (
    <KanbanView
      table={PREVIEW_TABLE}
      view={PREVIEW_KANBAN_VIEW}
      appState={PREVIEW_APP_STATE}
      columnsToDisplay={PREVIEW_COLUMNS_TO_DISPLAY}
      rowsToDisplay={PREVIEW_TABLE.rows}
      kanbanOptions={{ groupByColumnId: 'col_status' }}
      onUpdateCell={onNoopUpdateCell}
      onOpenLinkRecordModal={onNoopOpenLinkRecord}
      onAddRow={onNoopAddRow}
    />
  );

  const previewView =
    selectedView === 'kanban'
      ? previewKanbanView
      : selectedView === 'timeline'
        ? previewTableView
        : previewGridView;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Loading Fairtable Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Fairtable Dashboard</h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Manage your databases, tables, and collaborative workspaces
          </p>
        </div>

        <button
          onClick={createNewTable}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Table
        </button>
      </div>

      {fairtableComponentsEnabled && (
        <div className="mb-8 bg-transparent dark:bg-transparent rounded-md border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fairtable Engine Preview</h2>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Runtime wiring is active for {Object.keys(fairtableComponentRegistry).join(', ')} components.
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {formulaProbe}
            </span>
          </div>

          <div className="h-[360px] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-slate-900">
            {previewView}
          </div>

          {selectedView === 'timeline' && (
            <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
              Timeline route is enabled; preview currently uses TableView until timeline-specific UI parity is reconnected.
            </p>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Database,
            bg: 'bg-blue-100',
            color: 'text-blue-600',
            label: 'Active Tables',
            value: tables.length,
          },
          {
            icon: Activity,
            bg: 'bg-green-100',
            color: 'text-green-600',
            label: 'Total Records',
            value: tables.reduce((sum, table) => sum + table.recordCount, 0),
          },
          {
            icon: Users,
            bg: 'bg-purple-100',
            color: 'text-purple-600',
            label: 'Collaborators',
            value: tables.reduce((sum, table) => sum + table.collaborators, 0),
          },
          {
            icon: TrendingUp,
            bg: 'bg-orange-100',
            color: 'text-orange-600',
            label: 'Uptime',
            value: '94%',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-transparent dark:bg-transparent p-4 rounded-md shadow-none border border-gray-200 dark:border-gray-700 flex items-center gap-4"
          >
            <div className={`p-3 rounded-md ${stat.bg} ${stat.color} dark:bg-opacity-20`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Tables</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">View as:</span>
            <div className="flex bg-gray-100 dark:bg-transparent rounded-md p-1">
              {[
                { id: 'grid', icon: Grid },
                { id: 'kanban', icon: Columns },
                { id: 'timeline', icon: Calendar },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id as FairtableViewMode)}
                  className={`p-1.5 rounded-md transition-all ${
                    selectedView === view.id
                      ? 'bg-transparent dark:bg-gray-600 text-blue-600 shadow-none'
                      : 'text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200'
                  }`}
                  aria-label={`${view.id} view`}
                >
                  <view.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => openTable(table)}
              className="group bg-transparent dark:bg-transparent rounded-md shadow-none border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer p-4 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{table.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(table.status)}`}
                    >
                      {table.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground line-clamp-2">
                    {table.description}
                  </p>
                </div>

                <button
                  className="text-gray-400 hover:text-muted-foreground dark:hover:text-gray-300 p-1 rounded hover:bg-muted/20 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('More options clicked');
                  }}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    {getViewIcon(table.viewType)}
                    <span className="capitalize">{table.viewType} View</span>
                  </div>
                  <span className="text-muted-foreground dark:text-muted-foreground">
                    {table.recordCount} records
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.collaborators} collaborators</span>
                  </div>
                  <span className="text-muted-foreground dark:text-muted-foreground">
                    Updated {table.lastModified}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tables.length === 0 && (
        <div className="bg-transparent dark:bg-transparent rounded-md shadow-none border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
          <Database className="w-16 h-16 text-gray-300 dark:text-muted-foreground mb-4" />
          <p className="text-muted-foreground dark:text-muted-foreground mb-6">
            No tables found. Create your first table to get started.
          </p>
          <button
            onClick={createNewTable}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Your First Table
          </button>
        </div>
      )}
    </div>
  );
};

export default FairtableDashboard;

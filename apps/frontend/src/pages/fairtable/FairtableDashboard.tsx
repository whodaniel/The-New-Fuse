import { WorkspaceApiService } from '@/api/workspace';
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
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// TODO: Import when packages are properly configured
// import { GridView, KanbanView, TableView } from '@the-new-fuse/fairtable-components';
// import { formulaEvaluator } from '@the-new-fuse/fairtable-core';

interface Table {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  lastModified: string;
  collaborators: number;
  viewType: 'grid' | 'kanban' | 'timeline';
  status: 'active' | 'archived' | 'draft';
}

const FairtableDashboard: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'grid' | 'kanban' | 'timeline'>('grid');
  const navigate = useNavigate();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      // Use actual API service to load workspace data
      const workspaceService = new WorkspaceApiService();
      const response = await workspaceService.getCurrentWorkspace();
      const responseError =
        typeof response.error === 'string' ? response.error : response.error?.message;

      if (response.success && response.data) {
        const actualTables: Table[] = (response.data as any)?.tables || [];
        setTables(actualTables);
      } else {
        throw new Error(responseError || 'Failed to load workspace data');
      }
    } catch (error) {
      console.error('Error loading tables', error);
      // You might want to add a notification system here
    } finally {
      setLoading(false);
    }
  };

  const createNewTable = () => {
    console.log('Create table clicked');
    // Implement creation logic
  };

  const openTable = (table: Table) => {
    const route = `/fairtable/${table.viewType}?id=${table.id}`;
    navigate(route);
  };

  const getViewIcon = (viewType: string) => {
    switch (viewType) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Fairtable Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Fairtable Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your databases, tables, and collaborative workspaces
          </p>
        </div>

        <button
          onClick={createNewTable}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Table
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4"
          >
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} dark:bg-opacity-20`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Tables</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">View as:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { id: 'grid', icon: Grid },
                { id: 'kanban', icon: Columns },
                { id: 'timeline', icon: Calendar },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id as any)}
                  className={`p-1.5 rounded-md transition-all ${
                    selectedView === view.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  aria-label={`${view.id} view`}
                >
                  <view.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => openTable(table)}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer p-5 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {table.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(table.status)}`}
                    >
                      {table.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {table.description}
                  </p>
                </div>

                <button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  <span className="text-gray-500 dark:text-gray-400">
                    {table.recordCount} records
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.collaborators} collaborators</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Updated {table.lastModified}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tables.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
          <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            No tables found. Create your first table to get started.
          </p>
          <button
            onClick={createNewTable}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

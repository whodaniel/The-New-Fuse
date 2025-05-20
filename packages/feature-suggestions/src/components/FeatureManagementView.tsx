import React, { useState } from 'react';
import KanbanBoard from './KanbanBoard.js';
import { FeatureSuggestionList } from './FeatureSuggestionList.js';
import { useKanbanBoard } from '../hooks/useKanbanBoard.js';
import { useFeatureSuggestions } from '../hooks/useFeatureSuggestions.js';
import { SuggestionPriority, SuggestionStatus } from '../types.js';
import { SuggestionService } from '../services/types.js';

interface FeatureManagementViewProps {
  suggestionService: SuggestionService;
  currentUserId: string;
}

const FeatureManagementView: React.FC<FeatureManagementViewProps> = ({
  suggestionService,
  currentUserId,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showNewSuggestionForm, setShowNewSuggestionForm] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    priority: SuggestionPriority.MEDIUM,
    tags: [] as string[],
  });

  // Get data from useKanbanBoard
  const {
    columns,
    loading,
    error,
    moveItem,
    refresh
  } = useKanbanBoard({
    suggestionService,
  });

  // Use useFeatureSuggestions to get the remaining needed functions and data
  const { 
    suggestions,
    submitSuggestion,
    updateSuggestionStatus,
    convertSuggestionToFeature
  } = useFeatureSuggestions({ suggestionService });

  // Define handleDragEnd manually since it's not returned from useKanbanBoard
  const handleDragEnd = (item: any, sourceColumnId: string, targetColumnId: string) => {
    moveItem(item.id, sourceColumnId, targetColumnId);
  };

  const handleSubmitNewSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitSuggestion(
        newSuggestion.title,
        newSuggestion.description,
        currentUserId,
        newSuggestion.priority,
        newSuggestion.tags
      );
      setShowNewSuggestionForm(false);
      setNewSuggestion({
        title: "",
        description: "",
        priority: SuggestionPriority.MEDIUM,
        tags: [],
      });
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'kanban'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setViewMode('kanban')}
          >
            Kanban View
          </button>
        </div>
        <button
          onClick={() => setShowNewSuggestionForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          New Suggestion
        </button>
      </div>

      {showNewSuggestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">New Feature Suggestion</h2>
            <form onSubmit={handleSubmitNewSuggestion}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newSuggestion.title}
                    onChange={(e) =>
                      setNewSuggestion((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter feature title"
                    title="Feature title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={newSuggestion.description}
                    onChange={(e) =>
                      setNewSuggestion((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter feature description"
                    title="Feature description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    value={newSuggestion.priority}
                    onChange={(e) =>
                      setNewSuggestion((prev) => ({
                        ...prev,
                        priority: e.target.value as SuggestionPriority,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    title="Priority level"
                  >
                    {Object.values(SuggestionPriority).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newSuggestion.tags.join(', ')}
                    onChange={(e) =>
                      setNewSuggestion((prev) => ({
                        ...prev,
                        tags: e.target.value.split(',').map((t) => t.trim()),
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas"
                    title="Feature tags"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewSuggestionForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'kanban' ? (
        <KanbanBoard columns={columns as any} onDragEnd={handleDragEnd as any} />
      ) : (
        <FeatureSuggestionList
          suggestionService={suggestionService}
          suggestions={suggestions}
          onUpdateStatus={updateSuggestionStatus}
          onConvertToFeature={(suggestionId: string) => {
            // This wrapper function converts the return type to void
            convertSuggestionToFeature(suggestionId).then(() => {});
            return Promise.resolve();
          }}
          onRefresh={refresh}
        />
      )}
    </div>
  );
};

export default FeatureManagementView;

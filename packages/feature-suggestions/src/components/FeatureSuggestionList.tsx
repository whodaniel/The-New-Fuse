import React, { useState } from 'react';
import { FeatureSuggestion, SuggestionStatus } from '../types.js';

interface FeatureSuggestionCardProps {
  suggestion: FeatureSuggestion;
  onVote: (id: string) => Promise<void>;
  onConvert: (id: string) => Promise<void>;
  onAddTodo: (todo: { title: string, suggestionId: string }) => Promise<void>;
  onAddComment: (content: string) => Promise<void>;
  currentUserId: string;
}

const FeatureSuggestionCard: React.FC<FeatureSuggestionCardProps> = ({ 
  suggestion, 
  onVote, 
  onConvert, 
  onAddTodo, 
  onAddComment, 
  currentUserId 
}) => {
  const [newComment, setNewComment] = useState('');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  
  const handleVote = () => onVote(suggestion.id);
  const handleConvert = () => onConvert(suggestion.id);
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };
  
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim()) {
      onAddTodo({
        title: newTodoTitle,
        suggestionId: suggestion.id
      });
      setNewTodoTitle('');
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold">{suggestion.title}</h3>
          <p className="text-gray-600">{suggestion.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleVote} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
            ⬆️ {suggestion.votes}
          </button>
          {suggestion.status !== SuggestionStatus.CONVERTED && (
            <button onClick={handleConvert} className="px-3 py-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
              Convert to Feature
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2 mb-3">
        {suggestion.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Add a comment</h4>
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
            placeholder="Write a comment..."
          />
          <button type="submit" className="px-3 py-2 bg-blue-500 text-white rounded-md">
            Add
          </button>
        </form>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Add a todo</h4>
        <form onSubmit={handleAddTodo} className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
            placeholder="Create a todo item..."
          />
          <button type="submit" className="px-3 py-2 bg-green-500 text-white rounded-md">
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

interface FeatureSuggestionListProps {
  suggestionService: {
    getSuggestionsByStatus: (status: SuggestionStatus) => Promise<FeatureSuggestion[]>;
  };
  suggestions: FeatureSuggestion[];
  onUpdateStatus: (suggestionId: string, status: SuggestionStatus) => Promise<void>;
  onConvertToFeature: (suggestionId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const FeatureSuggestionList: React.FC<FeatureSuggestionListProps> = ({
  suggestionService,
  suggestions,
  onUpdateStatus,
  onConvertToFeature,
  onRefresh,
}) => {
  return (
    <div className="space-y-4">
      {suggestions.map((suggestion: FeatureSuggestion) => (
        <div key={suggestion.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
            <div className="flex space-x-2">
              <button 
                onClick={() => onUpdateStatus(suggestion.id, SuggestionStatus.UNDER_REVIEW)} 
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                Review
              </button>
              <button 
                onClick={() => onConvertToFeature(suggestion.id)} 
                className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
              >
                Convert
              </button>
            </div>
          </div>
          <p className="mt-2 text-gray-600">{suggestion.description}</p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>👍 {suggestion.votes} votes</span>
            <span>Status: {suggestion.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export { FeatureSuggestionList };

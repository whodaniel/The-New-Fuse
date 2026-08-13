/**
 * Problem Identification Step
 *
 * Help users identify and describe their issue
 */

import {
  AlertCircle,
  Bug,
  ChevronRight,
  Cloud,
  Database,
  HelpCircle,
  Search,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { WizardContext } from '../WizardSystem.js';

export interface ProblemIdentificationProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface ProblemCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  subcategories: string[];
}

const PROBLEM_CATEGORIES: ProblemCategory[] = [
  {
    id: 'agent',
    label: 'Agent Issues',
    description: 'Problems with AI agent behavior or performance',
    icon: Bug,
    subcategories: [
      'Agent not responding',
      'Incorrect responses',
      'Slow performance',
      'Context issues',
      'Tool failures',
    ],
  },
  {
    id: 'connection',
    label: 'Connection Problems',
    description: 'Issues connecting to services or APIs',
    icon: Zap,
    subcategories: [
      'API connection failed',
      'WebSocket disconnects',
      'Timeout errors',
      'Authentication failures',
    ],
  },
  {
    id: 'database',
    label: 'Database Issues',
    description: 'Problems with data storage or retrieval',
    icon: Database,
    subcategories: [
      'Connection errors',
      'Query failures',
      'Data not saving',
      'Migration issues',
      'Performance problems',
    ],
  },
  {
    id: 'deployment',
    label: 'Deployment Issues',
    description: 'Problems deploying or running services',
    icon: Cloud,
    subcategories: [
      'Build failures',
      'Container issues',
      'Environment variables',
      'Health check failures',
      'Scaling problems',
    ],
  },
  {
    id: 'access',
    label: 'Access & Permissions',
    description: 'Issues with user access or permissions',
    icon: Users,
    subcategories: [
      'Permission denied',
      'Login issues',
      'Role problems',
      'Token expired',
      'Rate limiting',
    ],
  },
];

const COMMON_ISSUES = [
  { id: 'agent-timeout', label: 'Agent requests timing out', category: 'agent' },
  { id: 'api-401', label: 'Getting 401 Unauthorized errors', category: 'connection' },
  { id: 'db-connection', label: 'Cannot connect to database', category: 'database' },
  { id: 'deploy-fail', label: 'CloudRuntime deployment failing', category: 'deployment' },
  { id: 'permission-denied', label: 'Permission denied errors', category: 'access' },
];

export const ProblemIdentification: React.FC<ProblemIdentificationProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    (context.data.problemCategory as string) || null
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    (context.data.problemSubcategory as string) || null
  );
  const [description, setDescription] = useState((context.data.problemDescription as string) || '');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    onDataChange({ problemCategory: categoryId, problemSubcategory: null });
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    onDataChange({ problemSubcategory: subcategory });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onDataChange({ problemDescription: value });
  };

  const handleQuickSelect = (issue: (typeof COMMON_ISSUES)[0]) => {
    setSelectedCategory(issue.category);
    setDescription(issue.label);
    onDataChange({
      problemCategory: issue.category,
      problemDescription: issue.label,
      quickIssueId: issue.id,
    });
  };

  const filteredIssues = COMMON_ISSUES.filter((issue) =>
    issue.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategoryData = PROBLEM_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="wizard-step-problem-id">
      <div className="step-header">
        <AlertCircle className="w-8 h-8 text-primary" />
        <h2 className="step-title">What's the Problem?</h2>
        <p className="step-description">
          Tell us what you're experiencing so we can help you fix it
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          {validationErrors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="problem-content">
        <div className="quick-search">
          <div className="search-input">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search for your issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && filteredIssues.length > 0 && (
            <div className="search-results">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="search-result"
                  onClick={() => handleQuickSelect(issue)}
                >
                  <span>{issue.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="category-selection">
          <h3>Select a Category</h3>
          <div className="categories-grid">
            {PROBLEM_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;

              return (
                <div
                  key={category.id}
                  className={`category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <Icon className="w-6 h-6" />
                  <h4>{category.label}</h4>
                  <p>{category.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {selectedCategoryData && (
          <div className="subcategory-selection">
            <h3>What specifically?</h3>
            <div className="subcategories">
              {selectedCategoryData.subcategories.map((sub) => (
                <button
                  key={sub}
                  className={`subcategory-btn ${selectedSubcategory === sub ? 'selected' : ''}`}
                  onClick={() => handleSubcategorySelect(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="description-section">
          <h3>
            <HelpCircle className="w-4 h-4" />
            Describe the Problem
          </h3>
          <textarea
            placeholder="Please describe what's happening, including any error messages..."
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={4}
          />
          <div className="description-tips">
            <p>Helpful details to include:</p>
            <ul>
              <li>When did the problem start?</li>
              <li>What were you trying to do?</li>
              <li>Any error messages you see</li>
              <li>Steps to reproduce the issue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

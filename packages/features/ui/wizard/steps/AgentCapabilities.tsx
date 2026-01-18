/**
 * Agent Capabilities Step
 *
 * Step for selecting and configuring agent capabilities
 */

import {
  Brain,
  CheckCircle,
  Code,
  Database,
  Eye,
  FileSearch,
  Globe,
  MessageSquare,
  Shield,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { WizardContext } from '../WizardSystem';

export interface AgentCapabilitiesProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface Capability {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: string;
  premium?: boolean;
  requiresConfig?: boolean;
}

const CAPABILITIES: Capability[] = [
  // Code capabilities
  {
    id: 'code-generation',
    label: 'Code Generation',
    description: 'Generate code in multiple programming languages',
    icon: Code,
    category: 'Code',
  },
  {
    id: 'code-review',
    label: 'Code Review',
    description: 'Review and suggest improvements to code',
    icon: Eye,
    category: 'Code',
  },
  {
    id: 'debugging',
    label: 'Debugging',
    description: 'Help identify and fix bugs in code',
    icon: Terminal,
    category: 'Code',
  },
  // Communication capabilities
  {
    id: 'text-generation',
    label: 'Text Generation',
    description: 'Generate natural language text and content',
    icon: MessageSquare,
    category: 'Communication',
  },
  {
    id: 'conversation',
    label: 'Conversation',
    description: 'Engage in multi-turn conversations',
    icon: MessageSquare,
    category: 'Communication',
  },
  // Analysis capabilities
  {
    id: 'analysis',
    label: 'Data Analysis',
    description: 'Analyze data and provide insights',
    icon: Brain,
    category: 'Analysis',
  },
  {
    id: 'summarization',
    label: 'Summarization',
    description: 'Summarize long documents or content',
    icon: FileSearch,
    category: 'Analysis',
  },
  // Integration capabilities
  {
    id: 'web-search',
    label: 'Web Search',
    description: 'Search the web for information',
    icon: Globe,
    category: 'Integration',
    requiresConfig: true,
  },
  {
    id: 'database-access',
    label: 'Database Access',
    description: 'Query and interact with databases',
    icon: Database,
    category: 'Integration',
    requiresConfig: true,
    premium: true,
  },
  // Orchestration capabilities
  {
    id: 'orchestration',
    label: 'Orchestration',
    description: 'Coordinate multiple agents',
    icon: Workflow,
    category: 'Orchestration',
    premium: true,
  },
  {
    id: 'task-delegation',
    label: 'Task Delegation',
    description: 'Delegate tasks to other agents',
    icon: Zap,
    category: 'Orchestration',
    premium: true,
  },
  // Security capabilities
  {
    id: 'secure-execution',
    label: 'Secure Execution',
    description: 'Execute code in sandboxed environment',
    icon: Shield,
    category: 'Security',
    premium: true,
  },
];

const CATEGORIES = [
  'Code',
  'Communication',
  'Analysis',
  'Integration',
  'Orchestration',
  'Security',
];

export const AgentCapabilities: React.FC<AgentCapabilitiesProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const initialCapabilities =
    (context.data.capabilities as string[]) || (context.data.initialCapabilities as string[]) || [];

  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(initialCapabilities);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Code');

  const toggleCapability = useCallback(
    (capabilityId: string) => {
      setSelectedCapabilities((prev) => {
        const newCapabilities = prev.includes(capabilityId)
          ? prev.filter((id) => id !== capabilityId)
          : [...prev, capabilityId];

        onDataChange({ capabilities: newCapabilities });
        return newCapabilities;
      });
    },
    [onDataChange]
  );

  const selectAll = useCallback(
    (category: string) => {
      const categoryCapabilities = CAPABILITIES.filter((c) => c.category === category).map(
        (c) => c.id
      );

      setSelectedCapabilities((prev) => {
        const newCapabilities = [...new Set([...prev, ...categoryCapabilities])];
        onDataChange({ capabilities: newCapabilities });
        return newCapabilities;
      });
    },
    [onDataChange]
  );

  const clearAll = useCallback(
    (category: string) => {
      const categoryCapabilities = CAPABILITIES.filter((c) => c.category === category).map(
        (c) => c.id
      );

      setSelectedCapabilities((prev) => {
        const newCapabilities = prev.filter((id) => !categoryCapabilities.includes(id));
        onDataChange({ capabilities: newCapabilities });
        return newCapabilities;
      });
    },
    [onDataChange]
  );

  return (
    <div className="wizard-step-capabilities">
      <div className="step-header">
        <CheckCircle className="w-8 h-8 text-primary" />
        <h2 className="step-title">Select Capabilities</h2>
        <p className="step-description">
          Choose what your agent will be able to do. You can always add or remove capabilities
          later.
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

      <div className="selected-count">
        <span className="count">{selectedCapabilities.length}</span> capabilities selected
      </div>

      <div className="capabilities-container">
        {CATEGORIES.map((category) => {
          const categoryCapabilities = CAPABILITIES.filter((c) => c.category === category);
          const selectedInCategory = categoryCapabilities.filter((c) =>
            selectedCapabilities.includes(c.id)
          ).length;
          const isExpanded = expandedCategory === category;

          return (
            <div key={category} className="category-section">
              <div
                className="category-header"
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
              >
                <h3 className="category-title">
                  {category}
                  <span className="category-count">
                    {selectedInCategory}/{categoryCapabilities.length}
                  </span>
                </h3>
                <div className="category-actions">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAll(category);
                    }}
                  >
                    Select All
                  </button>
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAll(category);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="capability-grid">
                  {categoryCapabilities.map((capability) => {
                    const Icon = capability.icon;
                    const isSelected = selectedCapabilities.includes(capability.id);

                    return (
                      <div
                        key={capability.id}
                        className={`capability-card ${isSelected ? 'selected' : ''} ${
                          capability.premium ? 'premium' : ''
                        }`}
                        onClick={() => toggleCapability(capability.id)}
                      >
                        {capability.premium && <span className="premium-badge">Premium</span>}
                        {capability.requiresConfig && (
                          <span className="config-badge">Requires Setup</span>
                        )}
                        <div className="capability-icon">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="capability-label">{capability.label}</h4>
                        <p className="capability-description">{capability.description}</p>
                        <div className="capability-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCapability(capability.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="step-tips">
        <h4>Tips</h4>
        <ul>
          <li>Start with core capabilities and add more as needed</li>
          <li>Premium capabilities require a paid plan</li>
          <li>Some capabilities need additional configuration after creation</li>
        </ul>
      </div>
    </div>
  );
};

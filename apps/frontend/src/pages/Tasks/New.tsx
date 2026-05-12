import { Badge, Button, Card, Input, Label, Textarea } from '@/components/ui';
import { createTask, type LedgerStatus } from '@/services/unifiedLedgerApi';
import { Calendar, ChevronLeft, Clock, Paperclip, Plus, Tag, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assignedTo: string;
  dueDate: string;
  estimatedHours: string;
  tags: string[];
  newTag: string;
}

interface AgentOption {
  id: string | number;
  name: string;
}

/**
 * New Task page component
 */
const NewTask: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'not_started',
    priority: 'medium',
    category: 'development',
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
    tags: [],
    newTag: '',
  });

  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          // Adjust based on your API response structure (e.g. data.agents or just data)
          setAgents(Array.isArray(data) ? data : data.agents || []);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle custom Select component change (passes value string directly)
  const handleSelectChange = (name: keyof TaskFormData) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.newTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(formData.newTag.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, prev.newTag.trim()],
          newTag: '',
        }));
      }
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const statusMap: Record<string, string> = {
      not_started: 'submitted',
      in_progress: 'in_progress',
      pending_review: 'under_review',
      completed: 'completed',
    };
    const priorityMap: Record<string, string> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    };

    createTask({
      title: formData.title,
      description: formData.description,
      status: (statusMap[formData.status] || 'submitted') as LedgerStatus,
      priority: (priorityMap[formData.priority] || 'medium') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical'
        | 'urgent',
      owner: 'ui-user',
      assignee: formData.assignedTo || undefined,
      tags: formData.tags,
      metadata: {
        category: formData.category,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours,
      },
      fractal: {
        progressPercent: formData.status === 'completed' ? 100 : 0,
      },
    })
      .then((created) => {
        toast.success('Task created and added to the event ledger');
        navigate(`/tasks/${created.id}`);
      })
      .catch((error) => {
        console.error('Failed to create task:', error);
        toast.error('Failed to create task');
      });
  };

  return (
    <div className="dark max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/tasks')}
          className="mr-4 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Return to Ledger
        </Button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create New Task</h1>
          <p className="text-slate-400 mt-1">Initialize a new operative directive for the swarm.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 bg-slate-900/50 border-slate-800 backdrop-blur-md overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-800/20">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Directives & Intent
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-200 font-semibold tracking-wide">
                Task Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. SIMD-optimize vision broadcast loop"
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:ring-amber-500/20 h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200 font-semibold">
                Description & Technical Rationale
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detail the scope, expected outcome, and any specific constraints..."
                className="bg-slate-950 border-slate-700 min-h-[120px] text-slate-100 placeholder:text-slate-600 focus:ring-amber-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-200 font-semibold">
                  Operating Status
                </Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => handleSelectChange('status')(e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-amber-500/50"
                  required
                >
                  <option value="not_started">Not Started (Submitted)</option>
                  <option value="in_progress">In Progress (Forging)</option>
                  <option value="pending_review">Pending Review (Audit)</option>
                  <option value="completed">Completed (Deployed)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-200 font-semibold">
                  Priority Level
                </Label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={(e) => handleSelectChange('priority')(e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-amber-500/50"
                  required
                >
                  <option value="low">Low (Standard)</option>
                  <option value="medium">Medium (Routine)</option>
                  <option value="high">High (Elevated)</option>
                  <option value="critical">Critical (Prime)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-200 font-semibold">
                  Classification
                </Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => handleSelectChange('category')(e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-amber-500/50"
                  required
                >
                  <option value="development">Development (Code)</option>
                  <option value="design">Design (UI/UX)</option>
                  <option value="documentation">Documentation (Knowledge)</option>
                  <option value="testing">Testing (Validation)</option>
                  <option value="bug_fixing">Bug Fixing (Remediation)</option>
                  <option value="feature">Feature (Synthesis)</option>
                  <option value="maintenance">Maintenance (Optimization)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-slate-200 font-semibold">
                  Agent Designation
                </Label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => handleSelectChange('assignedTo')(e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-amber-500/50"
                  required
                >
                  <option value="">Select an autonomous agent</option>
                  {loading && <option disabled>Loading fleet status...</option>}
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-slate-200 font-semibold flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-sky-400" />
                  Target Deadline
                </Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="bg-slate-950 border-slate-700 text-slate-100 h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="estimatedHours"
                  className="text-slate-200 font-semibold flex items-center"
                >
                  <Clock className="h-4 w-4 mr-2 text-amber-400" />
                  Estimated Complexity (Hours)
                </Label>
                <Input
                  id="estimatedHours"
                  name="estimatedHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={handleInputChange}
                  className="bg-slate-950 border-slate-700 text-slate-100 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newTag" className="text-slate-200 font-semibold flex items-center">
                <Tag className="h-4 w-4 mr-2 text-emerald-400" />
                Contextual Tags
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="newTag"
                  name="newTag"
                  value={formData.newTag}
                  onChange={handleInputChange}
                  onKeyDown={handleTagKeyDown}
                  placeholder="e.g. LLVM, Hot-Swap, Zero-Copy"
                  className="bg-slate-950 border-slate-700 text-slate-100 h-11 focus:ring-emerald-500/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 h-11 px-4"
                  onClick={() => {
                    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
                      setFormData((prev) => ({
                        ...prev,
                        tags: [...prev.tags, prev.newTag.trim()],
                        newTag: '',
                      }));
                    }
                  }}
                  disabled={
                    !formData.newTag.trim() || formData.tags.includes(formData.newTag.trim())
                  }
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        className="text-emerald-500/60 hover:text-emerald-400 transition-colors"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/50">
              <Label className="text-slate-200 font-semibold flex items-center mb-3">
                <Paperclip className="h-4 w-4 mr-2 text-fuchsia-400" />
                Technical Attachments
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-slate-950 border-2 border-dashed border-slate-800 group-hover:border-slate-700 rounded-lg flex items-center justify-center transition-colors pointer-events-none">
                  <div className="text-center">
                    <Paperclip className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Click to upload or drag artifacts here</p>
                  </div>
                </div>
                <Input
                  type="file"
                  multiple
                  className="opacity-0 h-24 w-full cursor-pointer z-10 relative"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider font-bold">
                Max file size: 10MB • Multi-upload enabled
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tasks')}
            className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 h-12 px-6"
          >
            Discard
          </Button>
          <Button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 px-10 shadow-lg shadow-amber-500/10"
          >
            Initialize Objective
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewTask;

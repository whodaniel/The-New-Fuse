// @ts-nocheck
import {
  Badge,
  PremiumButton as Button,
  GlassCard as Card,
  PremiumInput as Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui';
import { getTask, updateTask, type LedgerStatus } from '@/services/unifiedLedgerApi';
import { Calendar, ChevronLeft, Clock, Paperclip, Plus, Save, Tag, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  id: string;
  name: string;
}

/**
 * Edit Task page component
 */
const EditTask: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
    tags: [],
    newTag: '',
  });

  // Load task data
  useEffect(() => {
    if (!id) return;
    getTask(id)
      .then((row) => {
        if (!row) return;
        setFormData({
          title: row.title,
          description: row.description,
          status:
            row.status === 'in_progress'
              ? 'in_progress'
              : row.status === 'completed'
                ? 'completed'
                : row.status === 'under_review'
                  ? 'pending_review'
                  : 'not_started',
          priority:
            row.priority === 'urgent' || row.priority === 'critical' ? 'critical' : row.priority,
          category: String((row.metadata as Record<string, unknown>)?.category || 'development'),
          assignedTo: row.assignee || '',
          dueDate: String((row.metadata as Record<string, unknown>)?.dueDate || row.updatedAt),
          estimatedHours: String((row.metadata as Record<string, unknown>)?.estimatedHours || ''),
          tags: row.tags || [],
          newTag: '',
        });
      })
      .catch((error) => console.error('Failed to load task for edit:', error));
  }, [id]);

  useEffect(() => {
    const loadAgents = async () => {
      setAgentLoadError(null);
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        const mapped = items
          .map((agent: any) => ({ id: String(agent.id), name: String(agent.name || agent.id) }))
          .filter((agent: AgentOption) => agent.id);
        setAgents(mapped);
      } catch (error) {
        console.error('Failed to load agents:', error);
        setAgents([]);
        setAgentLoadError('Live agent directory unavailable');
      }
    };

    loadAgents();
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

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
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
    updateTask(id, {
      title: formData.title,
      description: formData.description,
      status: (statusMap[formData.status] || 'submitted') as LedgerStatus,
      priority: (priorityMap[formData.priority] || 'medium') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical'
        | 'urgent',
      assignee: formData.assignedTo,
      tags: formData.tags,
      metadata: {
        category: formData.category,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours,
      },
    })
      .then(() => navigate(`/tasks/${id}`))
      .catch((error) => console.error('Failed to update task:', error));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${id}`)} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Task</h1>
          <p className="text-muted-foreground">Update task details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Task Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the task in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange('status')}
                    required
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="completed">Completed</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleSelectChange('priority')}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleSelectChange('category')}
                    required
                  >
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="documentation">Documentation</option>
                    <option value="testing">Testing</option>
                    <option value="bug_fixing">Bug Fixing</option>
                    <option value="feature">Feature</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleSelectChange('assignedTo')}
                    required
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </Select>
                  {agentLoadError && (
                    <p className="text-xs text-amber-600 mt-1">{agentLoadError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formatDateForInput(formData.dueDate)}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedHours" className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Estimated Hours
                  </Label>
                  <Input
                    id="estimatedHours"
                    name="estimatedHours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="newTag" className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Tags
                </Label>
                <div className="flex items-center">
                  <Input
                    id="newTag"
                    name="newTag"
                    value={formData.newTag}
                    onChange={handleInputChange}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tags and press Enter"
                    className="mr-2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (
                        formData.newTag.trim() &&
                        !formData.tags.includes(formData.newTag.trim())
                      ) {
                        setFormData((prev: any) => ({
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
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center">
                        {tag}
                        <button
                          type="button"
                          className="ml-1 text-muted-foreground hover:text-foreground"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center">
                  <Paperclip className="h-4 w-4 mr-1" />
                  Attachments
                </Label>
                <div className="mt-2 space-y-2">
                  {([] as Array<{ name: string; size: string }>).map((attachment, index) => (
                    <div key={index} className="flex items-center p-2 border rounded-md">
                      <div className="flex-1">
                        <div className="font-medium">{attachment.name}</div>
                        <div className="text-xs text-muted-foreground">{attachment.size}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Input type="file" multiple className="cursor-pointer" />
                  <p className="text-xs text-muted-foreground">
                    You can upload additional files. Maximum file size: 10MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => navigate(`/tasks/${id}`)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditTask;

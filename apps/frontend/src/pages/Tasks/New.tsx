import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  X,
  ChevronLeft,
  Plus,
  Calendar,
  Clock,
  Tag,
  Paperclip
} from 'lucide-react';

// Mock data for agents
const mockAgents = [
  { id: 1, name: 'CodeAssistant', avatar: 'CA' },
  { id: 2, name: 'DataAnalyzer', avatar: 'DA' },
  { id: 3, name: 'ContentWriter', avatar: 'CW' },
  { id: 4, name: 'BugHunter', avatar: 'BH' },
  { id: 5, name: 'APIIntegrator', avatar: 'AI' }
];

/**
 * New Task page component
 */
const NewTask: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not_started',
    priority: 'medium',
    category: 'development',
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
    tags: [] as string[],
    newTag: ''
  });
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.newTag.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(formData.newTag.trim())) {
        setFormData((prev: any) => ({
          ...prev,
          tags: [...prev.tags, prev.newTag.trim()],
          newTag: ''
        }));
      }
    }
  };
  
  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // In a real app, we would send this data to the server
    // For now, just navigate back to the tasks list
    navigate('/tasks');
  };
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tasks')}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Task</h1>
              <p className="text-muted-foreground">Create a new task for an agent</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <div className="p-6">
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select an agent</option>
                        {mockAgents.map(agent => (
                          <option key={agent.id} value={agent.id.toString()}>
                            {agent.name}
                          </option>
                        ))}
                      </Select>
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
                        value={formData.dueDate}
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
                          if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
                            setFormData((prev: any) => ({
                              ...prev,
                              tags: [...prev.tags, prev.newTag.trim()],
                              newTag: ''
                            }));
                          }
                        }}
                        disabled={!formData.newTag.trim() || formData.tags.includes(formData.newTag.trim())}
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
                              className="ml-1 text-gray-500 hover:text-gray-700"
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
                    <div className="mt-2">
                      <Input
                        type="file"
                        multiple
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You can upload multiple files. Maximum file size: 10MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tasks')}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewTask;

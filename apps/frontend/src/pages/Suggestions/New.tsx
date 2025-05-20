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
  Tag,
  Lightbulb
} from 'lucide-react';

/**
 * New Suggestion page component
 */
const NewSuggestion: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'development',
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
    // For now, just navigate back to the suggestions list
    navigate('/suggestions');
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
              onClick={() => navigate('/suggestions')}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Submit New Suggestion</h1>
              <p className="text-muted-foreground">Share your ideas for new features</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-primary/10 mr-4">
                    <Lightbulb className="h-6 w-6 text-primary"/>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Feature Suggestion</h3>
                    <p className="text-muted-foreground">
                      Your suggestions help us improve the platform. Be as detailed as possible.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Suggestion Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a clear, concise title for your suggestion"
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
                      placeholder="Describe your suggestion in detail. What problem does it solve? How would it work? Who would benefit from it?"
                      rows={8}
                      required
                    />
                  </div>
                  
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
                      <option value="ui">User Interface</option>
                      <option value="ux">User Experience</option>
                      <option value="integration">Integration</option>
                      <option value="analytics">Analytics</option>
                      <option value="collaboration">Collaboration</option>
                      <option value="mobile">Mobile</option>
                      <option value="customization">Customization</option>
                      <option value="other">Other</option>
                    </Select>
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
                </div>
              </div>
            </Card>
            
            <Card className="mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Guidelines for Good Suggestions</h3>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Be specific about the problem your suggestion solves</li>
                  <li>Consider how your suggestion would benefit other users</li>
                  <li>Provide examples of how the feature would work</li>
                  <li>Check if a similar suggestion already exists before submitting</li>
                  <li>Use clear, concise language</li>
                </ul>
              </div>
            </Card>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/suggestions')}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Submit Suggestion
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewSuggestion;

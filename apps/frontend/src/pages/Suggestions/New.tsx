import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createSuggestion } from '@/services/unifiedLedgerApi';
import { ChevronLeft, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const NewSuggestion: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createSuggestion({
        title,
        description,
        owner: 'ui-user',
        tags,
        status: 'submitted',
        priority: 'medium',
      });
      toast.success('Suggestion submitted');
      navigate(`/suggestions/${created.id}`);
    } catch {
      toast.error('Failed to submit suggestion');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/suggestions')} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Submit Suggestion</h1>
          <p className="text-muted-foreground">Feeds the unified task/suggestion ledger</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              required
            />
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex justify-end mt-4 gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/suggestions')}>
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  );
};

export default NewSuggestion;

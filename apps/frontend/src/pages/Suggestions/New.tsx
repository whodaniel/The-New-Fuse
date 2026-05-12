import { Badge, Button, Card, Input, Label, Textarea } from '@/components/ui';
import { createSuggestion } from '@/services/unifiedLedgerApi';
import { ChevronLeft, Lightbulb, Plus, X } from 'lucide-react';
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
    <div className="dark max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/suggestions')}
          className="mr-4 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Feed
        </Button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Submit Suggestion</h1>
          <p className="text-slate-400 mt-1">
            Propose a new capability or architectural enhancement.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <Card className="mb-6 bg-slate-900/50 border-slate-800 backdrop-blur-md overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-800/20">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Provisional Intel
            </h3>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-200 font-semibold tracking-wide">
                Headline
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement zero-copy context chaining"
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:ring-amber-500/20 h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200 font-semibold">
                Value Proposition & Specs
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What problem does this solve and how should it be forged?"
                className="bg-slate-950 border-slate-700 min-h-[150px] text-slate-100 placeholder:text-slate-600 focus:ring-amber-500/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200 font-semibold">Contextual Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add technical tags..."
                  className="bg-slate-950 border-slate-700 text-slate-100 focus:ring-emerald-500/20 h-11"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 h-11 px-4"
                  onClick={addTag}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs font-bold"
                  >
                    {tag}
                    <button
                      type="button"
                      className="text-emerald-500/60 hover:text-emerald-400 transition-colors"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">
                    No tags assigned
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/suggestions')}
            className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 h-12 px-6"
          >
            Discard
          </Button>
          <Button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 px-10 shadow-lg shadow-amber-500/10"
          >
            Broadcast Suggestion
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewSuggestion;

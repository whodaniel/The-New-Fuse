import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LedgerRecord, listSuggestions, voteSuggestion } from '@/services/unifiedLedgerApi';
import { MessageSquare, Plus, Search, ThumbsDown, ThumbsUp } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['All', 'submitted', 'under_review', 'completed', 'rejected'];

const Suggestions: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listSuggestions());
    } catch (error) {
      console.error(error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (status === 'All' ? true : r.status === status))
      .filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.votes.up - a.votes.up);
  }, [rows, searchQuery, status]);

  const onVote = async (id: string, direction: 'up' | 'down') => {
    try {
      await voteSuggestion(id, direction);
      await load();
    } catch {
      toast.error('Vote failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Feature Suggestions</h1>
          <p className="text-muted-foreground">Unified board with voting and tracking</p>
        </div>
        <Button onClick={() => navigate('/suggestions/new')}>
          <Plus className="mr-2 h-4 w-4" /> Submit Suggestion
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search suggestions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p>Loading...</p> : null}

      <div className="space-y-4">
        {filtered.map((s) => (
          <Card key={s.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="text-muted-foreground mt-2">{s.description}</p>
                <div className="flex gap-2 mt-3">
                  <Badge>{s.status}</Badge>
                  <Badge variant="outline">Priority: {s.priority}</Badge>
                </div>
              </div>
              <div className="text-right text-sm">
                <div>Score: {s.votes.up - s.votes.down}</div>
                <div className="text-muted-foreground">
                  Updated {new Date(s.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                className="flex items-center text-green-600"
                onClick={() => onVote(s.id, 'up')}
              >
                <ThumbsUp className="h-4 w-4 mr-1" /> Up ({s.votes.up})
              </button>
              <button
                className="flex items-center text-red-600"
                onClick={() => onVote(s.id, 'down')}
              >
                <ThumbsDown className="h-4 w-4 mr-1" /> Down ({s.votes.down})
              </button>
              <button
                className="flex items-center text-blue-600"
                onClick={() => navigate(`/suggestions/${s.id}`)}
              >
                <MessageSquare className="h-4 w-4 mr-1" /> View
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;

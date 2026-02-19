import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getSuggestion, voteSuggestion, type LedgerRecord } from '@/services/unifiedLedgerApi';
import { ChevronLeft, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const SuggestionDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<LedgerRecord | null>(null);
  const [comment, setComment] = useState('');

  const load = async () => {
    try {
      setRow(await getSuggestion(id));
    } catch {
      toast.error('Failed to load suggestion');
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const onVote = async (direction: 'up' | 'down') => {
    try {
      await voteSuggestion(id, direction);
      await load();
    } catch {
      toast.error('Vote failed');
    }
  };

  if (!row) {
    return <div className="max-w-5xl mx-auto">Loading suggestion...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/suggestions')} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Suggestion Detail</h1>
          <p className="text-muted-foreground">Unified ledger record {row.id}</p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold">{row.title}</h2>
            <p className="mt-2 text-muted-foreground whitespace-pre-line">{row.description}</p>
            <div className="flex gap-2 mt-4">
              <Badge>{row.status}</Badge>
              <Badge variant="outline">Priority: {row.priority}</Badge>
            </div>
          </div>
          <div className="text-sm text-right">
            <div>Up: {row.votes.up}</div>
            <div>Down: {row.votes.down}</div>
            <div>Net: {row.votes.up - row.votes.down}</div>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button className="flex items-center text-green-600" onClick={() => onVote('up')}>
            <ThumbsUp className="h-4 w-4 mr-1" /> Upvote
          </button>
          <button className="flex items-center text-red-600" onClick={() => onVote('down')}>
            <ThumbsDown className="h-4 w-4 mr-1" /> Downvote
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Discussion</h3>
        <p className="text-sm text-muted-foreground mb-3">
          This route is now backed by the unified ledger. Comments can be mapped into iterative
          feedback entries next.
        </p>
        <div className="space-y-3">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Add comment (planned: persist as feedback iteration)..."
          />
          <Button
            onClick={() => {
              setComment('');
              toast.success(
                'Comment captured locally. Next step: persist to feedback iteration API.'
              );
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Add Comment
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SuggestionDetail;

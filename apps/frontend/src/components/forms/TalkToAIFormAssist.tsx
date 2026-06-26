import { PremiumButton } from '@/components/ui';
import AISourceSelector from '@/components/ai/AISourceSelector';
import { aiSourceService } from '@/services/aiSource.service';
import { MessageSquare, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

export type FormFieldSchema = {
  key: string;
  label: string;
  description?: string;
};

type TalkToAIFormAssistProps = {
  formTitle: string;
  fields: FormFieldSchema[];
  onApply: (values: Record<string, string | number>) => void;
  className?: string;
};

function extractJsonObject(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const TalkToAIFormAssist: React.FC<TalkToAIFormAssistProps> = ({
  formTitle,
  fields,
  onApply,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const runExtraction = async () => {
    if (!prompt.trim()) {
      toast.error('Describe what you want to record first.');
      return;
    }

    setLoading(true);
    try {
      const fieldSpec = fields
        .map(
          (field) =>
            `- ${field.key}: ${field.label}${field.description ? ` (${field.description})` : ''}`
        )
        .join('\n');

      const result = await aiSourceService.chat({
        systemPrompt: [
          `You are an entity extraction assistant for the "${formTitle}" form.`,
          'Extract structured values from the user prompt and respond with JSON only.',
          'Allowed keys:',
          fieldSpec,
          'Rules:',
          '- Return a single JSON object.',
          '- Use empty string for unknown text fields.',
          '- Use sensible defaults for dates (ISO 8601) and numbers.',
        ].join('\n'),
        message: prompt.trim(),
        context: { surface: 'talk-to-ai-form', formTitle },
      });

      const parsed = extractJsonObject(result.text);
      if (!parsed) {
        toast.error('AI response did not include parseable form data. Try a more specific prompt.');
        return;
      }

      const normalized: Record<string, string | number> = {};
      for (const field of fields) {
        const raw = parsed[field.key];
        if (typeof raw === 'number') {
          normalized[field.key] = raw;
        } else if (raw != null) {
          normalized[field.key] = String(raw);
        }
      }

      onApply(normalized);
      toast.success('Form fields populated from AI extraction');
      setOpen(false);
      setPrompt('');
    } catch (error: any) {
      toast.error(error?.message || 'AI extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PremiumButton
        type="button"
        size="sm"
        variant="outline"
        className={`border-sky-500/40 text-sky-300 hover:bg-sky-500/10 ${className}`}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Talk to AI
      </PremiumButton>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Talk to AI for ${formTitle}`}
            className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-950 p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-sky-400 font-semibold">
                  Talk to AI
                </p>
                <h3 className="text-lg font-bold text-white mt-1">{formTitle}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Describe the record in natural language. An agent will extract and fill the form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close Talk to AI dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AISourceSelector compact label="AI Source" className="mb-3" />

            <label htmlFor="talk-to-ai-prompt" className="sr-only">
              Natural language prompt
            </label>
            <textarea
              id="talk-to-ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="e.g. Record a milestone: launched the TNF control plane beta on June 22, 2026 in the Career category at 72% timeline position..."
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <PremiumButton type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </PremiumButton>
              <PremiumButton
                type="button"
                variant="gradient"
                disabled={loading}
                onClick={() => void runExtraction()}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {loading ? 'Extracting...' : 'Auto-fill Form'}
              </PremiumButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default TalkToAIFormAssist;

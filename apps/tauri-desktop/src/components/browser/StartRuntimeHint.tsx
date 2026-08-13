import React, { useState } from 'react';
import type { TnfBrowserStartResult } from '../../services/TnfBrowserService';

interface StartRuntimeHintProps {
  starting: boolean;
  result: TnfBrowserStartResult | null;
  onStart: () => void;
}

/**
 * Start CTA for the TNF Browser runtime.
 *
 * The launch can legitimately fail (no bundled CLI, no node on a Finder-launched
 * .app), so the outcome is shown inline with a copyable command rather than only
 * being written to the activity log.
 */
export const StartRuntimeHint: React.FC<StartRuntimeHintProps> = ({
  starting,
  result,
  onStart,
}) => {
  const [copied, setCopied] = useState(false);
  const failed = result != null && !result.ok;

  const copyCommand = async () => {
    if (!result?.command) return;
    try {
      await navigator.clipboard.writeText(result.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the command is still shown as selectable text */
    }
  };

  return (
    <div className="start-runtime-hint">
      <button type="button" onClick={onStart} disabled={starting}>
        {starting ? 'Starting…' : 'Start TNF Browser runtime'}
      </button>

      {result && (
        <p className={failed ? 'start-msg error' : 'start-msg'} role="status">
          {result.message}
        </p>
      )}

      {failed && result.command && (
        <div className="start-command">
          <code>{result.command}</code>
          <button type="button" className="copy-btn" onClick={() => void copyCommand()}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      <style>{`
        .start-runtime-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .start-msg {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--tnf-text-muted, #94a3b8);
          max-width: 34rem;
        }
        .start-msg.error {
          color: #fca5a5;
        }
        .start-command {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--tnf-border, rgba(255,255,255,0.08));
          border-radius: 8px;
          padding: 8px 10px;
        }
        .start-command code {
          font-family: var(--tnf-font-mono, ui-monospace, monospace);
          font-size: 11px;
          color: var(--tnf-accent, #67e8f9);
          user-select: all;
          word-break: break-all;
          text-align: left;
        }
        .start-command .copy-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--tnf-border, rgba(255,255,255,0.08));
          color: white;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11px;
          cursor: pointer;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default StartRuntimeHint;

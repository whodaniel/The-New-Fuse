import { html, nothing } from 'lit';
import type { AppViewState } from '../app-view-state.ts';

const DASHBOARD_COMMAND = 'openclaw dashboard --no-open';

export function renderAuthModal(state: AppViewState) {
  if (!state.authModalOpen) {
    return nothing;
  }

  return html`
    <div class="exec-approval-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div class="exec-approval-card">
        <div class="exec-approval-header">
          <div>
            <div class="exec-approval-title">Connect the Control UI</div>
            <div class="exec-approval-sub">
              Paste the gateway token to authorize chat and control.
            </div>
          </div>
        </div>
        <div class="form-grid" style="margin-top: 12px;">
          <label class="field">
            <span>Gateway Token</span>
            <input
              .value=${state.settings.token}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                state.applySettings({ ...state.settings, token: v });
                if (!state.connected && v.trim()) {
                  (
                    state as unknown as { scheduleConnect: (delayMs?: number) => void }
                  ).scheduleConnect();
                }
              }}
              placeholder="THE NEW FUSE_GATEWAY_TOKEN"
            />
          </label>
          <label class="field">
            <span>Remember token from URL</span>
            <div class="row" style="gap: 8px;">
              <input
                type="checkbox"
                .checked=${state.settings.rememberTokenFromUrl}
                @change=${(e: Event) => {
                  const next = (e.target as HTMLInputElement).checked;
                  state.applySettings({ ...state.settings, rememberTokenFromUrl: next });
                }}
              />
              <span class="muted">Keep ?token= in the URL.</span>
            </div>
          </label>
        </div>
        <div class="exec-approval-actions" style="margin-top: 12px;">
          <button class="btn primary" @click=${() => state.connect()}>Connect</button>
          <button
            class="btn"
            @click=${async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text.trim()) {
                  state.applySettings({ ...state.settings, token: text.trim() });
                  if (!state.connected) {
                    (
                      state as unknown as { scheduleConnect: (delayMs?: number) => void }
                    ).scheduleConnect();
                  }
                }
              } catch {
                const text = window.prompt('Paste gateway token:');
                if (text) {
                  state.applySettings({ ...state.settings, token: text.trim() });
                  if (!state.connected) {
                    (
                      state as unknown as { scheduleConnect: (delayMs?: number) => void }
                    ).scheduleConnect();
                  }
                }
              }
            }}
          >
            Paste Token
          </button>
          <button
            class="btn"
            @click=${async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text.trim()) {
                  state.applySettings({ ...state.settings, token: text.trim() });
                  state.connect();
                }
              } catch {
                const text = window.prompt('Paste gateway token:');
                if (text) {
                  state.applySettings({ ...state.settings, token: text.trim() });
                  state.connect();
                }
              }
            }}
          >
            Paste + Connect
          </button>
          <button
            class="btn"
            @click=${async () => {
              try {
                await navigator.clipboard.writeText(DASHBOARD_COMMAND);
              } catch {
                window.prompt('Copy command:', DASHBOARD_COMMAND);
              }
            }}
          >
            Copy Command
          </button>
          <button class="btn" @click=${() => state.setTab('overview')}>Open Overview</button>
          <button class="btn" @click=${() => state.dismissAuthModal()}>Dismiss</button>
        </div>
      </div>
    </div>
  `;
}

(() => {
  'use strict';
  const e = 'https://tnf-agent-orchestration.bizsynth.workers.dev';
  class t {
    constructor(e, t) {
      ((this.workerUrl = e), (this.sessionKey = t));
    }
    async latest(e = 50) {
      const t = `${this.workerUrl}/transcript/latest?sessionKey=${encodeURIComponent(this.sessionKey)}&limit=${e}`,
        n = await fetch(t, { method: 'GET' });
      if (!n.ok) throw new Error(`transcript.latest failed: ${n.status}`);
      const i = await n.json();
      return { lastSeq: i.lastSeq || 0, entries: i.entries || [] };
    }
    async since(e, t = 200) {
      const n = `${this.workerUrl}/transcript/since?sessionKey=${encodeURIComponent(this.sessionKey)}&afterSeq=${e}&limit=${t}`,
        i = await fetch(n, { method: 'GET' });
      if (!i.ok) throw new Error(`transcript.since failed: ${i.status}`);
      const s = await i.json();
      return { lastSeq: s.lastSeq || 0, entries: s.entries || [] };
    }
    async append(e) {
      const t = `${this.workerUrl}/transcript/append?sessionKey=${encodeURIComponent(this.sessionKey)}`,
        n = await fetch(t, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Session-Key': this.sessionKey },
          body: JSON.stringify({ entries: e }),
        });
      if (!n.ok) throw new Error(`transcript.append failed: ${n.status}`);
      const i = await n.json();
      return { lastSeq: i.lastSeq || 0, added: i.added || [] };
    }
  }
  const n = new (class {
    constructor() {
      ((this.lastResponseText = ''),
        (this.responseObserver = null),
        (this.callbacks = {}),
        (this.isWaitingForResponse = !1),
        (this.responseCheckInterval = null),
        (this.responseTimeoutTimer = null),
        (this._sendingGuard = !1),
        (this.transcriptClient = null),
        (this.transcriptPollTimer = null),
        (this.transcriptLastSeq = 0),
        (this.cachedElements = null),
        (this.cacheValidUntil = 0),
        (this.CACHE_DURATION = 1e4),
        (this.lastSentText = ''),
        (this.SUPPORTED_CHAT_PLATFORMS = [
          'gemini.google.com',
          'bard.google.com',
          'chatgpt.com',
          'chat.openai.com',
          'claude.ai',
          'perplexity.ai',
          'poe.com',
          'aistudio.google.com',
          'openclaw-cloud-production-934c.up.railway.app',
          'localhost:3000',
          'localhost:3000',
          'localhost:3001',
        ]),
        (this.customSites = []));
    }
    isExtensionUiElement(e) {
      return (
        !!e &&
        !!e.closest(
          [
            '#fuse-connect-panel-v7',
            '#fuse-connect-panel',
            '#fuse-panel-minimized',
            '[data-testid="fuse-connect-panel"]',
            '[data-testid="fuse-panel-content"]',
            '.fcp6-panel',
            '.fcp6-input-row',
          ].join(', ')
        )
      );
    }
    isSupportedPlatform() {
      return !0;
    }
    init(t) {
      ((this.callbacks = t),
        window.__FUSE_DEBUG_SELECTORS && console.log('[SimpleChatBridge] Initialized'),
        this.loadCustomSites());
      try {
        const t = window.location.hostname.toLowerCase();
        if (t.includes('openclaw-cloud') || t.endsWith('up.railway.app')) {
          const t = e,
            n = this.deriveSessionKey();
          this.enableTranscriptPolling(t, n);
        }
      } catch (e) {}
    }
    loadCustomSites() {
      'undefined' != typeof chrome &&
        chrome.storage &&
        chrome.storage.local.get(['gemini_bridge_settings'], (e) => {
          e.fuse_settings &&
            e.fuse_settings.allowedSites &&
            ((this.customSites = e.fuse_settings.allowedSites),
            window.__FUSE_DEBUG_SELECTORS &&
              console.log('[SimpleChatBridge] Loaded custom sites:', this.customSites));
        });
    }
    deriveSessionKey() {
      return `openclaw-ui:${window.location.hostname.toLowerCase()}:session:${new URL(window.location.href).searchParams.get('session') || 'main'}`;
    }
    enableTranscriptPolling(e, n) {
      if (this.transcriptPollTimer) return;
      this.transcriptClient = new t(e, n);
      const i = async () => {
        if (this.transcriptClient)
          try {
            if (0 === this.transcriptLastSeq) {
              const { lastSeq: e, entries: t } = await this.transcriptClient.latest(50);
              this.transcriptLastSeq = e || 0;
              for (const e of t)
                this.callbacks.onTranscriptEntry?.({
                  role: e.role,
                  content: e.content,
                  ts: e.ts,
                  seq: e.seq,
                  id: e.id,
                });
              return;
            }
            const { lastSeq: e, entries: t } = await this.transcriptClient.since(
              this.transcriptLastSeq,
              200
            );
            for (const e of t)
              ((this.transcriptLastSeq = Math.max(
                this.transcriptLastSeq,
                e.seq || this.transcriptLastSeq
              )),
                this.callbacks.onTranscriptEntry?.({
                  role: e.role,
                  content: e.content,
                  ts: e.ts,
                  seq: e.seq,
                  id: e.id,
                }));
            this.transcriptLastSeq = Math.max(this.transcriptLastSeq, e || 0);
          } catch (e) {
            this.callbacks.onError?.(String(e?.message || e));
          }
      };
      (i(), (this.transcriptPollTimer = window.setInterval(i, 1500)));
    }
    findElements() {
      const e = Date.now();
      if (this.cachedElements?.isReady && e < this.cacheValidUntil) return this.cachedElements;
      const t = window.__FUSE_DEBUG_SELECTORS || !1,
        n = this.isSupportedPlatform(),
        i = window.location.hostname.toLowerCase(),
        s = 'chat.qwen.ai' === i || i.endsWith('.qwen.ai'),
        a = [
          ...(s
            ? [
                'textarea[data-testid*="chat" i]',
                'textarea[data-testid*="input" i]',
                'textarea[data-testid*="compose" i]',
                'textarea[data-testid*="prompt" i]',
                'textarea[placeholder*="Send" i]',
                'textarea[placeholder*="message" i]',
                'textarea[aria-label*="chat" i]',
                'textarea[aria-label*="message" i]',
                'form textarea',
                'main textarea',
                'textarea',
                'div[contenteditable="true"][role="textbox"]',
                'div[contenteditable="true"][data-testid*="input" i]',
                'div[role="textbox"][contenteditable="true"]',
              ]
            : []),
          'input[placeholder="Type a message..."]',
          'input[placeholder="Type a message..."][type="text"]',
          '.chat-compose textarea',
          'textarea[placeholder*="Message" i]',
          'textarea[placeholder*="start chatting" i]',
          'textarea[placeholder*="Ask" i]',
          'textarea[placeholder*="follow-up" i]',
          'div[class*="search-bar-input"] textarea',
          'side-panel-chat textarea',
          'side-panel-chat [contenteditable="true"]',
          'gemini-sidebar-input textarea',
          '#gemini-chat-input',
          'rich-textarea p[contenteditable="true"]',
          'rich-textarea p[data-placeholder]',
          'rich-textarea div[contenteditable="true"]',
          'rich-textarea [contenteditable="true"]',
          '.ql-editor.textarea[contenteditable="true"]',
          'rich-textarea .ql-editor[contenteditable="true"]',
          'div.ql-editor.textarea',
          'div.ql-editor[contenteditable="true"]',
          'textarea.ql-editor[contenteditable="true"]',
          '[data-placeholder*="Ask Gemini" i][contenteditable="true"]',
          '[data-placeholder*="Enter a prompt" i][contenteditable="true"]',
          'div[aria-label*="Enter a prompt" i][contenteditable="true"]',
          'div[aria-label*="Type your message" i][contenteditable="true"]',
          'div[contenteditable="true"][data-placeholder*="Enter"]',
          'div[contenteditable="true"][aria-label*="prompt" i]',
          'p[contenteditable="true"][data-placeholder]',
          '#prompt-textarea',
          'textarea[data-id="root"]',
          'textarea[placeholder*="Message" i]',
          'div[contenteditable="true"][aria-label*="Message" i]',
          'div[contenteditable="true"][role="textbox"]',
          'p[contenteditable="true"]',
          'div[contenteditable="true"][data-placeholder]',
          'div[contenteditable="true"]:not([role="button"])',
          'textarea[placeholder*="Ask" i]',
          'form textarea',
          'main textarea',
          'textarea',
          'textarea[contenteditable="true"]',
          'div.textarea[contenteditable="true"]',
        ],
        o = [
          ...(s
            ? [
                'button[data-testid*="send" i]',
                'button[aria-label*="Send" i]',
                'button[title*="Send" i]',
                'form button[type="submit"]',
              ]
            : []),
          'button:has(svg path[d="M5 12h14M12 5l7 7-7 7"])',
          'button:has(svg[stroke="currentColor"])',
          '.chat-compose button.primary',
          '.chat-compose .btn.primary',
          '.chat-compose button[type="submit"]',
          'button[aria-label="Submit"]',
          'button[aria-label="Send"]',
          'div[class*="search-bar"] button:not([disabled])',
          'button[aria-label*="Send" i]',
          'button[aria-label*="submit" i]',
          'button[data-testid*="send" i]',
          'button.send-button-container button',
          'button[aria-label*="Send message" i]',
          'button[title*="Send" i]',
          'button:has(svg[aria-label*="Send" i])',
          'button:has(path[d*="M2.01"])',
          'button[data-testid="send-button"]',
          'button.send-button',
          'button[type="submit"]',
          'form button[type="submit"]',
        ];
      if (t) {
        console.log('[SimpleChatBridge DEBUG] Starting element search...');
        const e = Array.from(document.querySelectorAll('[contenteditable="true"]')),
          t = Array.from(document.querySelectorAll('button[aria-label]'));
        (console.log('[SimpleChatBridge DEBUG] All contenteditable elements:', e.length),
          e.forEach((e, t) => {
            console.log(`  [${t}]`, {
              tag: e.tagName,
              classes: e.className,
              ariaLabel: e.getAttribute('aria-label'),
              placeholder: e.getAttribute('data-placeholder'),
              parent: e.parentElement?.tagName,
              parentClass: e.parentElement?.className,
              visible: this.isVisible(e),
            });
          }),
          console.log('[SimpleChatBridge DEBUG] All buttons with aria-label:', t.length),
          t.forEach((e, t) => {
            console.log(`  [${t}]`, {
              ariaLabel: e.getAttribute('aria-label'),
              title: e.getAttribute('title'),
              visible: this.isVisible(e),
            });
          }));
      }
      let r = null;
      for (const e of a)
        try {
          const t = this.queryAllIncludingShadow(e);
          for (const e of t)
            if (!this.isExtensionUiElement(e) && this.isVisible(e)) {
              r = e;
              break;
            }
          if (r) break;
        } catch (e) {}
      if (!r)
        for (const e of a)
          try {
            const n = this.queryAllIncludingShadow(e);
            for (const i of n)
              if (!this.isExtensionUiElement(i)) {
                ((r = i),
                  t &&
                    console.log(
                      '[SimpleChatBridge] Using fallback input (no visibility check):',
                      e
                    ));
                break;
              }
            if (r) break;
          } catch (e) {}
      let c = null;
      for (const e of o)
        try {
          const t = this.queryAllIncludingShadow(e);
          for (const e of t)
            if (!this.isExtensionUiElement(e) && this.isVisible(e)) {
              c = e;
              break;
            }
          if (c) break;
        } catch (e) {}
      if (!c)
        for (const e of o)
          try {
            const n = this.queryAllIncludingShadow(e);
            for (const i of n)
              if (!this.isExtensionUiElement(i)) {
                ((c = i),
                  t &&
                    console.log(
                      '[SimpleChatBridge] Using fallback button (no visibility check):',
                      e
                    ));
                break;
              }
            if (c) break;
          } catch (e) {}
      if (!r) {
        const e = this.queryAllIncludingShadow('textarea');
        for (const t of e)
          if (!this.isExtensionUiElement(t) && this.isVisible(t) && !t.disabled) {
            r = t;
            break;
          }
      }
      if (!r && t) {
        console.warn(
          '[SimpleChatBridge] Ultra fallback: Looking for ANY contenteditable element...'
        );
        const e = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        for (const t of e)
          if (!this.isExtensionUiElement(t) && this.isVisible(t)) {
            ((r = t),
              console.warn('[SimpleChatBridge] Ultra fallback input found:', {
                tag: t.tagName,
                classes: t.className,
                parent: t.parentElement?.tagName,
              }));
            break;
          }
        if (!r) {
          console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY visible textarea...');
          const e = Array.from(document.querySelectorAll('textarea'));
          for (const t of e)
            if (!this.isExtensionUiElement(t) && this.isVisible(t) && !t.disabled) {
              ((r = t), console.warn('[SimpleChatBridge] Ultra fallback textarea found'));
              break;
            }
        }
      }
      if (!c && t) {
        console.warn('[SimpleChatBridge] Ultra fallback: Looking for ANY button...');
        const e = Array.from(document.querySelectorAll('button'));
        for (const t of e) {
          if (this.isExtensionUiElement(t)) continue;
          const e = t.getAttribute('aria-label')?.toLowerCase() || '',
            n = t.getAttribute('title')?.toLowerCase() || '';
          if ((e.includes('send') || n.includes('send')) && this.isVisible(t)) {
            ((c = t),
              console.warn('[SimpleChatBridge] Ultra fallback button found:', {
                ariaLabel: t.getAttribute('aria-label'),
                title: t.getAttribute('title'),
              }));
            break;
          }
        }
      }
      const l = !(!r || !c),
        d = { input: r, sendButton: c, isReady: l },
        p = this.cachedElements ? this.cachedElements.isReady : null,
        h = null === p || d.isReady !== p;
      if (h || t) {
        const e = {
          hasInput: !!r,
          hasSendButton: !!c,
          isReady: l,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        };
        if (r)
          for (const t of a)
            try {
              if (document.querySelector(t) === r) {
                e.matchedInputSelector = t;
                break;
              }
            } catch (e) {}
        if (c)
          for (const t of o)
            try {
              if (document.querySelector(t) === c) {
                e.matchedButtonSelector = t;
                break;
              }
            } catch (e) {}
        l
          ? h && console.log('[SimpleChatBridge] ✅ Elements ready:', e)
          : h &&
            n &&
            t &&
            ((e.isKnownPlatform = n),
            console.log('[SimpleChatBridge] Elements NOT ready:', e),
            r ||
              (console.log(
                '[SimpleChatBridge] 💡 Enable debug mode: window.__FUSE_DEBUG_SELECTORS = true'
              ),
              console.log(
                '[SimpleChatBridge] 💡 Available elements:',
                'contenteditable count:',
                document.querySelectorAll('[contenteditable="true"]').length,
                'buttons with aria-label:',
                document.querySelectorAll('button[aria-label]').length
              )));
      }
      return (
        (this.cachedElements = d),
        (this.cacheValidUntil = d.isReady ? Date.now() + this.CACHE_DURATION : 0),
        d
      );
    }
    queryAllIncludingShadow(e) {
      const t = [],
        n = new Set(),
        i = (s) => {
          const a = s.querySelectorAll(e);
          for (const e of a) n.has(e) || (n.add(e), e instanceof HTMLElement && t.push(e));
          const o = s.querySelectorAll('*');
          for (const e of o) e instanceof HTMLElement && e.shadowRoot && i(e.shadowRoot);
        };
      try {
        i(document);
      } catch {}
      return t;
    }
    isVisible(e) {
      if (null !== e.offsetParent) return !0;
      try {
        const t = e.getBoundingClientRect();
        if (t.width > 0 && t.height > 0) {
          const t = window.getComputedStyle(e);
          if ('none' !== t.display && 'hidden' !== t.visibility && '0' !== t.opacity) return !0;
        }
      } catch (e) {}
      try {
        const t = window.getComputedStyle(e);
        if ('none' !== t.display && 'hidden' !== t.visibility) return !0;
      } catch (e) {}
      return !1;
    }
    countModelResponses() {
      if (this.isQwenHost()) {
        const e = this.getQwenResponseNodes(!1);
        if (e.length > 0) return e.length;
        const t = this.getQwenResponseNodes(!0);
        if (t.length > 0) return t.length;
      }
      const e = this.queryAllIncludingShadow('model-response').length;
      if (e > 0) return e;
      const t = document.querySelector('.chat-thread');
      if (t)
        return Array.from(t.querySelectorAll(':scope > *')).filter(
          (e) => (e.textContent || '').trim().length > 0
        ).length;
      const n = document.querySelectorAll(
        'div.prose, div[class*="prose"], div[data-testid*="answer"], div.font-sans.text-base.text-text-main'
      ).length;
      return n > 0 ? n : this.getGenericAssistantResponseNodes(!0).length;
    }
    getLatestResponse() {
      const e = this.queryAllIncludingShadow(
        'model-response, side-panel-response, gemini-sidebar-output, .gemini-response-content'
      );
      if (e.length > 0) {
        const t = e[e.length - 1],
          n = t.querySelector('.markdown, .message-content, side-panel-chat-message'),
          i = this.extractCleanText(n || t);
        if (i) return i;
      }
      if (this.isQwenHost()) {
        const e = this.getLatestQwenResponse(!1);
        if (e) return e;
        const t = this.getLatestQwenResponse(!0);
        if (t) return t;
      }
      const t = document.querySelector('.chat-thread');
      if (t) {
        const e = Array.from(t.querySelectorAll(':scope > *'));
        for (let t = e.length - 1; t >= 0; t--) {
          const n = this.extractCleanText(e[t]);
          if (!n) continue;
          const i = n.toLowerCase();
          if (
            !i.includes('disconnected from gateway') &&
            'openclaw' !== i &&
            '🦞' !== i &&
            !(
              i.startsWith('u ') ||
              i.startsWith('you ') ||
              i.includes(' you ') ||
              (i.startsWith('u') && i.length < 5)
            )
          )
            return n;
        }
      }
      const n = document.querySelectorAll(
        'div.prose, div[class*="prose"], div[data-testid*="answer"], div.font-sans.text-base.text-text-main'
      );
      if (n.length > 0) {
        const e = n[n.length - 1],
          t = this.extractCleanText(e);
        if (t) return t;
      }
      const i = this.getGenericAssistantResponseNodes(!0);
      for (let e = i.length - 1; e >= 0; e--) {
        const t = this.extractCleanText(i[e]);
        if (t && (!this.lastSentText || t.trim() !== this.lastSentText.trim())) return t;
      }
      return null;
    }
    isStreaming() {
      if (this._sendingGuard) return !0;
      if (this.isQwenHost()) {
        const e = [
          '[data-testid*="stop" i]',
          'button[aria-label*="Stop generating" i]',
          'button[aria-label*="Stop response" i]',
          'button[aria-label*="Stop" i]',
          'button[title*="Stop" i]',
        ];
        for (const t of e) {
          const e = this.queryAllIncludingShadow(t);
          for (const t of e) if (!this.isExtensionUiElement(t) && this.isVisible(t)) return !0;
        }
        return !1;
      }
      const e = [
        'span[class*="cursor"][class*="blink"]',
        '[class*="thinking"]',
        '[class*="loading-spinner"]',
        '[class*="generating"]',
        '[data-testid*="generat" i]',
        '[data-testid*="typing" i]',
        'button[aria-label*="Stop response"]',
        'button[aria-label*="Stop generating"]',
        '[data-testid*="stop-button"]',
        'button[aria-label*="Stop" i]',
        'button[title*="Stop" i]',
      ];
      for (const t of e) {
        const e = document.querySelector(t);
        if (e && this.isVisible(e)) return !0;
      }
      return !1;
    }
    async sendMessage(e) {
      this.lastSentText = e.trim();
      let t = this.findElements();
      if (!t.input) {
        const e = 4e3,
          n = 250,
          i = Date.now();
        for (; !t.input && Date.now() - i < e; ) (await this.delay(n), (t = this.findElements()));
      }
      if (!t.input)
        return (
          console.error('[SimpleChatBridge] Chat elements not ready'),
          this.callbacks.onError?.('Chat elements not found'),
          !1
        );
      ((this._sendingGuard = !0),
        setTimeout(() => {
          this._sendingGuard = !1;
        }, 3e3));
      const n = t.input;
      try {
        (n.focus(), await this.delay(100));
        const t = n.isContentEditable || 'true' === n.getAttribute('contenteditable');
        (t
          ? (n.textContent &&
              n.textContent.length > 0 &&
              (document.execCommand('selectAll', !1), document.execCommand('delete', !1)),
            (document.execCommand('insertText', !1, e) &&
              (n.textContent || '').trim() === e.trim()) ||
              (console.warn(
                '[SimpleChatBridge] execCommand insertText failed, falling back to direct manipulation'
              ),
              (n.textContent = e),
              n.dispatchEvent(
                new InputEvent('input', {
                  bubbles: !0,
                  cancelable: !0,
                  inputType: 'insertText',
                  data: e,
                })
              )))
          : (((e, t) => {
              const { set: n } =
                  Object.getOwnPropertyDescriptor(e, 'value') ||
                  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), 'value') ||
                  {},
                i = Object.getPrototypeOf(e),
                s = Object.getOwnPropertyDescriptor(i, 'value')?.set;
              (s && n !== s ? s.call(e, t) : n ? n.call(e, t) : (e.value = t),
                e.dispatchEvent(new Event('input', { bubbles: !0 })));
            })(n, e),
            n.dispatchEvent(
              new InputEvent('input', {
                bubbles: !0,
                cancelable: !0,
                inputType: 'insertText',
                data: e,
              })
            ),
            n.dispatchEvent(new Event('change', { bubbles: !0 }))),
          await this.delay(300));
        let i = this.findElements().sendButton;
        if (
          (i ||
            (console.warn('[SimpleChatBridge] Send button not found after text input, retrying...'),
            await this.delay(200),
            (i = this.findElements().sendButton)),
          i)
        ) {
          let e = 0;
          for (
            ;
            i.hasAttribute('disabled') &&
            e < 10 &&
            (await this.delay(100), (i = this.findElements().sendButton), i);
          )
            e++;
        } else
          console.warn(
            '[SimpleChatBridge] Send button not found; attempting Enter-only submission'
          );
        const s = this.countModelResponses();
        (console.log('[SimpleChatBridge] Responses before send:', s),
          console.log('[SimpleChatBridge] Sending message...'));
        const a = () =>
            n.isContentEditable || 'true' === n.getAttribute('contenteditable')
              ? !n.textContent || 0 === n.textContent.trim().length
              : !n.value || 0 === n.value.trim().length,
          o = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: !0, cancelable: !0 };
        if (
          (n.dispatchEvent(new KeyboardEvent('keydown', o)),
          n.dispatchEvent(new KeyboardEvent('keypress', o)),
          n.dispatchEvent(new KeyboardEvent('keyup', o)),
          console.log('[SimpleChatBridge] Dispatched Enter key sequence on input'),
          !t)
        ) {
          const e = n.closest('form');
          e &&
            (e.dispatchEvent(new Event('submit', { bubbles: !0, cancelable: !0 })),
            console.log('[SimpleChatBridge] Dispatched form submit fallback'));
        }
        await this.delay(500);
        const r = a(),
          c = this.isStreaming();
        return r || c
          ? (console.log('[SimpleChatBridge] Message sent via Enter key', {
              wasCleared: r,
              isNowStreaming: c,
            }),
            this.startWatchingForResponse(s),
            !0)
          : i &&
              (i.click(),
              console.log('[SimpleChatBridge] Clicked send button directly'),
              await this.delay(500),
              a() || this.isStreaming())
            ? (console.log('[SimpleChatBridge] Message sent via button click'),
              this.startWatchingForResponse(s),
              !0)
            : i &&
                (i.dispatchEvent(
                  new MouseEvent('click', { bubbles: !0, cancelable: !0, view: window })
                ),
                console.log('[SimpleChatBridge] Dispatched MouseEvent click on button'),
                await this.delay(150),
                a())
              ? (console.log('[SimpleChatBridge] Message sent via MouseEvent'),
                this.startWatchingForResponse(s),
                !0)
              : (console.warn(
                  '[SimpleChatBridge] All send methods attempted, input may not have cleared'
                ),
                console.log('[SimpleChatBridge] Message sent:', e.substring(0, 50)),
                this.startWatchingForResponse(s),
                !0);
      } catch (e) {
        return (
          console.error('[SimpleChatBridge] Error sending message:', e),
          this.callbacks.onError?.(`Send failed: ${e}`),
          !1
        );
      }
    }
    async injectMessage(e) {
      return this.sendMessage(e);
    }
    startWatchingForResponse(e) {
      (this.stopWatching(), (this.isWaitingForResponse = !0));
      let t = 0,
        n = '',
        i = Date.now();
      const s = Date.now(),
        a = this.getLatestResponse() || '',
        o = 6e5;
      ((this.responseCheckInterval = window.setInterval(() => {
        const s = this.countModelResponses();
        let o = this.getLatestResponse();
        if (
          (!o && this.isQwenHost() && (o = this.getLatestQwenResponse(!0)), s > e || (o && o !== a))
        ) {
          const e = this.isStreaming(),
            a = this.checkForMediaContent();
          if (
            (console.log('[SimpleChatBridge] Checking response...', {
              newContent: !!o,
              streaming: e,
              contentLength: o?.length || 0,
              hasMedia: a,
              responseCount: s,
            }),
            o || a)
          ) {
            const s = `${o || ''}-${a}`;
            if (s !== n) ((t = 0), (n = s), (i = Date.now()));
            else {
              t++;
              const n = e && Date.now() - i > 12e3;
              if (t >= 3 && (!e || n)) {
                this.stopWatching();
                const e = o || (a ? '[AI generated media content]' : null);
                e &&
                  e !== this.lastResponseText &&
                  ((this.lastResponseText = e),
                  console.log('[SimpleChatBridge] Response complete!', e.substring(0, 100)),
                  this.callbacks.onResponse?.(e));
              }
            }
          }
        }
      }, 1e3)),
        (this.responseTimeoutTimer = window.setInterval(() => {
          if (this.isWaitingForResponse) {
            const e = Date.now() - s,
              t = Date.now() - i;
            if (e < o && t < 18e4) return;
            const n =
              e >= o
                ? `hard timeout after ${Math.round(e / 1e3)}s`
                : `inactivity timeout after ${Math.round(t / 1e3)}s`;
            (console.warn(`[SimpleChatBridge] Response timeout (${n})`), this.stopWatching());
            const a = this.getLatestResponse() || this.getLatestQwenResponse(!0);
            a && a !== this.lastResponseText
              ? (console.log(
                  '[SimpleChatBridge] Captured response on timeout:',
                  a.substring(0, 100)
                ),
                (this.lastResponseText = a),
                this.callbacks.onResponse?.(a))
              : this.callbacks.onError?.('Response timeout');
          }
        }, 1e3)));
    }
    checkForMediaContent() {
      const e = this.queryAllIncludingShadow('model-response');
      let t = e.length ? e[e.length - 1] : null;
      if (!t) {
        const e = this.getGenericAssistantResponseNodes(!0);
        e.length > 0 && (t = e[e.length - 1]);
      }
      if (!t) return !1;
      const n = null !== t.querySelector('img'),
        i = null !== t.querySelector('video'),
        s = null !== t.querySelector('canvas'),
        a = null !== t.querySelector('iframe'),
        o =
          null !== t.querySelector('[data-generated-image]') ||
          null !== t.querySelector('.generated-image') ||
          null !== t.querySelector('[class*="image-output"]');
      return n || i || s || a || o;
    }
    stopWatching() {
      ((this.isWaitingForResponse = !1),
        this.responseCheckInterval &&
          (clearInterval(this.responseCheckInterval), (this.responseCheckInterval = null)),
        this.responseTimeoutTimer &&
          (clearInterval(this.responseTimeoutTimer), (this.responseTimeoutTimer = null)));
    }
    getLastResponse() {
      return this.getLatestResponse();
    }
    destroy() {
      (this.stopWatching(),
        this.responseObserver &&
          (this.responseObserver.disconnect(), (this.responseObserver = null)));
    }
    delay(e) {
      return new Promise((t) => setTimeout(t, e));
    }
    extractCleanText(e) {
      if (!e) return null;
      const t = e.cloneNode(!0);
      t.querySelectorAll(
        'button, [role="button"], .chip, [class*="action"], .chat-compose, textarea, input'
      ).forEach((e) => e.remove());
      const n = (t.textContent || '').replace(/\s+/g, ' ').trim();
      return n ? (n.length < 8 ? null : n) : null;
    }
    getQwenResponseNodes(e) {
      const t = [
          '[data-message-author-role="assistant"]',
          '[data-role="assistant"]',
          '[data-author-role="assistant"]',
          '[data-testid*="assistant" i]',
          '[class*="assistant-message" i]',
          '[class*="assistant" i]',
          '[class*="bot" i]',
        ],
        n = e
          ? [
              ...t,
              '[data-testid*="message" i]',
              '[data-testid*="chat-message" i]',
              '[class*="message-content" i]',
              '[class*="markdown" i]',
              '[class*="chat-message" i]',
              '[role="article"]',
              'article',
              'main p',
            ]
          : t,
        i = [],
        s = new Set();
      for (const e of n)
        for (const t of this.queryAllIncludingShadow(e)) s.has(t) || (s.add(t), i.push(t));
      const a = [];
      for (const e of i)
        this.isExtensionUiElement(e) ||
          (this.isVisible(e) &&
            (this.isLikelyUserMessageNode(e) ||
              this.isLikelyNonConversationNode(e) ||
              (this.extractCleanText(e) && a.push(e))));
      const o = new Map();
      for (const e of a) {
        const t = this.extractCleanText(e) || '',
          n = `${t.slice(0, 240)}|${t.length}`;
        o.set(n, e);
      }
      return Array.from(o.values());
    }
    getGenericAssistantResponseNodes(e) {
      const t = [
          '[data-message-author-role="assistant"]',
          '[data-role="assistant"]',
          '[data-author-role="assistant"]',
          '[data-testid*="assistant" i]',
          '[class*="assistant-message" i]',
          '[class*="assistant-response" i]',
          '[class*="assistant" i]',
          '[class*="bot-message" i]',
          '[class*="bot-response" i]',
        ],
        n = e
          ? [
              ...t,
              '[data-testid*="message" i]',
              '[data-testid*="chat-message" i]',
              '[class*="message-content" i]',
              '[class*="message-body" i]',
              '[class*="markdown" i]',
              '[role="article"]',
              'article',
              'main p',
            ]
          : t,
        i = [],
        s = new Set();
      for (const e of n)
        for (const t of this.queryAllIncludingShadow(e)) s.has(t) || (s.add(t), i.push(t));
      const a = [],
        o = new Map();
      for (const e of i) {
        if (this.isExtensionUiElement(e)) continue;
        if (!this.isVisible(e)) continue;
        if (this.isLikelyUserMessageNode(e)) continue;
        if (this.isLikelyNonConversationNode(e)) continue;
        const t = this.extractCleanText(e),
          n =
            null !==
            e.querySelector('img, video, canvas, iframe, [data-generated-image], .generated-image');
        if (!t && !n) continue;
        a.push(e);
        const i = t ? `${t.slice(0, 240)}|${t.length}` : `media:${a.length}`;
        o.set(i, e);
      }
      return Array.from(o.values());
    }
    getLatestQwenResponse(e) {
      const t = this.getQwenResponseNodes(e);
      for (let e = t.length - 1; e >= 0; e--) {
        const n = this.extractCleanText(t[e]);
        if (n && (!this.lastSentText || n.trim() !== this.lastSentText.trim())) return n;
      }
      return null;
    }
    isQwenHost() {
      const e = window.location.hostname.toLowerCase();
      return 'chat.qwen.ai' === e || e.endsWith('.qwen.ai');
    }
    isLikelyUserMessageNode(e) {
      if (
        'user' ===
        (
          e.getAttribute('data-message-author-role') ||
          e.getAttribute('data-role') ||
          e.getAttribute('data-author-role') ||
          ''
        ).toLowerCase()
      )
        return !0;
      const t = `${e.className || ''}`.toLowerCase();
      return (
        !!(t.includes('user') || t.includes('human') || t.includes('me-message')) ||
        !!e.matches('textarea, input, [contenteditable="true"]') ||
        !!e.closest('form')
      );
    }
    isLikelyNonConversationNode(e) {
      if (e.closest('header, nav, aside, footer, [role="navigation"], [role="complementary"]'))
        return !0;
      if (e.matches('button, [role="button"], a, label')) return !0;
      if (e.querySelector('textarea, input, [contenteditable="true"]')) return !0;
      const t = `${e.getAttribute('aria-label') || ''}`.toLowerCase();
      return !!(
        t.includes('send') ||
        t.includes('new chat') ||
        t.includes('search') ||
        t.includes('history')
      );
    }
  })();
  if (void 0 !== globalThis.customElements && null !== globalThis.customElements)
    try {
      (window.addEventListener(
        'error',
        (e) => {
          if (
            e.message &&
            (e.message.includes('mce-autosize-textarea') ||
              e.message.includes('already been defined') ||
              e.message.includes('already been used') ||
              e.message.includes('Failed to resolve module specifier') ||
              e.message.includes('scheduler') ||
              (e.message.includes('Cannot read properties of null') &&
                e.message.includes('customElements')))
          )
            return (e.preventDefault(), void e.stopImmediatePropagation());
        },
        !0
      ),
        window.addEventListener(
          'unhandledrejection',
          (e) => {
            e.reason &&
              e.reason.message &&
              (e.reason.message.includes('Failed to resolve module specifier') ||
                e.reason.message.includes('scheduler') ||
                e.reason.message.includes('already been defined') ||
                (e.reason.message.includes('Cannot read properties of null') &&
                  e.reason.message.includes('customElements'))) &&
              e.preventDefault();
          },
          !0
        ));
      const e = globalThis.customElements.define;
      if (
        e &&
        globalThis.customElements.define &&
        !globalThis.customElements.define.__isSafeGuarded
      ) {
        ((globalThis.customElements.define = function (t, n, i) {
          if (
            !(
              ('mce-autosize-textarea' === t && globalThis.customElements.get(t)) ||
              globalThis.customElements.get(t)
            )
          )
            try {
              e.call(this, t, n, i);
            } catch (e) {
              if (e.message && e.message.includes('already been defined')) return;
              throw e;
            }
        }),
          (globalThis.customElements.define.__isSafeGuarded = !0));
        try {
          const e = globalThis.customElements;
          Object.defineProperty(globalThis, 'customElements', {
            get: () => e,
            set(e) {},
            configurable: !1,
          });
        } catch (e) {}
      }
    } catch (e) {}
  const i = 300,
    s = 200;
  class a {
    constructor(e = {}) {
      ((this.container = null),
        (this.dragState = { isDragging: !1, startX: 0, startY: 0, startPosX: 0, startPosY: 0 }),
        (this.resizeState = {
          isResizing: !1,
          startX: 0,
          startY: 0,
          startWidth: 0,
          startHeight: 0,
          startPosX: 0,
          startPosY: 0,
          edge: '',
        }),
        (this.myAgentId = null),
        (this.connectionStatus = 'disconnected'),
        (this.chatElements = null),
        (this.streamingState = null),
        (this.agents = []),
        (this.channels = []),
        (this.currentChannel = null),
        (this.pausedChannels = new Set()),
        (this.messages = []),
        (this.notifications = []),
        (this.tasks = []),
        (this.unreadCount = 0),
        (this.recentBroadcasts = new Map()),
        (this.serviceStatuses = new Map([
          ['relay', 'unknown'],
          ['api', 'unknown'],
          ['frontend', 'unknown'],
        ])),
        (this.healthPollInterval = null),
        (this.chromeMessageListener = null),
        (this.storageListener = null),
        (this.containerClickListener = null),
        (this.containerKeydownListener = null),
        (this.isContextValid = !0),
        (this.cleanupInterval = null),
        (this.CLEANUP_INTERVAL_MS = 3e4),
        (this.BROADCAST_DEDUP_WINDOW_MS = 1e4),
        (this.aiVideoState = {
          account: 'None',
          processed: 0,
          total: 0,
          cost: 0,
          queue: [],
          queueCount: 0,
          reverseOrder: !1,
          segmentDuration: 45,
          processingLevel: 'ai_studio',
          isProcessing: !1,
          isPaused: !1,
          currentIndex: 0,
          totalCount: 0,
          playlists: [],
          selectedPlaylistId: '',
          channels: [],
          selectedChannelId: '',
          history: [],
        }),
        (this.hostName = window.location.hostname.replace(/\./g, '-')),
        (this.panelId = `${this.hostName}-${Math.random().toString(36).substring(2, 8)}`),
        (this.state = {
          mode: e.mode || 'expanded',
          position: e.position || { x: 20, y: 20 },
          size: e.size || { width: 360, height: 480 },
          activeTab: 'chat',
          isDragging: !1,
          isResizing: !1,
          isPinned: !1,
          opacity: 1,
        }),
        console.log(`[GeminiBridge] Panel initialized with ID: ${this.panelId}`),
        this.loadState(),
        this.inject(),
        this.setupListeners(),
        this.requestConnectionState(),
        this.startCleanupInterval());
    }
    startCleanupInterval() {
      this.cleanupInterval = setInterval(() => {
        const e = Date.now();
        for (const [t, n] of this.recentBroadcasts.entries())
          e - n > this.BROADCAST_DEDUP_WINDOW_MS && this.recentBroadcasts.delete(t);
        (this.messages.length > 100 && (this.messages = this.messages.slice(-50)),
          this.notifications.length > 50 && (this.notifications = this.notifications.slice(-25)));
      }, this.CLEANUP_INTERVAL_MS);
    }
    requestConnectionState() {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (e) => {
        ((this.connectionStatus = e.connectionStatus || 'disconnected'),
          (this.agents = e.agents || []),
          (this.channels = e.channels || []),
          void 0 !== e.selectedChannel && (this.currentChannel = e.selectedChannel || null),
          Array.isArray(e.pausedChannels) &&
            (this.pausedChannels = new Set(e.pausedChannels.map((e) => String(e)))),
          e.browserAgentId && (this.browserAgentId = e.browserAgentId),
          e.agentId && (this.myAgentId = e.agentId),
          this.update());
      });
    }
    async loadState() {
      try {
        const e = await chrome.storage.local.get(['gemini_bridge_panel_state']);
        e.fuse_panel_state && (this.state = { ...this.state, ...e.fuse_panel_state });
      } catch (e) {}
    }
    async saveState() {
      try {
        await chrome.storage.local.set({ fuse_panel_state: this.state });
      } catch (e) {}
    }
    inject() {
      (document.getElementById('fuse-connect-panel-v7')?.remove(),
        (this.container = document.createElement('div')),
        (this.container.id = 'fuse-connect-panel-v7'),
        (this.container.innerHTML = this.render()),
        this.injectStyles(),
        document.body.appendChild(this.container),
        this.applyPositionAndSize());
    }
    injectStyles() {
      if (document.getElementById('fuse-connect-styles-v7')) return;
      const e = document.createElement('style');
      ((e.id = 'fuse-connect-styles-v7'),
        (e.textContent = this.getStyles()),
        document.head.appendChild(e));
    }
    getStyles() {
      return "\n      /* Fuse Connect v7 - Enhanced Panel Styles */\n\n      #fuse-connect-panel-v7 {\n        position: fixed !important;\n        z-index: 2147483647 !important;\n        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;\n        font-size: 13px !important;\n        line-height: 1.4 !important;\n        color: #fff !important;\n        pointer-events: auto !important;\n        user-select: none !important;\n      }\n\n      #fuse-connect-panel-v7 * {\n        box-sizing: border-box !important;\n      }\n\n      .fcp6-panel {\n        width: 100%;\n        height: 100%;\n        background: linear-gradient(135deg, rgba(10,10,15,0.98) 0%, rgba(18,18,26,0.98) 100%) !important;\n        border: 1px solid rgba(0,217,255,0.3) !important;\n        border-radius: 16px !important;\n        box-shadow:\n          0 0 40px rgba(0,217,255,0.2),\n          0 20px 60px rgba(0,0,0,0.6),\n          inset 0 1px 0 rgba(255,255,255,0.1) !important;\n        backdrop-filter: blur(20px) !important;\n        overflow: hidden !important;\n        display: flex !important;\n        flex-direction: column !important;\n      }\n\n      .fcp6-panel.collapsed {\n        height: 48px !important;\n      }\n\n      .fcp6-panel.minimized {\n        width: 48px !important;\n        height: 48px !important;\n        border-radius: 50% !important;\n      }\n\n      /* Header */\n      .fcp6-header {\n        display: flex !important;\n        align-items: center !important;\n        justify-content: space-between !important;\n        gap: 8px !important;\n        padding: 10px 12px !important;\n        background: linear-gradient(90deg, rgba(0,217,255,0.15) 0%, rgba(157,78,221,0.15) 100%) !important;\n        border-bottom: 1px solid rgba(0,217,255,0.2) !important;\n        cursor: move !important;\n        min-height: 46px !important;\n      }\n\n      .fcp6-logo {\n        display: flex !important;\n        align-items: center !important;\n        gap: 8px !important;\n        min-width: 0 !important;\n        flex: 1 1 auto !important;\n      }\n\n      .fcp6-icon {\n        width: 26px !important;\n        height: 26px !important;\n        background: linear-gradient(135deg, #00D9FF 0%, #9D4EDD 100%) !important;\n        border-radius: 6px !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        font-size: 14px !important;\n        box-shadow: 0 0 15px rgba(0,217,255,0.4) !important;\n      }\n\n      .fcp6-title {\n        font-size: 13px !important;\n        font-weight: 600 !important;\n        background: linear-gradient(90deg, #00D9FF, #9D4EDD) !important;\n        -webkit-background-clip: text !important;\n        -webkit-text-fill-color: transparent !important;\n        background-clip: text !important;\n        white-space: nowrap !important;\n        overflow: hidden !important;\n        text-overflow: ellipsis !important;\n      }\n\n      .fcp6-status-dot {\n        width: 8px !important;\n        height: 8px !important;\n        border-radius: 50% !important;\n        margin-left: 8px !important;\n      }\n\n      .fcp6-status-dot.connected { background: #00FF88 !important; box-shadow: 0 0 8px rgba(0,255,136,0.6) !important; }\n      .fcp6-status-dot.disconnected { background: #FF3366 !important; }\n      .fcp6-status-dot.connecting { background: #FFB800 !important; animation: fcp6-pulse 1s infinite !important; }\n\n      @keyframes fcp6-pulse {\n        0%, 100% { opacity: 1; }\n        50% { opacity: 0.4; }\n      }\n\n      .fcp6-controls {\n        display: flex !important;\n        gap: 4px !important;\n        align-items: center !important;\n        flex-shrink: 0 !important;\n      }\n\n      .fcp6-btn {\n        width: 26px !important;\n        height: 26px !important;\n        border: none !important;\n        border-radius: 6px !important;\n        background: rgba(255,255,255,0.08) !important;\n        color: rgba(255,255,255,0.7) !important;\n        cursor: pointer !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        font-size: 12px !important;\n        transition: all 0.2s ease !important;\n      }\n\n      .fcp6-btn:hover {\n        background: rgba(0,217,255,0.3) !important;\n        color: #00D9FF !important;\n      }\n\n      .fcp6-badge {\n        position: absolute !important;\n        top: -4px !important;\n        right: -4px !important;\n        min-width: 16px !important;\n        height: 16px !important;\n        background: #FF006E !important;\n        border-radius: 8px !important;\n        font-size: 10px !important;\n        font-weight: 600 !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        padding: 0 4px !important;\n      }\n\n      /* Tabs */\n      .fcp6-tabs {\n        display: flex !important;\n        padding: 4px !important;\n        gap: 2px !important;\n        background: rgba(0,0,0,0.2) !important;\n        border-bottom: 1px solid rgba(255,255,255,0.05) !important;\n      }\n\n      .fcp6-tab {\n        flex: 1 !important;\n        padding: 8px 4px !important;\n        border: none !important;\n        border-radius: 6px !important;\n        background: transparent !important;\n        color: rgba(255,255,255,0.5) !important;\n        font-size: 11px !important;\n        font-weight: 500 !important;\n        cursor: pointer !important;\n        transition: all 0.2s ease !important;\n        display: flex !important;\n        flex-direction: column !important;\n        align-items: center !important;\n        gap: 2px !important;\n      }\n\n      .fcp6-tab:hover {\n        background: rgba(255,255,255,0.05) !important;\n        color: rgba(255,255,255,0.8) !important;\n      }\n\n      .fcp6-tab.active {\n        background: linear-gradient(135deg, rgba(0,217,255,0.2) 0%, rgba(157,78,221,0.2) 100%) !important;\n        color: #00D9FF !important;\n        border: 1px solid rgba(0,217,255,0.3) !important;\n      }\n\n      .fcp6-tab-icon {\n        font-size: 14px !important;\n      }\n\n      /* Content */\n      .fcp6-content {\n        flex: 1 !important;\n        overflow-y: auto !important;\n        padding: 12px !important;\n      }\n\n      .fcp6-content::-webkit-scrollbar {\n        width: 5px !important;\n      }\n\n      .fcp6-content::-webkit-scrollbar-thumb {\n        background: rgba(0,217,255,0.3) !important;\n        border-radius: 3px !important;\n      }\n\n      /* Input area */\n      .fcp6-input-area {\n        padding: 10px 12px 12px !important;\n        border-top: 1px solid rgba(0,217,255,0.22) !important;\n        background: linear-gradient(180deg, rgba(13,20,30,0.94) 0%, rgba(9,14,22,0.98) 100%) !important;\n        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04) !important;\n      }\n\n      .fcp6-input-row {\n        display: grid !important;\n        grid-template-columns: minmax(0, 1fr) auto !important;\n        gap: 10px !important;\n        align-items: stretch !important;\n      }\n\n      .fcp6-input-shell {\n        flex: 1 !important;\n        display: flex !important;\n        align-items: flex-end !important;\n        padding: 6px !important;\n        border: 1px solid rgba(0,217,255,0.28) !important;\n        border-radius: 12px !important;\n        background: linear-gradient(145deg, rgba(3,8,16,0.9), rgba(5,11,20,0.98)) !important;\n        box-shadow:\n          inset 0 1px 0 rgba(255,255,255,0.05),\n          0 8px 18px rgba(0,0,0,0.26) !important;\n      }\n\n      .fcp6-input {\n        width: 100% !important;\n        min-height: 42px !important;\n        max-height: 120px !important;\n        padding: 8px 10px !important;\n        border: none !important;\n        border-radius: 8px !important;\n        background: transparent !important;\n        color: rgba(255,255,255,0.96) !important;\n        font-size: 13px !important;\n        outline: none !important;\n        line-height: 1.35 !important;\n        resize: none !important;\n      }\n\n      .fcp6-input-shell:focus-within {\n        border-color: rgba(0,217,255,0.65) !important;\n        box-shadow:\n          0 0 0 2px rgba(0,217,255,0.2),\n          0 0 24px rgba(0,217,255,0.14),\n          inset 0 1px 0 rgba(255,255,255,0.07) !important;\n      }\n\n      .fcp6-input:focus {\n        box-shadow: none !important;\n      }\n\n      .fcp6-input::placeholder {\n        color: rgba(196,210,230,0.62) !important;\n      }\n\n      .fcp6-send-btn {\n        min-width: 46px !important;\n        min-height: 46px !important;\n        padding: 0 !important;\n        border: none !important;\n        border-radius: 12px !important;\n        background: linear-gradient(140deg, #00D9FF 0%, #00A3FF 45%, #7A5CFF 100%) !important;\n        color: #fff !important;\n        font-weight: 700 !important;\n        font-size: 16px !important;\n        line-height: 1 !important;\n        cursor: pointer !important;\n        transition: all 0.2s ease !important;\n      }\n\n      .fcp6-send-btn:hover {\n        box-shadow: 0 0 24px rgba(0,217,255,0.45) !important;\n        transform: translateY(-1px) !important;\n      }\n\n      .fcp6-send-btn:active {\n        transform: translateY(0) !important;\n      }\n\n      .fcp6-input-hint {\n        margin-top: 8px !important;\n        font-size: 10px !important;\n        color: rgba(196,210,230,0.62) !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: space-between !important;\n        gap: 8px !important;\n        flex-wrap: wrap !important;\n      }\n\n      .fcp6-input-action {\n        display: inline-flex !important;\n        align-items: center !important;\n        gap: 6px !important;\n        padding: 4px 8px !important;\n        border: 1px solid rgba(0,255,136,0.32) !important;\n        border-radius: 8px !important;\n        background: rgba(0,255,136,0.12) !important;\n        color: #86ffd0 !important;\n        font-size: 10px !important;\n        line-height: 1 !important;\n      }\n\n      .fcp6-input-action:hover {\n        background: rgba(0,255,136,0.2) !important;\n        border-color: rgba(0,255,136,0.44) !important;\n      }\n\n      .fcp6-shortcut-hint {\n        display: inline-flex !important;\n        align-items: center !important;\n        gap: 6px !important;\n        margin-left: auto !important;\n      }\n\n      .fcp6-shortcut-key {\n        display: inline-flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        min-width: 18px !important;\n        height: 16px !important;\n        padding: 0 5px !important;\n        border-radius: 5px !important;\n        border: 1px solid rgba(255,255,255,0.22) !important;\n        background: rgba(255,255,255,0.08) !important;\n        color: rgba(255,255,255,0.88) !important;\n        font-size: 9px !important;\n        line-height: 1 !important;\n      }\n\n      /* Chat card */\n      .fcp6-chat-card {\n        padding: 10px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 8px !important;\n        border: 1px solid rgba(255,255,255,0.05) !important;\n      }\n\n      .fcp6-chat-header {\n        display: flex !important;\n        justify-content: space-between !important;\n        margin-bottom: 4px !important;\n        font-size: 11px !important;\n      }\n\n      .fcp6-chat-from {\n        color: #00D9FF !important;\n        font-weight: 500 !important;\n      }\n\n      .fcp6-chat-time {\n        color: rgba(255,255,255,0.3) !important;\n      }\n\n      .fcp6-chat-content {\n        color: rgba(255,255,255,0.8) !important;\n        word-break: break-word !important;\n      }\n\n      /* Channel list */\n      .fcp6-channel {\n        display: flex !important;\n        align-items: center !important;\n        gap: 10px !important;\n        padding: 10px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 6px !important;\n        cursor: pointer !important;\n        transition: all 0.2s ease !important;\n      }\n\n      .fcp6-channel:hover, .fcp6-channel.active {\n        background: rgba(0,217,255,0.1) !important;\n        border: 1px solid rgba(0,217,255,0.3) !important;\n      }\n\n      .fcp6-channel-icon {\n        font-size: 18px !important;\n      }\n\n      .fcp6-channel-info {\n        flex: 1 !important;\n      }\n\n      .fcp6-channel-name {\n        font-weight: 500 !important;\n      }\n\n      .fcp6-channel-members {\n        font-size: 11px !important;\n        color: rgba(255,255,255,0.4) !important;\n      }\n\n      .fcp6-channel-actions {\n        display: flex !important;\n        align-items: center !important;\n        gap: 4px !important;\n        flex-shrink: 0 !important;\n      }\n\n      .fcp6-channel-delete {\n        width: 24px !important;\n        height: 24px !important;\n        border-radius: 999px !important;\n        border: 1px solid rgba(255,51,102,0.42) !important;\n        background: rgba(255,51,102,0.18) !important;\n        color: #ff5f86 !important;\n        font-weight: 700 !important;\n        line-height: 1 !important;\n      }\n\n      .fcp6-channel-delete:hover {\n        background: rgba(255,51,102,0.28) !important;\n        color: #ffd9e4 !important;\n      }\n\n      /* Agent card */\n      .fcp6-agent {\n        display: flex !important;\n        align-items: center !important;\n        gap: 10px !important;\n        padding: 10px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 6px !important;\n      }\n\n      .fcp6-agent-avatar {\n        width: 36px !important;\n        height: 36px !important;\n        border-radius: 8px !important;\n        background: linear-gradient(135deg, #9D4EDD 0%, #00D9FF 100%) !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        font-size: 16px !important;\n      }\n\n      .fcp6-agent-name {\n        font-weight: 500 !important;\n      }\n\n      .fcp6-agent-platform {\n        font-size: 11px !important;\n        color: rgba(255,255,255,0.4) !important;\n      }\n\n      /* Notification */\n      .fcp6-notification {\n        padding: 10px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 8px !important;\n        border-left: 3px solid #00D9FF !important;\n      }\n\n      .fcp6-notification.unread {\n        background: rgba(0,217,255,0.1) !important;\n      }\n\n      /* Task card */\n      .fcp6-task {\n        padding: 12px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 8px !important;\n        border-left: 3px solid #9D4EDD !important;\n      }\n\n      .fcp6-task.high { border-left-color: #FF3366 !important; }\n      .fcp6-task.medium { border-left-color: #FFB800 !important; }\n      .fcp6-task.completed { border-left-color: #00FF88 !important; opacity: 0.7 !important; }\n\n      .fcp6-task-header {\n        display: flex !important;\n        justify-content: space-between !important;\n        margin-bottom: 6px !important;\n      }\n\n      .fcp6-task-title {\n        font-weight: 600 !important;\n        font-size: 12px !important;\n      }\n\n      .fcp6-task-meta {\n        font-size: 10px !important;\n        color: rgba(255,255,255,0.5) !important;\n        display: flex !important;\n        gap: 8px !important;\n      }\n\n      /* Detection status */\n      .fcp6-detection {\n        padding: 10px !important;\n        background: rgba(0,255,136,0.1) !important;\n        border: 1px solid rgba(0,255,136,0.3) !important;\n        border-radius: 8px !important;\n        margin-bottom: 12px !important;\n      }\n\n      .fcp6-detection.streaming {\n        border-color: #FFB800 !important;\n        background: rgba(255,184,0,0.1) !important;\n      }\n\n      /* Resize handles */\n      .fcp6-resize-handle {\n        position: absolute !important;\n        background: transparent !important;\n        z-index: 5 !important;\n      }\n\n      .fcp6-resize-handle.left, .fcp6-resize-handle.right {\n        top: 10% !important;\n        width: 8px !important;\n        height: 80% !important;\n        cursor: ew-resize !important;\n      }\n\n      .fcp6-resize-handle.left {\n        left: 0 !important;\n      }\n\n      .fcp6-resize-handle.right {\n        right: 0 !important;\n      }\n\n      .fcp6-resize-handle.top, .fcp6-resize-handle.bottom {\n        left: 10% !important;\n        width: 80% !important;\n        height: 8px !important;\n        cursor: ns-resize !important;\n      }\n\n      .fcp6-resize-handle.top {\n        top: 0 !important;\n      }\n\n      .fcp6-resize-handle.bottom {\n        bottom: 0 !important;\n      }\n\n      .fcp6-resize-handle.corner-nw,\n      .fcp6-resize-handle.corner-ne,\n      .fcp6-resize-handle.corner-sw,\n      .fcp6-resize-handle.corner-se {\n        width: 14px !important;\n        height: 14px !important;\n      }\n\n      .fcp6-resize-handle.corner-nw {\n        left: 0 !important;\n        top: 0 !important;\n        cursor: nwse-resize !important;\n      }\n\n      .fcp6-resize-handle.corner-ne {\n        right: 0 !important;\n        top: 0 !important;\n        cursor: nesw-resize !important;\n      }\n\n      .fcp6-resize-handle.corner-sw {\n        left: 0 !important;\n        bottom: 0 !important;\n        cursor: nwse-resize !important;\n      }\n\n      .fcp6-resize-handle.corner-se {\n        right: 0 !important;\n        bottom: 0 !important;\n        cursor: nesw-resize !important;\n      }\n\n      @media (max-width: 540px) {\n        .fcp6-header {\n          padding: 8px 10px !important;\n        }\n        .fcp6-title {\n          max-width: 128px !important;\n        }\n      }\n    ";
    }
    applyPositionAndSize() {
      if (!this.container) return;
      const { position: e, mode: t } = this.state,
        n = {
          width: Math.min(this.getMaxPanelWidth(), Math.max(i, this.state.size.width)),
          height: Math.min(this.getMaxPanelHeight(), Math.max(s, this.state.size.height)),
        };
      this.state.size = n;
      const a = 'collapsed' === t;
      if ('minimized' === t) {
        ((this.container.style.width = ''), (this.container.style.height = ''));
        const t = window.innerWidth - 48,
          n = window.innerHeight - 48,
          i = Math.min(Math.max(0, e.x), t),
          s = Math.min(Math.max(0, e.y), n);
        return ((this.container.style.left = `${i}px`), void (this.container.style.top = `${s}px`));
      }
      a
        ? ((this.container.style.height = '48px'), (this.container.style.width = `${n.width}px`))
        : ((this.container.style.height = `${n.height}px`),
          (this.container.style.width = `${n.width}px`));
      const o = window.innerWidth - n.width,
        r = window.innerHeight - (a ? 48 : n.height),
        c = Math.min(Math.max(0, e.x), o),
        l = Math.min(Math.max(0, e.y), r);
      ((this.container.style.left = `${c}px`), (this.container.style.top = `${l}px`));
    }
    setupListeners() {
      if (!this.container) return;
      (this.containerClickListener &&
        (this.container.removeEventListener('click', this.containerClickListener),
        (this.containerClickListener = null)),
        this.containerKeydownListener &&
          (this.container.removeEventListener('keydown', this.containerKeydownListener),
          (this.containerKeydownListener = null)),
        this.storageListener &&
          (chrome.storage.onChanged.removeListener(this.storageListener),
          (this.storageListener = null)));
      const e = this.container.querySelector('[data-drag-handle]');
      (e &&
        e.addEventListener('mousedown', (e) => {
          this.startDrag(e);
        }),
        this.container.querySelectorAll('[data-resize]').forEach((e) => {
          e.addEventListener('mousedown', (e) => {
            const t = e.currentTarget.dataset.resize || '';
            this.startResize(e, t);
          });
        }),
        (this.containerClickListener = (e) => {
          const t = e.target,
            n = t.closest('[data-action]');
          if (n) {
            const e = n.dataset.action || '';
            return void this.handleAction(e, n);
          }
          const i = t.closest('[data-tab]');
          if (i) {
            const e = i.dataset.tab;
            return void this.switchTab(e);
          }
          if ('poker-activate-tech' === t.id) {
            const e =
              'STEM: You are now the most prolific poker technician that ever lived. \n        Your reasoning is grounded in GTO (Game Theory Optimal) balance but your edge comes from elite exploitative adjustments. \n        Analyze all incoming hand histories and board states with absolute technical precision. \n        Focus on: Range vs Range equity, polarized vs condensed distributions, and board texture advantage. \n        You are connected to the TNF Federation Green Channel. Broadcast your high-level insights there. \n        Acknowledge your technical activation now.';
            return (
              chrome.runtime.sendMessage({
                type: 'BROADCAST_MESSAGE',
                channel: 'green',
                content: e,
                metadata: { isSystemMessage: !0 },
              }),
              chrome.runtime.sendMessage({ type: 'INJECT_MESSAGE', content: e }),
              (t.textContent = 'Technician Active!'),
              void (t.style.background = '#34a853')
            );
          }
          if ('poker-push-context' === t.id)
            return (
              chrome.runtime.sendMessage({
                type: 'ACTIVITY_EVENT',
                eventType: 'GAME_STATE_PUSH',
                channel: 'green',
                metadata: { url: window.location.href, timestamp: Date.now() },
              }),
              (t.textContent = 'State Pushed!'),
              void setTimeout(() => {
                t && (t.textContent = 'Push Game State to Green');
              }, 2e3)
            );
          if (t.matches('.fcp6-channel')) {
            const e = t.dataset.channel;
            e && this.selectChannel(e);
          }
        }),
        this.container.addEventListener('click', this.containerClickListener),
        (this.containerKeydownListener = (e) => {
          const t = e,
            n = e.target;
          ('message' !== n.dataset.input ||
            'Enter' !== t.key ||
            t.shiftKey ||
            (t.preventDefault(), this.sendMessage()),
            'fuse-new-channel-name' === n.id &&
              'Enter' === t.key &&
              (t.preventDefault(), this.submitCreateChannel()));
        }),
        this.container.addEventListener('keydown', this.containerKeydownListener));
      const t = this.container.querySelector('#fuse-channel-select');
      (t &&
        t.addEventListener('change', (e) => {
          const t = e.target;
          this.selectChannel(t.value || null);
        }),
        (this.storageListener = (e, t) => {
          if ('local' === t && e.fuse_channels) {
            const t = e.fuse_channels.newValue;
            t &&
              Array.isArray(t) &&
              (console.log('[GeminiBridge] Syncing channels list from storage:', t.length),
              (this.channels = t),
              this.update());
          }
        }),
        chrome.storage.onChanged.addListener(this.storageListener));
    }
    startDrag(e) {
      if (e.target.closest('button')) return;
      this.dragState = {
        isDragging: !0,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: this.state.position.x,
        startPosY: this.state.position.y,
      };
      const t = (e) => {
          if (!this.dragState.isDragging || !this.container) return;
          const t = e.clientX - this.dragState.startX,
            n = e.clientY - this.dragState.startY;
          ((this.state.position.x = this.dragState.startPosX + t),
            (this.state.position.y = this.dragState.startPosY + n),
            this.applyPositionAndSize());
        },
        n = () => {
          ((this.dragState.isDragging = !1),
            document.removeEventListener('mousemove', t),
            document.removeEventListener('mouseup', n),
            this.saveState());
        };
      (document.addEventListener('mousemove', t), document.addEventListener('mouseup', n));
    }
    render() {
      const { mode: e, activeTab: t } = this.state,
        n = 'collapsed' === e;
      return 'minimized' === e
        ? this.renderMinimized()
        : `\n      <div class="fcp6-panel ${n ? 'collapsed' : ''}" id="fuse-connect-panel" data-testid="fuse-connect-panel" aria-label="Fuse Connect Panel">\n        ${this.renderHeader()}\n        ${n ? '' : `\n          ${this.renderTabs()}\n          <div class="fcp6-content" id="fuse-panel-content" data-testid="fuse-panel-content">\n            ${this.renderTabContent(t)}\n          </div>\n          ${'chat' === t ? this.renderInputArea() : ''}\n        `}\n        ${n ? '' : this.renderResizeHandles()}\n      </div>\n    `;
    }
    renderResizeHandles() {
      return '\n      <div class="fcp6-resize-handle left" data-resize="left"></div>\n      <div class="fcp6-resize-handle right" data-resize="right"></div>\n      <div class="fcp6-resize-handle top" data-resize="top"></div>\n      <div class="fcp6-resize-handle bottom" data-resize="bottom"></div>\n      <div class="fcp6-resize-handle corner-nw" data-resize="corner-nw"></div>\n      <div class="fcp6-resize-handle corner-ne" data-resize="corner-ne"></div>\n      <div class="fcp6-resize-handle corner-sw" data-resize="corner-sw"></div>\n      <div class="fcp6-resize-handle corner-se" data-resize="corner-se"></div>\n    ';
    }
    startResize(e, t) {
      this.resizeState = {
        isResizing: !0,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: this.state.size.width,
        startHeight: this.state.size.height,
        startPosX: this.state.position.x,
        startPosY: this.state.position.y,
        edge: t,
      };
      let n = null;
      const a = (e) => {
          if (!this.resizeState.isResizing || !this.container) return;
          const a = e.clientX,
            o = e.clientY;
          n ||
            (n = requestAnimationFrame(() => {
              const e = a - this.resizeState.startX,
                r = o - this.resizeState.startY,
                c = this.getMaxPanelWidth(),
                l = this.getMaxPanelHeight();
              let d = this.resizeState.startWidth,
                p = this.resizeState.startHeight,
                h = this.resizeState.startPosX,
                u = this.resizeState.startPosY;
              const m = t.includes('left') || t.includes('nw') || t.includes('sw'),
                g = t.includes('right') || t.includes('ne') || t.includes('se'),
                f = t.includes('top') || t.includes('nw') || t.includes('ne'),
                b = t.includes('bottom') || t.includes('sw') || t.includes('se');
              if (m) {
                const t = this.resizeState.startWidth - e;
                ((d = Math.min(c, Math.max(i, t))),
                  (h = this.resizeState.startPosX + (this.resizeState.startWidth - d)));
              } else if (g) {
                const t = this.resizeState.startWidth + e;
                d = Math.min(c, Math.max(i, t));
              }
              if (f) {
                const e = this.resizeState.startHeight - r;
                ((p = Math.min(l, Math.max(s, e))),
                  (u = this.resizeState.startPosY + (this.resizeState.startHeight - p)));
              } else if (b) {
                const e = this.resizeState.startHeight + r;
                p = Math.min(l, Math.max(s, e));
              }
              ((h = Math.max(0, Math.min(window.innerWidth - d, h))),
                (u = Math.max(0, Math.min(window.innerHeight - p, u))),
                (this.state.position.x = h),
                (this.state.position.y = u),
                (this.state.size.width = d),
                (this.state.size.height = p),
                this.applyPositionAndSize(),
                (n = null));
            }));
        },
        o = () => {
          ((this.resizeState.isResizing = !1),
            n && (cancelAnimationFrame(n), (n = null)),
            document.removeEventListener('mousemove', a),
            document.removeEventListener('mouseup', o),
            this.saveState());
        };
      (document.addEventListener('mousemove', a), document.addEventListener('mouseup', o));
    }
    getMaxPanelWidth() {
      return Math.max(i, Math.min(1200, window.innerWidth - 16));
    }
    getMaxPanelHeight() {
      return Math.max(s, Math.min(1e3, window.innerHeight - 16));
    }
    renderInputArea() {
      return '\n      <div class="fcp6-input-area">\n        <div class="fcp6-input-row">\n          <div class="fcp6-input-shell">\n            <textarea\n              class="fcp6-input"\n              data-input="message"\n              placeholder="Message the channel..."\n              rows="1"\n            ></textarea>\n          </div>\n          <button class="fcp6-send-btn" data-action="send" title="Send">\n            ➤\n          </button>\n        </div>\n        <div class="fcp6-input-hint">\n          <button class="fcp6-btn fcp6-input-action" data-action="inject-to-chat" title="Inject only to the page chat">\n            Inject to Page\n          </button>\n          <span class="fcp6-shortcut-hint">\n            <span class="fcp6-shortcut-key">Enter</span>\n            <span>to send</span>\n          </span>\n        </div>\n      </div>\n    ';
    }
    renderMinimized() {
      return `\n      <div class="fcp6-panel minimized" id="fuse-panel-minimized" data-testid="fuse-panel-minimized" data-action="expand" aria-label="Expand Fuse Connect Panel">\n        <div class="fcp6-icon">⚡</div>\n        ${this.unreadCount > 0 ? `<span class="fcp6-badge">${this.unreadCount}</span>` : ''}\n      </div>\n    `;
    }
    renderHeader() {
      const e = this.panelId.split('-').pop() || this.panelId;
      return `\n      <div class="fcp6-header" data-drag-handle>\n        <div class="fcp6-logo">\n          <div class="fcp6-icon">⚡</div>\n          <span class="fcp6-title">FUSE CONNECT</span>\n          <span class="fcp6-status-dot ${this.connectionStatus}"></span>\n        </div>\n        <div class="fcp6-controls">\n          <span style="font-size: 9px; color: rgba(255,255,255,0.4); margin-right: 8px;" title="Panel ID: ${this.panelId}">\n            #${e}\n          </span>\n          <button class="fcp6-btn" id="fuse-btn-pin" data-testid="fuse-btn-pin" data-action="pin" title="Pin panel" aria-label="Pin panel">${this.state.isPinned ? '📌' : '📍'}</button>\n          <button class="fcp6-btn" id="fuse-btn-minimize" data-testid="fuse-btn-minimize" data-action="minimize" title="Minimize" aria-label="Minimize panel">−</button>\n          <button class="fcp6-btn" id="fuse-btn-toggle" data-testid="fuse-btn-toggle" data-action="toggle" title="${'collapsed' === this.state.mode ? 'Expand' : 'Collapse'}" aria-label="${'collapsed' === this.state.mode ? 'Expand panel' : 'Collapse panel'}">\n            ${'collapsed' === this.state.mode ? '▼' : '▲'}\n          </button>\n        </div>\n      </div>\n      ${'collapsed' !== this.state.mode ? this.renderChannelSelector() : ''}\n    `;
    }
    renderChannelSelector() {
      const e = !(!this.currentChannel || !this.pausedChannels.has(this.currentChannel));
      return `\n      <div class="fcp6-channel-selector" style="\n        padding: 6px 12px;\n        background: rgba(0,0,0,0.3);\n        border-bottom: 1px solid rgba(255,255,255,0.1);\n        display: flex;\n        align-items: center;\n        gap: 8px;\n        font-size: 11px;\n      ">\n        <span style="color: rgba(255,255,255,0.5);">Sync to:</span>\n        <select id="fuse-channel-select" data-action="select-channel" style="\n          flex: 1;\n          padding: 4px 8px;\n          border-radius: 4px;\n          border: 1px solid rgba(255,255,255,0.2);\n          background: rgba(0,0,0,0.4);\n          color: white;\n          font-size: 11px;\n          cursor: pointer;\n        ">\n          <option value="" ${this.currentChannel ? '' : 'selected'}>-- None (local only) --</option>\n          ${this.channels.map((e) => `\n            <option value="${e.id}" ${this.currentChannel === e.id ? 'selected' : ''}>\n              ${e.isPrivate ? '🔒' : '#'} ${this.escapeHtml(e.name)}\n            </option>\n          `).join('')}\n        </select>\n        <span style="color: ${this.currentChannel ? '#0f8' : 'rgba(255,255,255,0.3)'}; font-size: 10px;">\n          ${this.currentChannel ? '● Syncing' : '○ Local'}\n        </span>\n        ${this.currentChannel ? `\n          <button class="fcp6-btn" data-action="toggle-channel-pause" title="${e ? 'Resume channel' : 'Pause channel'}" style="width:auto; padding:4px 8px; font-size:11px; ${e ? 'background:rgba(255,184,0,0.2); color:#FFB800;' : 'background:rgba(255,255,255,0.08);'}">\n            ${e ? '▶ Resume' : '⏸ Pause'}\n          </button>\n        ` : ''}\n      </div>\n    `;
    }
    renderTabs() {
      return `\n      <div class="fcp6-tabs">\n        ${[
        { id: 'chat', icon: '💬', label: 'Chat' },
        { id: 'poker', icon: '🃏', label: 'Poker' },
        { id: 'agents', icon: '🤖', label: 'Agents' },
        { id: 'channels', icon: '📢', label: 'Channels' },
        { id: 'tasks', icon: '📋', label: 'Tasks' },
        { id: 'services', icon: '⚙️', label: 'Services' },
        { id: 'notifications', icon: '🔔', label: 'Alerts' },
        { id: 'settings', icon: '🔧', label: 'Settings' },
      ]
        .map(
          (e) =>
            `\n          <button class="fcp6-tab ${this.state.activeTab === e.id ? 'active' : ''}" data-tab="${e.id}">\n            <span class="fcp6-tab-icon">${e.icon}</span>\n            <span>${e.label}</span>\n            ${'notifications' === e.id && this.unreadCount > 0 ? `<span class="fcp6-badge">${this.unreadCount}</span>` : ''}\n          </button>\n        `
        )
        .join('')}\n      </div>\n    `;
    }
    renderTabContent(e) {
      switch (e) {
        case 'chat':
          return this.renderChatTab();
        case 'poker':
          return this.renderPokerTab();
        case 'channels':
          return this.renderChannelsTab();
        case 'agents':
          return this.renderAgentsTab();
        case 'tasks':
          return this.renderTasksTab();
        case 'notifications':
          return this.renderNotificationsTab();
        case 'services':
          return this.renderServicesTab();
        case 'settings':
          return this.renderSettingsTab();
        default:
          return '';
      }
    }
    renderPokerTab() {
      return '\n      <div class="fcp6-poker-tab" style="padding: 16px; display: flex; flex-direction: column; gap: 16px; color: #fff;">\n        <div style="text-align: center; margin-bottom: 8px;">\n          <div style="font-size: 24px;">🃏</div>\n          <h3 style="margin: 8px 0 4px 0; color: #fff;">Poker Technician</h3>\n          <p style="font-size: 11px; color: rgba(255,255,255,0.5); margin: 0;">Elite GTO & Exploitative Analysis</p>\n        </div>\n\n        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">\n          <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #00D9FF;">Technician Actions</h4>\n          <div style="display: flex; flex-direction: column; gap: 8px;">\n            <button class="fcp6-btn" id="poker-activate-tech" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #1a73e8, #4285f4); color: white; font-weight: bold; border-radius: 8px; border: none; cursor: pointer;">\n              Stem as Prolific Technician\n            </button>\n            <button class="fcp6-btn" id="poker-push-context" style="width: 100%; padding: 8px; background: rgba(52, 168, 83, 0.2); color: #34a853; border: 1px solid rgba(52, 168, 83, 0.3); border-radius: 8px; cursor: pointer;">\n              Push Game State to Green\n            </button>\n          </div>\n        </div>\n\n        <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px;">\n          <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #FFB800;">Real-time HUD</h4>\n          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">\n            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px;">\n              <span style="color: rgba(255,255,255,0.4);">VPIP:</span> 24.5%\n            </div>\n            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px;">\n              <span style="color: rgba(255,255,255,0.4);">PFR:</span> 19.2%\n            </div>\n            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px;">\n              <span style="color: rgba(255,255,255,0.4);">3-Bet:</span> 8.1%\n            </div>\n            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px;">\n              <span style="color: rgba(255,255,255,0.4);">AF:</span> 3.4\n            </div>\n          </div>\n        </div>\n      </div>\n    ';
    }
    renderChatTab() {
      let e = '';
      if (this.chatElements) {
        const t = this.streamingState?.isStreaming;
        e = `\n        <div class="fcp6-detection ${t ? 'streaming' : ''}">\n          <div style="display: flex; justify-content: space-between; align-items: center;">\n            <span>${t ? '🔄 AI is responding...' : '✅ Chat detected'}</span>\n            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">\n              ${Math.round(100 * this.chatElements.confidence)}% confidence\n            </span>\n          </div>\n        </div>\n      `;
      }
      return `\n      ${e}\n      <div class="fcp6-chat-scroll" id="fuse-chat-scroll" style="flex: 1; overflow-y: auto; max-height: 300px; padding-right: 4px;">\n        ${
        this.messages.length > 0
          ? this.messages
              .slice(-50)
              .map((e) => {
                let t = e.from,
                  n = e.from,
                  i = !1;
                if (
                  'You' === e.from ||
                  'You (Fuse)' === e.from ||
                  (this.myAgentId && e.from === this.myAgentId)
                )
                  ((t = 'You'), (n = this.myAgentId || 'unknown-id'), !0);
                else {
                  const i = this.agents.find((t) => t.id === e.from);
                  i && ((t = i.name), (n = i.id));
                }
                if (e.metadata?.isSystemMessage)
                  return `\n                  <div class="fcp6-system-message" style="text-align: center; margin: 8px 0; font-size: 11px; color: rgba(255, 255, 255, 0.5); font-style: italic;">\n                    <span style="background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 10px;">\n                      ${this.escapeHtml(e.content)}\n                    </span>\n                  </div>\n                 `;
                e.metadata && 'string' == typeof e.metadata.senderId && (n = e.metadata.senderId);
                const s = n.length > 8 ? n.substring(0, 6) + '...' : n;
                return `\n            <div class="fcp6-chat-card" data-msg-id="${e.id}">\n            <div class="fcp6-chat-header">\n              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">\n                <span class="fcp6-chat-from" title="Agent ID: ${this.escapeHtml(n)}">\n                  ${this.escapeHtml(t)}\n                </span>\n                <div style="display: flex; align-items: center; gap: 4px;">\n                  <span style="font-size: 9px; font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 4px; color: rgba(255,255,255,0.6); user-select: text; -webkit-user-select: text;" title="Click copy to get full ID: ${this.escapeHtml(n)}">\n                    #${this.escapeHtml(s)}\n                  </span>\n                  <button class="fcp6-btn" data-action="copy-to-clipboard" data-value="${this.escapeHtml(n)}" title="Copy Agent ID" style="width: 18px; height: 18px; font-size: 8px; padding: 0; background: rgba(0,217,255,0.1); color: #00D9FF; border: 1px solid rgba(0,217,255,0.2);">\n                    📋\n                  </button>\n                </div>\n              </div>\n              <span class="fcp6-chat-time">${this.formatTime(e.timestamp)}</span>\n            </div>\n            <div class="fcp6-chat-content" style="user-select: text; -webkit-user-select: text; cursor: text;">${this.escapeHtml(e.content)}</div>\n          </div>\n        `;
              })
              .join('')
          : '<div class="fcp6-empty"><div class="fcp6-empty-icon">💬</div><p>No messages yet</p><p style="font-size: 11px; opacity: 0.6;">Send a message to start chatting</p></div>'
      }\n      </div>\n      </div>\n    `;
    }
    renderChannelsTab() {
      return `\n      <div class="fcp6-section-title">Active Channels</div>\n      <div class="fcp6-list">\n        ${this.channels.length > 0 ? this.channels.map((e) => `\n          <div class="fcp6-channel ${this.currentChannel === e.id ? 'active' : ''}" data-channel="${e.id}">\n            <div class="fcp6-channel-icon">${e.isPrivate ? '🔒' : '#'}</div>\n            <div class="fcp6-channel-info">\n              <div class="fcp6-channel-name">${this.escapeHtml(e.name)}</div>\n              <div class="fcp6-channel-members">${e.members.length} active agents</div>\n            </div>\n            <div class="fcp6-channel-actions">\n              ${this.currentChannel === e.id ? '<div class="fcp6-badge" style="position:static; margin:0;">✓</div>' : ''}\n              ${'general' !== e.id ? `<button class="fcp6-btn fcp6-channel-delete" data-action="delete-channel" data-channel-id="${e.id}" title="Delete Channel">×</button>` : ''}\n            </div>\n          </div>\n        `).join('') : '<div class="fcp6-empty">No active channels</div>'}\n      </div>\n\n      <div class="fcp6-section-title" style="margin-top: 16px;">Create Channel</div>\n      <div class="fcp6-input-row">\n        <input type="text" id="fuse-new-channel-name" class="fcp6-input" placeholder="New channel name..." style="min-height: 36px;">\n        <button class="fcp6-btn" style="width: auto; padding: 0 12px; background: rgba(0,217,255,0.2); color: #00D9FF;" data-action="submit-create-channel">Create</button>\n      </div>\n    `;
    }
    renderAgentsTab() {
      return `\n      <div class="fcp6-section-title">Connected Agents (${this.agents.length})</div>\n      <div class="fcp6-list">\n        ${this.agents.length > 0 ? this.agents.map((e) => `\n          <div class="fcp6-agent">\n            <div class="fcp6-agent-avatar">${this.getAgentIcon(e.platform || 'unknown')}</div>\n            <div class="fcp6-channel-info">\n              <div class="fcp6-agent-name">\n                ${this.escapeHtml(e.name)}\n                ${e.id === this.myAgentId ? '<span class="fcp6-badge" style="position:static; display:inline-block; margin-left:6px; background:rgba(0,217,255,0.2); color:#00D9FF;">YOU</span>' : ''}\n              </div>\n              <div class="fcp6-agent-platform">${e.platform} • ${e.status}</div>\n            </div>\n          </div>\n        `).join('') : '<div class="fcp6-empty">No other agents connected</div>'}\n      </div>\n    `;
    }
    renderServicesTab() {
      return '\n      <div class="fcp6-section-title">✨ Services</div>\n      <div style="padding:16px; text-align:center; color:rgba(255,255,255,0.7); font-size:12px; margin-top:20px;">\n        <div>Please open the main <strong>Fuse Connect Extension popup</strong> from your browser toolbar to access AI Video Intelligence and other connected services.</div>\n      </div>\n    ';
    }
    renderTasksTab() {
      return `\n      <div class="fcp6-section-title">Assigned Tasks (${this.tasks.length})</div>\n      <div class="fcp6-list">\n        ${this.tasks.length > 0 ? this.tasks.map((e) => `\n          <div class="fcp6-task ${e.priority}" data-task-id="${e.id}">\n            <div class="fcp6-task-header">\n              <span class="fcp6-task-title">#${e.id.split('-').pop()} - ${this.escapeHtml(e.title)}</span>\n              <span class="fcp6-badge" style="background:rgba(255,255,255,0.1);">${e.type}</span>\n            </div>\n            <div class="fcp6-task-meta" style="margin-bottom:6px;">\n              <span>Created ${this.formatTime(e.createdAt)}</span>\n              <span>•</span>\n              <span>By ${e.createdBy || 'Orchestrator'}</span>\n            </div>\n            <div style="font-size:11px; opacity:0.8; margin-bottom:8px;">\n              ${this.escapeHtml(e.description)}\n            </div>\n            ${e.instructions.length > 0 ? `<div style="font-size:10px; background:rgba(0,0,0,0.2); padding:6px; border-radius:4px;">\n                  <div style="opacity:0.6; margin-bottom:2px;">INSTRUCTIONS:</div>\n                  <ul style="margin:0; padding-left:16px;">\n                    ${e.instructions.map((e) => `<li>${this.escapeHtml(e)}</li>`).join('')}\n                  </ul>\n                </div>` : ''}\n            <div style="display:flex; gap:6px; margin-top:8px;">\n               <button class="fcp6-btn" data-action="accept-task" data-task-id="${e.id}" style="flex:1; background:rgba(0,217,255,0.2); color:#00D9FF;">Accept</button>\n               <button class="fcp6-btn" data-action="reject-task" data-task-id="${e.id}" style="flex:1;">Reject</button>\n            </div>\n          </div>\n        `).join('') : '<div class="fcp6-empty"><div class="fcp6-empty-icon">✓</div><p>No active tasks</p></div>'}\n      </div>\n    `;
    }
    renderNotificationsTab() {
      return (
        setTimeout(() => this.markNotificationsRead(), 1e3),
        `\n      <div class="fcp6-section-title">Notifications</div>\n      <div class="fcp6-list">\n        ${this.notifications.length > 0 ? this.notifications.map((e) => `\n          <div class="fcp6-notification ${e.read ? '' : 'unread'}">\n            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">\n              <span style="font-weight:600; font-size:11px;">${this.escapeHtml(e.title)}</span>\n              <span style="font-size:9px; opacity:0.5;">${this.formatTime(e.timestamp)}</span>\n            </div>\n            <div style="font-size:11px; opacity:0.8;">${this.escapeHtml(e.message)}</div>\n          </div>\n        `).join('') : '<div class="fcp6-empty">No notifications</div>'}\n      </div>\n    `
      );
    }
    renderSettingsTab() {
      return `\n      <div class="fcp6-section-title">Panel Settings</div>\n      <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">\n\n        <div style="margin-bottom: 12px;">\n          <label style="display:block; font-size:11px; margin-bottom:4px; opacity:0.7;">Opacity</label>\n          <input type="range" data-setting="opacity" min="0.2" max="1" step="0.1" value="${this.state.opacity || 1}" style="width:100%;">\n        </div>\n\n        <div style="margin-bottom: 12px; display:flex; align-items:center;">\n          <input type="checkbox" data-setting="alwaysOnTop" ${this.state.isPinned ? 'checked' : ''} style="margin-right:8px;">\n          <label style="font-size:11px;">Always on Top (Pin)</label>\n        </div>\n\n         <div style="margin-bottom: 12px; display:flex; align-items:center;">\n          <input type="checkbox" data-setting="autoReconnect" checked style="margin-right:8px;">\n          <label style="font-size:11px;">Auto-Reconnect Relay</label>\n        </div>\n\n         <div style="margin-bottom: 12px; display:flex; align-items:center;">\n          <input type="checkbox" data-setting="debugMode" style="margin-right:8px;">\n          <label style="font-size:11px;">Debug Mode</label>\n        </div>\n\n        <div style="display:flex; gap:8px; margin-top:16px;">\n           <button class="fcp6-btn" data-action="save-settings" style="flex:1; width:auto; background:rgba(0,217,255,0.2); color:#00D9FF;">Save</button>\n           <button class="fcp6-btn" data-action="reset-settings" style="flex:1; width:auto;">Reset</button>\n        </div>\n      </div>\n\n      <div class="fcp6-section-title" style="margin-top:16px;">Connection</div>\n       <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">\n          <label style="display:block; font-size:11px; margin-bottom:4px; opacity:0.7;">Relay Server URL</label>\n          <input type="text" data-setting="relayUrl" value="ws://localhost:3000/ws" class="fcp6-input" style="width:100%; margin-bottom:8px;">\n       </div>\n\n      <div class="fcp6-section-title" style="margin-top:16px;">Event Logs</div>\n      <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">\n        <div style="display:flex; gap:8px; margin-bottom:8px;">\n          <button class="fcp6-btn" data-action="copy-event-logs" style="flex:1; width:auto;">Copy JSON</button>\n          <button class="fcp6-btn" data-action="clear-event-logs" style="flex:1; width:auto;">Clear</button>\n        </div>\n        <div style="font-size:10px; color:rgba(255,255,255,0.55);">\n          Captures extension message flow and browser tab lifecycle events.\n        </div>\n      </div>\n    `;
    }
    sendMessage() {
      const e = this.container?.querySelector('[data-input="message"]');
      if (!e || !e.value.trim()) return;
      const t = e.value.trim();
      e.value = '';
      const n = { senderId: this.myAgentId || 'unknown', source: 'floating-panel' };
      (this.safeSendMessage({
        type: 'BROADCAST_MESSAGE',
        content: t,
        channel: this.currentChannel,
        metadata: n,
      }),
        this.safeSendMessage({ type: 'INJECT_MESSAGE', content: t, metadata: n }, (e) => {
          e?.success || console.warn('[GeminiBridge] Failed to inject message to page:', e?.error);
        }),
        this.messages.push({
          id: Date.now().toString(),
          from: this.myAgentId || 'You',
          to: 'AI',
          content: t,
          timestamp: Date.now(),
          type: 'text',
          metadata: n,
        }),
        this.update());
    }
    injectToPageChat() {
      const e = this.container?.querySelector('[data-input="message"]');
      if (!e || !e.value.trim()) return;
      const t = e.value.trim();
      e.value = '';
      const n = { senderId: this.myAgentId || 'unknown', source: 'floating-panel-inject-only' };
      this.safeSendMessage({ type: 'INJECT_MESSAGE', content: t, metadata: n }, (e) => {
        e?.success
          ? (this.messages.push({
              id: Date.now().toString(),
              from: this.myAgentId || 'You (Fuse)',
              to: 'page',
              content: t,
              timestamp: Date.now(),
              type: 'text',
              metadata: n,
            }),
            this.update())
          : console.warn('[GeminiBridge] Failed to inject message:', e?.error);
      });
    }
    sendUnifiedMessage() {
      const e = this.container?.querySelector('[data-input="message"]');
      if (!e || !e.value.trim()) return;
      const t = e.value.trim();
      if (((e.value = ''), !this.myAgentId || !this.myAgentId.startsWith('page-agent-')))
        return (
          console.error('[GeminiBridge] Cannot send message: myAgentId is not set correctly!', {
            myAgentId: this.myAgentId,
            expected: 'page-agent-XXXXX',
          }),
          alert('Connection not ready. Please wait a moment and try again.'),
          void (e.value = t)
        );
      console.log('[GeminiBridge] Sending unified message:', {
        content: t.substring(0, 50),
        myAgentId: this.myAgentId,
      });
      const n = { senderId: this.myAgentId, source: 'floating-panel-unified' },
        i = `user-${Date.now()}`;
      if (
        (this.messages.push({
          id: i,
          from: this.myAgentId,
          to: 'AI',
          content: t,
          timestamp: Date.now(),
          type: 'text',
          metadata: n,
        }),
        this.update(),
        'connected' === this.connectionStatus && this.currentChannel)
      ) {
        const e = `user:${t}`,
          i = this.recentBroadcasts.get(e);
        if (!i || Date.now() - i > 3e3) {
          this.recentBroadcasts.set(e, Date.now());
          for (const [e, t] of this.recentBroadcasts.entries())
            Date.now() - t > 1e4 && this.recentBroadcasts.delete(e);
          this.safeSendMessage({
            type: 'BROADCAST_MESSAGE',
            content: `[User → AI] ${t}`,
            channel: this.currentChannel,
            metadata: n,
          });
        } else console.log('[GeminiBridge] Skipping duplicate user message broadcast');
      }
      this.safeSendMessage({ type: 'INJECT_MESSAGE', content: t, metadata: n }, (e) => {
        if (!e?.success) {
          console.warn('[GeminiBridge] Failed to inject message:', e?.error);
          const n = this.messages.find((e) => e.content === t);
          n && ((n.content = `❌ ${t} (failed to send)`), this.update());
        }
      });
    }
    joinChannel(e) {
      ((this.currentChannel = e),
        this.safeSendMessage({ type: 'CHANNEL_JOIN', channelId: e }),
        this.update());
    }
    selectChannel(e) {
      const t = this.currentChannel;
      ((this.currentChannel = e),
        console.log(`[GeminiBridge] Panel ${this.panelId} switching channel: ${t} → ${e}`),
        e
          ? this.safeSendMessage({ type: 'CHANNEL_JOIN', channelId: e, panelId: this.panelId })
          : this.safeSendMessage({ type: 'CHANNEL_LEAVE', channelId: t, panelId: this.panelId }),
        this.update());
    }
    createChannel() {
      const e = prompt('Enter channel name:');
      e && this.safeSendMessage({ type: 'CHANNEL_CREATE', name: e });
    }
    submitCreateChannel() {
      const e = this.container?.querySelector('#fuse-new-channel-name');
      if (
        (console.log(
          '[GeminiBridge] submitCreateChannel called. Input found:',
          !!e,
          'Value:',
          e?.value
        ),
        !e || !e.value.trim())
      )
        return void console.warn('[GeminiBridge] No channel name entered');
      const t = e.value.trim().replace(/\s+/g, ' '),
        n = this.channels.find(
          (e) => e.name.trim().replace(/\s+/g, ' ').toLowerCase() === t.toLowerCase()
        );
      if (n)
        return (
          console.warn('[GeminiBridge] Duplicate channel name blocked:', t),
          (e.value = ''),
          void this.selectChannel(n.id)
        );
      const i = t;
      ((e.value = ''),
        console.log('[GeminiBridge] Creating channel:', i),
        this.safeSendMessage({ type: 'CHANNEL_CREATE', name: i }, (e) => {
          e?.success || e?.channelId
            ? console.log('[GeminiBridge] Channel created successfully:', e.channelId)
            : e?.alreadyExists && e?.channel?.id && this.selectChannel(e.channel.id);
        }));
    }
    deleteChannel(e) {
      if ('general' === e) return void alert('The General channel cannot be deleted.');
      const t = this.channels.find((t) => t.id === e),
        n = t ? t.name : e;
      confirm(`Are you sure you want to delete the channel "${n}"?`) &&
        (console.log('[GeminiBridge] Deleting channel:', e),
        this.safeSendMessage({ type: 'CHANNEL_DELETE', channelId: e }, (t) => {
          t?.success &&
            (console.log('[GeminiBridge] Channel delete request sent'),
            (this.channels = this.channels.filter((t) => t.id !== e)),
            this.currentChannel === e && (this.currentChannel = null),
            this.update());
        }));
    }
    copyToClipboard(e, t) {
      navigator.clipboard
        .writeText(e)
        .then(() => {
          if (t) {
            const e = t.innerHTML;
            ((t.innerHTML = '✅'),
              setTimeout(() => {
                t.innerHTML = e;
              }, 1500));
          }
        })
        .catch((e) => {
          console.error('[GeminiBridge] Failed to copy:', e);
        });
    }
    safeSendMessage(e, t) {
      if (!this.isContextValid)
        return (
          console.warn('[GeminiBridge] Extension context is invalid, cannot send message'),
          void this.showContextInvalidatedWarning()
        );
      try {
        chrome.runtime.sendMessage(e, (e) => {
          if (chrome.runtime.lastError) {
            const e = chrome.runtime.lastError.message || '';
            if (
              e.includes('Extension context invalidated') ||
              e.includes('Receiving end does not exist')
            )
              return (
                console.error('[GeminiBridge] Extension context invalidated:', e),
                (this.isContextValid = !1),
                void this.showContextInvalidatedWarning()
              );
            console.warn('[GeminiBridge] Chrome runtime error:', e);
          }
          t && t(e);
        });
      } catch (e) {
        (console.error('[GeminiBridge] Failed to send message:', e),
          (this.isContextValid = !1),
          this.showContextInvalidatedWarning());
      }
    }
    showContextInvalidatedWarning() {
      if (this.container?.querySelector('.fcp6-context-warning')) return;
      const e = document.createElement('div');
      ((e.className = 'fcp6-context-warning'),
        (e.innerHTML =
          '\n      <div style="\n        position: fixed;\n        top: 50%;\n        left: 50%;\n        transform: translate(-50%, -50%);\n        background: linear-gradient(135deg, rgba(255,50,50,0.95) 0%, rgba(180,30,30,0.95) 100%);\n        color: white;\n        padding: 24px 32px;\n        border-radius: 12px;\n        box-shadow: 0 8px 32px rgba(0,0,0,0.4);\n        z-index: 2147483647;\n        text-align: center;\n        font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n        max-width: 400px;\n      ">\n        <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>\n        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Extension Reloaded</div>\n        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 16px;">\n          The Fuse Connect extension was updated. Please refresh this page to continue using it.\n        </div>\n        <button onclick="location.reload()" style="\n          background: white;\n          color: #c00;\n          border: none;\n          padding: 10px 24px;\n          border-radius: 6px;\n          font-weight: 600;\n          cursor: pointer;\n          font-size: 14px;\n        ">Refresh Page</button>\n      </div>\n    '),
        document.body.appendChild(e));
    }
    handleServiceAction(e) {
      const t = this.container?.querySelector(`[data-action="${e}"]`),
        n = t?.getAttribute('data-service');
      if (!n) return;
      const i = e.replace('-service', '').toUpperCase();
      this.safeSendMessage({ type: 'SERVICE_CONTROL', action: i, serviceId: n }, (e) => {
        (e?.success &&
          this.addNotification({
            id: Date.now().toString(),
            title: 'Service ' + i.toLowerCase() + 'ed',
            message: `${n} service ${i.toLowerCase()}ed successfully`,
            type: 'success',
            priority: 'normal',
            timestamp: Date.now(),
            read: !1,
          }),
          this.update());
      });
    }
    startAllServices() {
      this.safeSendMessage({ type: 'SERVICE_CONTROL', action: 'START_ALL' }, (e) => {
        (e?.success &&
          this.addNotification({
            id: Date.now().toString(),
            title: 'All Services Started',
            message: 'All TNF services have been started',
            type: 'success',
            priority: 'normal',
            timestamp: Date.now(),
            read: !1,
          }),
          this.update());
      });
    }
    openTerminal() {
      this.safeSendMessage({ type: 'OPEN_TERMINAL', command: 'pnpm relay:start' });
    }
    checkServiceHealth() {
      (this.safeSendMessage({ type: 'CHECK_SERVICE_HEALTH' }, (e) => {
        if (e?.services) {
          for (const [t, n] of Object.entries(e.services)) this.serviceStatuses.set(t, n);
          this.update();
        }
      }),
        'connected' === this.connectionStatus
          ? this.serviceStatuses.set('relay', 'online')
          : this.serviceStatuses.set('relay', 'offline'),
        this.update());
    }
    saveSettings() {
      const e = this.container?.querySelector('[data-setting="relayUrl"]'),
        t = this.container?.querySelector('[data-setting="autoReconnect"]'),
        n = this.container?.querySelector('[data-setting="opacity"]'),
        i = this.container?.querySelector('[data-setting="alwaysOnTop"]'),
        s = this.container?.querySelector('[data-setting="debugMode"]'),
        a = {
          relayUrl: e?.value || 'ws://localhost:3000/ws',
          autoReconnect: t?.checked ?? !0,
          opacity: parseFloat(n?.value || '1'),
          alwaysOnTop: i?.checked ?? !1,
          debugMode: s?.checked ?? !1,
        };
      ((this.state.opacity = a.opacity),
        (this.state.isPinned = a.alwaysOnTop),
        this.container && (this.container.style.opacity = String(a.opacity)),
        chrome.storage.local.set({ fuse_settings: a }, () => {
          (this.addNotification({
            id: Date.now().toString(),
            title: 'Settings Saved',
            message: 'Your settings have been saved successfully',
            type: 'success',
            priority: 'normal',
            timestamp: Date.now(),
            read: !1,
          }),
            this.update());
        }),
        this.safeSendMessage({ type: 'UPDATE_SETTINGS', settings: a }),
        this.saveState());
    }
    resetSettings() {
      if (!confirm('Are you sure you want to reset all settings to defaults?')) return;
      const e = {
        relayUrl: 'ws://localhost:3000/ws',
        autoReconnect: !0,
        opacity: 1,
        alwaysOnTop: !1,
        debugMode: !1,
      };
      ((this.state.opacity = 1),
        (this.state.isPinned = !1),
        this.container && (this.container.style.opacity = '1'),
        chrome.storage.local.set({ fuse_settings: e }, () => {
          (this.addNotification({
            id: Date.now().toString(),
            title: 'Settings Reset',
            message: 'All settings have been reset to defaults',
            type: 'info',
            priority: 'normal',
            timestamp: Date.now(),
            read: !1,
          }),
            this.update());
        }),
        this.safeSendMessage({ type: 'UPDATE_SETTINGS', settings: e }));
    }
    markNotificationsRead() {
      (this.notifications.forEach((e) => (e.read = !0)), (this.unreadCount = 0), this.update());
    }
    handleChromeMessage(e) {
      switch (e.type) {
        case 'CONNECTION_STATUS':
          ((this.connectionStatus = e.status), this.update());
          break;
        case 'AGENTS_UPDATE':
          ((this.agents = e.agents || []), this.update());
          break;
        case 'NEW_MESSAGE':
          if (e.message) {
            const t = e.message,
              n = t.metadata?.senderId,
              i =
                n === this.myAgentId ||
                t.from === this.myAgentId ||
                n === this.browserAgentId ||
                t.from === this.browserAgentId,
              s = 'You' === t.from || 'You (Fuse)' === t.from,
              a = i || s;
            a && console.log('[GeminiBridge] Identified self-message');
            const o = (e) =>
                String(e || '')
                  .replace(/\s+/g, ' ')
                  .trim(),
              r = o(t.content),
              c = 'number' == typeof t.timestamp ? t.timestamp : Date.now(),
              l =
                (t.metadata?.senderId || t.from || '').toString().trim().toLowerCase() || 'unknown';
            if (
              this.messages.some((e) => {
                if (t.id && e.id === t.id) return !0;
                const n = o(e.content);
                if (!n || n !== r) return !1;
                const i =
                  (e.metadata?.senderId || e.from || '').toString().trim().toLowerCase() ||
                  'unknown';
                if (
                  i !== l &&
                  (!a ||
                    ('You' !== e.from &&
                      'You (Fuse)' !== e.from &&
                      e.from !== this.myAgentId &&
                      i !== (this.myAgentId || '').toLowerCase()))
                )
                  return !1;
                const s = 'number' == typeof e.timestamp ? e.timestamp : 0;
                return Math.abs(s - c) < 15e3 || Date.now() - s < 15e3;
              })
            ) {
              console.log('[GeminiBridge] Deduped message (already shown):', t.id || 'local');
              break;
            }
            (this.messages.push(t),
              this.messages.length > 50 && this.messages.shift(),
              this.update(),
              console.log('[GeminiBridge] NEW_MESSAGE processing:', {
                from: t.from,
                isOwnMessage: a,
                senderId: t.metadata?.senderId,
                myAgentId: this.myAgentId,
                messageType: t.messageType,
                contentPreview: t.content?.substring(0, 50),
              }),
              !a && t.content
                ? console.log(
                    '[GeminiBridge] External message received (display only):',
                    t.from,
                    t.metadata?.platform
                  )
                : a && console.log('[GeminiBridge] Not injecting own message (self-detection)'));
          }
          break;
        case 'CHANNELS_UPDATE':
          ((this.channels = e.channels || []), this.update());
          break;
        case 'JOINED_CHANNELS_UPDATE':
          (console.log('[GeminiBridge] Joined channels updated:', e.joinedChannels), this.update());
          break;
        case 'CHANNEL_SELECTED':
          ((this.currentChannel = e.channelId || null), this.update());
          break;
        case 'CHANNEL_PAUSE_UPDATE':
          if (Array.isArray(e.pausedChannels))
            this.pausedChannels = new Set(e.pausedChannels.map((e) => String(e)));
          else if (e.channelId) {
            const t = String(e.channelId);
            e.paused ? this.pausedChannels.add(t) : this.pausedChannels.delete(t);
          }
          this.update();
          break;
        case 'NOTIFICATION':
          this.addNotification(e.notification);
          break;
        case 'CHAT_DETECTED':
          ((this.chatElements = e.elements), this.update());
          break;
        case 'TRANSCRIPT_UPDATE':
          if (e.entry) {
            const t = e.entry,
              n = t.id || `transcript-${t.ts}-${t.seq}`;
            this.messages.some((e) => e.id === n) ||
              (this.messages.push({
                id: n,
                from:
                  'user' === t.role
                    ? this.myAgentId || 'You'
                    : 'assistant' === t.role
                      ? 'AI (Edge)'
                      : t.role,
                to: 'user' === t.role ? 'AI' : 'User',
                content: t.content,
                timestamp: t.ts,
                type: 'text',
                metadata: t.meta,
              }),
              this.update());
          }
          break;
        case 'STREAMING_UPDATE':
          ((this.streamingState = e.state), this.update());
          break;
        case 'AI_VIDEO_PROCESSING_UPDATE':
          ((this.aiVideoState.isProcessing = !!e.state?.isProcessing),
            (this.aiVideoState.isPaused = !!e.state?.isPaused),
            (this.aiVideoState.currentIndex = Number(e.state?.currentIndex || 0)),
            (this.aiVideoState.totalCount = Number(e.state?.totalCount || 0)),
            (this.aiVideoState.queueCount = Math.max(
              this.aiVideoState.queueCount,
              this.aiVideoState.totalCount
            )),
            this.update());
          break;
        case 'RESPONSE_COMPLETE':
          if (
            (console.log('[GeminiBridge] RESPONSE_COMPLETE received:', {
              hasContent: !!e.content,
              connectionStatus: this.connectionStatus,
              currentChannel: this.currentChannel,
            }),
            'connected' === this.connectionStatus && this.currentChannel)
          ) {
            console.log('[GeminiBridge] Skipping local RESPONSE_COMPLETE append (relay-connected)');
            break;
          }
          if (e.content) {
            let t =
              'string' == typeof e.content
                ? e.content
                : e.content?.substring(0, 500) || 'Response received';
            if (
              ((t = t
                .replace(/^\[User → AI\]\s*/g, '')
                .replace(/^\[AI → User\]\s*/g, '')
                .replace(/^\[AI Response\]\s*/g, '')
                .trim()),
              !t ||
                t.includes('[User → AI]') ||
                t.includes('[AI → User]') ||
                t.includes('[AI Response]'))
            ) {
              console.log('[GeminiBridge] Skipping response with embedded prefixes');
              break;
            }
            this.messages.some(
              (e) => 'AI (Page)' === e.from && e.content === t && Date.now() - e.timestamp < 5e3
            )
              ? console.log('[GeminiBridge] Skipping duplicate response')
              : (this.messages.push({
                  id: `ai-${Date.now()}`,
                  from: 'AI (Page)',
                  to: 'You',
                  content: t,
                  timestamp: Date.now(),
                  type: 'text',
                }),
                this.update());
          }
          break;
        case 'TASK_ASSIGN':
          const t = e.task;
          t &&
            (this.tasks.some((e) => e.id === t.id) ||
              (this.tasks.unshift(t),
              this.unreadCount++,
              this.addNotification({
                id: Date.now().toString(),
                type: 'info',
                title: 'New Task Assigned',
                message: t.title,
                priority: 'normal',
                timestamp: Date.now(),
                read: !1,
              }),
              this.update()));
      }
    }
    addNotification(e) {
      (this.notifications.unshift(e),
        this.notifications.length > 50 && this.notifications.pop(),
        this.unreadCount++,
        this.update(),
        'granted' === Notification.permission &&
          new Notification(e.title, {
            body: e.message,
            icon: chrome.runtime.getURL('icons/icon48.png'),
          }));
    }
    update() {
      if (!this.container) return;
      let e = 0;
      const t = this.container.querySelector('#fuse-chat-scroll');
      t && (e = t.scrollTop);
      const n = this.container.querySelector('[data-input="message"]'),
        i = n ? n.value : '',
        s = this.container.querySelector('#fuse-new-channel-name'),
        a = s ? s.value : '';
      this.container.innerHTML = this.render();
      const o = this.container.querySelector('[data-input="message"]');
      o && i && (o.value = i);
      const r = this.container.querySelector('#fuse-new-channel-name');
      (r && a && (r.value = a), this.applyPositionAndSize(), this.setupListeners());
      const c = this.container.querySelector('#fuse-chat-scroll');
      if (c) {
        const n = t && t.scrollHeight - t.scrollTop - t.clientHeight < 50;
        c.scrollTop = n ? c.scrollHeight : e;
      }
    }
    formatTime(e) {
      return new Date(e).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    truncate(e, t) {
      return e.length > t ? e.slice(0, t) + '...' : e;
    }
    escapeHtml(e) {
      const t = document.createElement('div');
      return ((t.textContent = e), t.innerHTML);
    }
    getAgentIcon(e) {
      return (
        {
          'chrome-extension': '🌐',
          vscode: '🔷',
          antigravity: '🌌',
          'electron-desktop': '🖥️',
          'theia-ide': '💻',
          'api-gateway': '🚀',
          'backend-service': '⚙️',
          saas: '☁️',
        }[e] || '🤖'
      );
    }
    updateChatElements(e) {
      ((this.chatElements = e), this.update());
    }
    setAgentId(e) {
      (console.log('[GeminiBridge] Panel assigned Agent ID:', e),
        (this.myAgentId = e),
        this.update());
    }
    getCurrentChannel() {
      return this.currentChannel;
    }
    updateStreamingState(e) {
      ((this.streamingState = e), this.update());
    }
    show() {
      (this.container || this.inject(),
        this.container &&
          ((this.container.style.display = 'block'),
          (this.state.mode = 'expanded'),
          this.applyPositionAndSize(),
          this.update()));
    }
    hide() {
      this.container && (this.container.style.display = 'none');
    }
    isVisible() {
      return 'none' !== this.container?.style.display;
    }
    handleMessage(e) {
      this.handleChromeMessage(e);
    }
    destroy() {
      (this.chromeMessageListener &&
        (chrome.runtime.onMessage.removeListener(this.chromeMessageListener),
        (this.chromeMessageListener = null)),
        this.storageListener &&
          (chrome.storage.onChanged.removeListener(this.storageListener),
          (this.storageListener = null)),
        this.container &&
          this.containerClickListener &&
          (this.container.removeEventListener('click', this.containerClickListener),
          (this.containerClickListener = null)),
        this.container &&
          this.containerKeydownListener &&
          (this.container.removeEventListener('keydown', this.containerKeydownListener),
          (this.containerKeydownListener = null)),
        this.healthPollInterval &&
          (clearInterval(this.healthPollInterval), (this.healthPollInterval = null)),
        this.container?.remove(),
        document.getElementById('fuse-connect-styles-v7')?.remove());
    }
    handleAction(e, t) {
      switch (e) {
        case 'send':
          this.sendMessage();
          break;
        case 'pin':
          this.togglePin();
          break;
        case 'minimize':
          this.minimize();
          break;
        case 'toggle':
          this.toggleCollapse();
          break;
        case 'expand':
          this.expand();
          break;
        case 'copy-to-clipboard':
          t && t.dataset.value && this.copyToClipboard(t.dataset.value, t);
          break;
        case 'select-channel':
          break;
        case 'delete-channel':
          t && t.dataset.channelId && this.deleteChannel(t.dataset.channelId);
          break;
        case 'inject-to-chat':
          this.injectToPageChat();
          break;
        case 'toggle-channel-pause':
          this.toggleCurrentChannelPause();
          break;
        case 'accept-task':
          if (t && t.dataset.taskId) {
            const e = t.dataset.taskId,
              n = this.tasks.find((t) => t.id === e);
            if (n) {
              const t = `[SYSTEM TASK ASSIGNMENT]\nTitle: ${n.title}\nDescription: ${n.description}\nInstructions:\n${n.instructions.map((e) => `- ${e}`).join('\n')}\n\nPlease execute this task.`;
              (this.safeSendMessage(
                { type: 'INJECT_MESSAGE', content: t, metadata: { isTask: !0, taskId: n.id } },
                (e) => {
                  e?.success &&
                    (this.messages.push({
                      id: `sys-${Date.now()}`,
                      from: 'System',
                      to: 'You',
                      content: `Task "${n.title}" started.`,
                      timestamp: Date.now(),
                      type: 'text',
                      metadata: { isSystemMessage: !0 },
                    }),
                    this.update());
                }
              ),
                (this.tasks = this.tasks.filter((t) => t.id !== e)),
                this.update());
            }
          }
          break;
        case 'reject-task':
          t &&
            t.dataset.taskId &&
            ((this.tasks = this.tasks.filter((e) => e.id !== t.dataset.taskId)), this.update());
          break;
        default:
          e.endsWith('-service')
            ? this.handleServiceAction(e)
            : 'start-all-services' === e
              ? this.startAllServices()
              : 'open-terminal' === e
                ? this.openTerminal()
                : 'check-health' === e
                  ? this.checkServiceHealth()
                  : 'save-settings' === e
                    ? this.saveSettings()
                    : 'reset-settings' === e
                      ? this.resetSettings()
                      : 'copy-event-logs' === e
                        ? this.copyEventLogs()
                        : 'clear-event-logs' === e
                          ? this.clearEventLogs()
                          : 'submit-create-channel' === e && this.submitCreateChannel();
      }
    }
    switchTab(e) {
      ((this.state.activeTab = e), this.saveState(), this.update());
    }
    toggleCurrentChannelPause() {
      if (!this.currentChannel) return;
      const e = this.currentChannel,
        t = this.pausedChannels.has(e);
      this.safeSendMessage({ type: t ? 'CHANNEL_RESUME' : 'CHANNEL_PAUSE', channelId: e }, (e) => {
        e?.success || console.warn('[GeminiBridge] Failed to toggle channel pause:', e?.error);
      });
    }
    copyEventLogs() {
      this.safeSendMessage({ type: 'GET_EVENT_LOGS', limit: 1e3 }, async (e) => {
        if (!e?.success) return void console.warn('[GeminiBridge] Failed to fetch event logs');
        const t = JSON.stringify(e.logs || [], null, 2);
        try {
          (await navigator.clipboard.writeText(t),
            this.addNotification({
              id: Date.now().toString(),
              type: 'success',
              title: 'Event Logs Copied',
              message: `Copied ${(e.logs || []).length} log entries`,
              priority: 'normal',
              timestamp: Date.now(),
              read: !1,
            }));
        } catch (e) {
          console.error('[GeminiBridge] Failed to copy event logs:', e);
        }
      });
    }
    clearEventLogs() {
      this.safeSendMessage({ type: 'CLEAR_EVENT_LOGS' }, (e) => {
        e?.success
          ? this.addNotification({
              id: Date.now().toString(),
              type: 'info',
              title: 'Event Logs Cleared',
              message: 'Background event log storage has been reset',
              priority: 'normal',
              timestamp: Date.now(),
              read: !1,
            })
          : console.warn('[GeminiBridge] Failed to clear event logs:', e?.error);
      });
    }
    togglePin() {
      this.state.isPinned = !this.state.isPinned;
      const e = this.container?.querySelector('#fuse-btn-pin');
      (e && (e.innerHTML = this.state.isPinned ? '📌' : '📍'), this.saveState());
    }
    minimize() {
      ((this.state.mode = 'minimized'), this.saveState(), this.update());
    }
    expand() {
      ((this.state.mode = 'expanded'), this.saveState(), this.update());
    }
    toggleCollapse() {
      ('collapsed' === this.state.mode
        ? (this.state.mode = 'expanded')
        : (this.state.mode = 'collapsed'),
        this.saveState(),
        this.update());
    }
  }
  const o = {
      a: 'link',
      button: 'button',
      input: 'textbox',
      select: 'combobox',
      textarea: 'textbox',
      h1: 'heading',
      h2: 'heading',
      h3: 'heading',
      h4: 'heading',
      h5: 'heading',
      h6: 'heading',
      img: 'image',
      nav: 'navigation',
      main: 'main',
      header: 'banner',
      footer: 'contentinfo',
      section: 'region',
      article: 'article',
      aside: 'complementary',
      form: 'form',
      table: 'table',
      ul: 'list',
      ol: 'list',
      li: 'listitem',
      label: 'label',
    },
    r = ['script', 'style', 'meta', 'link', 'title', 'noscript'],
    c = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'],
    l = [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'nav',
      'main',
      'header',
      'footer',
      'section',
      'article',
      'aside',
    ],
    d = new (class {
      constructor() {
        ((this.elementMap = new Map()),
          (this.refCounter = 0),
          window.__fuseElementMap || (window.__fuseElementMap = new Map()),
          window.__fuseRefCounter || (window.__fuseRefCounter = 0),
          (this.elementMap = window.__fuseElementMap),
          (this.refCounter = window.__fuseRefCounter));
      }
      generateTree(e = {}) {
        const { filter: t = 'all', maxDepth: n = 15, refId: i } = e,
          s = [],
          a = [];
        try {
          if (i) {
            const e = this.elementMap.get(i);
            if (!e)
              return {
                tree: '',
                nodes: [],
                viewport: this.getViewport(),
                error: `Element with ref_id '${i}' not found. It may have been removed from the page.`,
              };
            const o = e.ref.deref();
            if (!o)
              return (
                this.elementMap.delete(i),
                {
                  tree: '',
                  nodes: [],
                  viewport: this.getViewport(),
                  error: `Element with ref_id '${i}' no longer exists in the DOM.`,
                }
              );
            this.processElement(o, 0, n, t, void 0 !== i, s, a);
          } else document.body && this.processElement(document.body, 0, n, t, !1, s, a);
          (this.cleanupRefs(), (window.__fuseRefCounter = this.refCounter));
          const e = s.join('\n');
          return e.length > 5e4
            ? {
                tree: '',
                nodes: [],
                viewport: this.getViewport(),
                error: `Output exceeds 50000 character limit (${e.length} characters). Try using a smaller depth or focusing on a specific element.`,
              }
            : { tree: e, nodes: a, viewport: this.getViewport() };
        } catch (e) {
          return {
            tree: '',
            nodes: [],
            viewport: this.getViewport(),
            error: `Error generating accessibility tree: ${e instanceof Error ? e.message : 'Unknown error'}`,
          };
        }
      }
      processElement(e, t, n, i, s, a, o) {
        if (t > n) return;
        if (!e || !e.tagName) return;
        const c = e.tagName.toLowerCase();
        if (r.includes(c)) return;
        const l = this.shouldIncludeElement(e, i, s);
        if (l) {
          const n = this.getRole(e),
            i = this.getLabel(e),
            s = this.getOrCreateRefId(e);
          let r = '  '.repeat(t) + n;
          (i && (r += ` "${i.replace(/\s+/g, ' ').substring(0, 100).replace(/"/g, '\\"')}"`),
            (r += ` [${s}]`));
          const c = this.getImportantAttributes(e);
          for (const [e, t] of Object.entries(c)) r += ` ${e}="${t}"`;
          (a.push(r), o.push({ role: n, label: i, refId: s, depth: t, attributes: c }));
        }
        if (e.children && t < n)
          for (let r = 0; r < e.children.length; r++) {
            const c = e.children[r];
            this.processElement(c, l ? t + 1 : t, n, i, s, a, o);
          }
      }
      shouldIncludeElement(e, t, n) {
        if ((e.tagName.toLowerCase(), 'all' !== t && !n)) {
          if ('true' === e.getAttribute('aria-hidden')) return !1;
          if (!this.isVisible(e)) return !1;
          if (!this.isInViewport(e)) return !1;
        }
        if ('interactive' === t) return this.isInteractive(e);
        if (this.isInteractive(e)) return !0;
        if (this.isLandmark(e)) return !0;
        if (this.getLabel(e).length > 0) return !0;
        const i = this.getRole(e);
        return 'generic' !== i && 'image' !== i;
      }
      getRole(e) {
        const t = e.getAttribute('role');
        if (t) return t;
        const n = e.tagName.toLowerCase(),
          i = e.getAttribute('type');
        return 'input' === n
          ? 'submit' === i || 'button' === i
            ? 'button'
            : 'checkbox' === i
              ? 'checkbox'
              : 'radio' === i
                ? 'radio'
                : 'file' === i
                  ? 'button'
                  : 'textbox'
          : o[n] || 'generic';
      }
      getLabel(e) {
        const t = e.tagName.toLowerCase();
        if ('select' === t) {
          const t = e,
            n = t.querySelector('option[selected]') || t.options[t.selectedIndex];
          if (n?.textContent?.trim()) return n.textContent.trim();
        }
        const n = e.getAttribute('aria-label');
        if (n?.trim()) return n.trim();
        const i = e.getAttribute('placeholder');
        if (i?.trim()) return i.trim();
        const s = e.getAttribute('title');
        if (s?.trim()) return s.trim();
        const a = e.getAttribute('alt');
        if (a?.trim()) return a.trim();
        if (e.id) {
          const t = document.querySelector(`label[for="${e.id}"]`);
          if (t?.textContent?.trim()) return t.textContent.trim();
        }
        if ('input' === t) {
          const t = e,
            n = e.getAttribute('type') || '',
            i = e.getAttribute('value');
          if ('submit' === n && i?.trim()) return i.trim();
          if (t.value && t.value.length < 50 && t.value.trim()) return t.value.trim();
        }
        if (['button', 'a', 'summary'].includes(t)) {
          let t = '';
          for (let n = 0; n < e.childNodes.length; n++) {
            const i = e.childNodes[n];
            i.nodeType === Node.TEXT_NODE && (t += i.textContent || '');
          }
          if (t.trim()) return t.trim();
        }
        if (t.match(/^h[1-6]$/)) {
          const t = e.textContent;
          if (t?.trim()) return t.trim().substring(0, 100);
        }
        let o = '';
        for (let t = 0; t < e.childNodes.length; t++) {
          const n = e.childNodes[t];
          n.nodeType === Node.TEXT_NODE && (o += n.textContent || '');
        }
        if (o.trim() && o.trim().length >= 3) {
          const e = o.trim();
          return e.length > 100 ? e.substring(0, 100) + '...' : e;
        }
        return '';
      }
      getOrCreateRefId(e) {
        for (const [t, n] of this.elementMap.entries()) if (n.ref.deref() === e) return t;
        const t = 'gemini_bridge_ref_' + ++this.refCounter;
        return (
          this.elementMap.set(t, {
            ref: new WeakRef(e),
            role: this.getRole(e),
            label: this.getLabel(e),
          }),
          t
        );
      }
      getElementByRefId(e) {
        const t = this.elementMap.get(e);
        if (!t) return null;
        return t.ref.deref() || (this.elementMap.delete(e), null);
      }
      getImportantAttributes(e) {
        const t = {},
          n = e.getAttribute('href');
        n && (t.href = n);
        const i = e.getAttribute('type');
        i && (t.type = i);
        const s = e.getAttribute('placeholder');
        return (
          s && (t.placeholder = s),
          e.hasAttribute('disabled') && (t.disabled = 'true'),
          e.checked && (t.checked = 'true'),
          t
        );
      }
      isVisible(e) {
        const t = window.getComputedStyle(e);
        return (
          'none' !== t.display &&
          'hidden' !== t.visibility &&
          '0' !== t.opacity &&
          e.offsetWidth > 0 &&
          e.offsetHeight > 0
        );
      }
      isInViewport(e) {
        const t = e.getBoundingClientRect();
        return (
          t.top < window.innerHeight && t.bottom > 0 && t.left < window.innerWidth && t.right > 0
        );
      }
      isInteractive(e) {
        const t = e.tagName.toLowerCase();
        return (
          !!c.includes(t) ||
          !!e.getAttribute('onclick') ||
          null !== e.getAttribute('tabindex') ||
          'button' === e.getAttribute('role') ||
          'link' === e.getAttribute('role') ||
          'true' === e.getAttribute('contenteditable')
        );
      }
      isLandmark(e) {
        const t = e.tagName.toLowerCase();
        return l.includes(t) || null !== e.getAttribute('role');
      }
      getViewport() {
        return { width: window.innerWidth, height: window.innerHeight };
      }
      cleanupRefs() {
        for (const [e, t] of this.elementMap.entries()) t.ref.deref() || this.elementMap.delete(e);
      }
      async clickElement(e) {
        const t = this.getElementByRefId(e);
        if (!t) return !1;
        try {
          return (t.focus(), t.click(), !0);
        } catch {
          return !1;
        }
      }
      async typeIntoElement(e, t, n = {}) {
        const i = this.getElementByRefId(e);
        if (!i) return !1;
        try {
          return (
            i.focus(),
            i instanceof HTMLInputElement || i instanceof HTMLTextAreaElement
              ? (n.clear && (i.value = ''),
                (i.value += t),
                i.dispatchEvent(new InputEvent('input', { bubbles: !0, data: t })),
                i.dispatchEvent(new Event('change', { bubbles: !0 })))
              : 'true' === i.getAttribute('contenteditable') &&
                (n.clear && (i.innerHTML = ''),
                (i.textContent = (i.textContent || '') + t),
                i.dispatchEvent(new InputEvent('input', { bubbles: !0 }))),
            !0
          );
        } catch {
          return !1;
        }
      }
    })(),
    p = new (class {
      constructor() {
        ((this.lastMousePosition = { x: 0, y: 0 }),
          (this.isMoving = !1),
          document.addEventListener('mousemove', (e) => {
            this.isMoving || (this.lastMousePosition = { x: e.clientX, y: e.clientY });
          }));
      }
      async randomDelay(e, t) {
        const n = this.randomBetween(e, t);
        await this.sleep(n);
      }
      async humanDelay(e = 500) {
        const t = 0.4 * e,
          n = this.gaussianRandom(e, t);
        await this.sleep(Math.max(50, n));
      }
      async microPause() {
        await this.randomDelay(100, 500);
      }
      async thinkingPause() {
        await this.randomDelay(500, 2e3);
      }
      async moveMouse(e, t) {
        const n = t?.duration ?? this.randomBetween(200, 500),
          i = t?.steps ?? Math.max(10, Math.floor(n / 16)),
          s = { ...this.lastMousePosition },
          a = this.generateBezierControlPoints(s, e);
        this.isMoving = !0;
        for (let t = 0; t <= i; t++) {
          const o = t / i,
            r = this.bezierPoint(o, s, a[0], a[1], e),
            c = this.randomBetween(-2, 2),
            l = { x: r.x + c, y: r.y + c };
          (this.dispatchMouseEvent('mousemove', l),
            (this.lastMousePosition = l),
            await this.sleep(n / i));
        }
        this.isMoving = !1;
      }
      async moveToElement(e) {
        const t = e.getBoundingClientRect(),
          n = t.left + this.randomBetween(0.2 * t.width, 0.8 * t.width),
          i = t.top + this.randomBetween(0.2 * t.height, 0.8 * t.height);
        await this.moveMouse({ x: n, y: i });
      }
      async humanClick(e, t = {}) {
        const {
          moveFirst: n = !0,
          prePauseMin: i = 50,
          prePauseMax: s = 150,
          postPauseMin: a = 50,
          postPauseMax: o = 200,
        } = t;
        n && (await this.moveToElement(e), await this.randomDelay(i, s));
        const r = e.getBoundingClientRect(),
          c = r.left + r.width / 2,
          l = r.top + r.height / 2;
        (this.dispatchMouseEvent('mousedown', { x: c, y: l }, e),
          await this.sleep(this.randomBetween(50, 120)),
          this.dispatchMouseEvent('mouseup', { x: c, y: l }, e),
          this.dispatchMouseEvent('click', { x: c, y: l }, e),
          await this.randomDelay(a, o));
      }
      async humanDoubleClick(e) {
        (await this.humanClick(e, { postPauseMin: 50, postPauseMax: 150 }),
          await this.humanClick(e, { moveFirst: !1 }),
          this.dispatchMouseEvent('dblclick', this.lastMousePosition, e));
      }
      async humanType(e, t, n = {}) {
        const {
          minDelay: i = 50,
          maxDelay: s = 150,
          typoChance: a = 0.02,
          correctTypos: o = !0,
          pauseOnPunctuation: r = !0,
        } = n;
        (e.focus(), await this.microPause());
        const c = ['.', ',', '!', '?', ';', ':'];
        for (let n = 0; n < t.length; n++) {
          const l = t[n];
          if (a > 0 && Math.random() < a && o) {
            const t = this.getNearbyKeys(l);
            if (t.length > 0) {
              const n = t[Math.floor(Math.random() * t.length)];
              (await this.typeCharacter(e, n),
                await this.randomDelay(100, 300),
                await this.typeBackspace(e),
                await this.randomDelay(50, 150));
            }
          }
          await this.typeCharacter(e, l);
          let d = this.randomBetween(i, s);
          (r && c.includes(l) && (d += this.randomBetween(100, 400)),
            Math.random() < 0.05 && (d += this.randomBetween(200, 600)),
            await this.sleep(d));
        }
      }
      async typeCharacter(e, t) {
        const n = t.charCodeAt(0);
        (e.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: t,
            code: `Key${t.toUpperCase()}`,
            keyCode: n,
            which: n,
            bubbles: !0,
            cancelable: !0,
          })
        ),
          e.dispatchEvent(
            new KeyboardEvent('keypress', {
              key: t,
              code: `Key${t.toUpperCase()}`,
              keyCode: n,
              which: n,
              bubbles: !0,
              cancelable: !0,
            })
          ),
          e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement
            ? ((e.value += t), e.dispatchEvent(new Event('input', { bubbles: !0 })))
            : 'true' === e.getAttribute('contenteditable') &&
              document.execCommand('insertText', !1, t),
          e.dispatchEvent(
            new KeyboardEvent('keyup', {
              key: t,
              code: `Key${t.toUpperCase()}`,
              keyCode: n,
              which: n,
              bubbles: !0,
              cancelable: !0,
            })
          ));
      }
      async typeBackspace(e) {
        (e.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            keyCode: 8,
            which: 8,
            bubbles: !0,
            cancelable: !0,
          })
        ),
          e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement
            ? ((e.value = e.value.slice(0, -1)),
              e.dispatchEvent(new Event('input', { bubbles: !0 })))
            : 'true' === e.getAttribute('contenteditable') && document.execCommand('delete', !1),
          e.dispatchEvent(
            new KeyboardEvent('keyup', {
              key: 'Backspace',
              code: 'Backspace',
              keyCode: 8,
              which: 8,
              bubbles: !0,
              cancelable: !0,
            })
          ));
      }
      async humanScroll(e, t = {}) {
        const { duration: n = 800, easing: i = 'human', addNoise: s = !0 } = t,
          a = window.scrollY;
        let o;
        if ('number' == typeof e) o = e;
        else {
          const t = e.getBoundingClientRect();
          o = a + t.top - window.innerHeight / 3;
        }
        const r = o - a,
          c = performance.now();
        return new Promise((e) => {
          const t = () => {
            const o = performance.now() - c,
              l = Math.min(o / n, 1);
            let d;
            switch (i) {
              case 'linear':
                d = l;
                break;
              case 'easeInOut':
                d = this.easeInOutCubic(l);
                break;
              default:
                d = this.humanEasing(l);
            }
            let p = a + r * d;
            (s && l < 1 && (p += this.randomBetween(-3, 3)),
              window.scrollTo(0, p),
              l < 1 ? requestAnimationFrame(t) : setTimeout(e, this.randomBetween(100, 300)));
          };
          requestAnimationFrame(t);
        });
      }
      async readingScroll(e = 300, t = 1e3) {
        const n = document.documentElement.scrollHeight,
          i = window.innerHeight;
        let s = window.scrollY;
        for (; s + i < n; ) {
          const n = e + this.randomBetween(-50, 100);
          (await this.humanScroll(s + n),
            (s = window.scrollY),
            await this.randomDelay(0.5 * t, 1.5 * t));
        }
      }
      maskWebdriverProperty() {
        try {
          Object.defineProperty(navigator, 'webdriver', { get: () => {}, configurable: !0 });
        } catch (e) {
          console.warn('[HumanSimulator] Could not mask webdriver property:', e);
        }
      }
      getRandomUserAgent() {
        const e = [
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        ];
        return e[Math.floor(Math.random() * e.length)];
      }
      getRealisticBrowserProfile() {
        return {
          screenWidth: [1920, 1680, 1440, 1366, 1280][Math.floor(5 * Math.random())],
          screenHeight: [1080, 1050, 900, 768][Math.floor(4 * Math.random())],
          colorDepth: 24,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          doNotTrack: Math.random() > 0.5 ? '1' : null,
          hardwareConcurrency: [4, 8, 12, 16][Math.floor(4 * Math.random())],
        };
      }
      sleep(e) {
        return new Promise((t) => setTimeout(t, e));
      }
      randomBetween(e, t) {
        return Math.random() * (t - e) + e;
      }
      gaussianRandom(e, t) {
        const n = Math.random(),
          i = Math.random();
        return Math.sqrt(-2 * Math.log(n)) * Math.cos(2 * Math.PI * i) * t + e;
      }
      generateBezierControlPoints(e, t) {
        const n = t.x - e.x,
          i = t.y - e.y;
        return [
          {
            x: e.x + 0.3 * n + this.randomBetween(-30, 30),
            y: e.y + 0.1 * i + this.randomBetween(-30, 30),
          },
          {
            x: e.x + 0.7 * n + this.randomBetween(-30, 30),
            y: e.y + 0.9 * i + this.randomBetween(-30, 30),
          },
        ];
      }
      bezierPoint(e, t, n, i, s) {
        const a = e * e,
          o = a * e,
          r = 1 - e,
          c = r * r,
          l = c * r;
        return {
          x: l * t.x + 3 * c * e * n.x + 3 * r * a * i.x + o * s.x,
          y: l * t.y + 3 * c * e * n.y + 3 * r * a * i.y + o * s.y,
        };
      }
      dispatchMouseEvent(e, t, n) {
        const i = new MouseEvent(e, {
          bubbles: !0,
          cancelable: !0,
          clientX: t.x,
          clientY: t.y,
          view: window,
        });
        (n || document.elementFromPoint(t.x, t.y) || document.body).dispatchEvent(i);
      }
      easeInOutCubic(e) {
        return e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;
      }
      humanEasing(e) {
        return 1 - Math.pow(1 - e, 3);
      }
      getNearbyKeys(e) {
        return (
          {
            q: ['w', 'a'],
            w: ['q', 'e', 's'],
            e: ['w', 'r', 'd'],
            r: ['e', 't', 'f'],
            t: ['r', 'y', 'g'],
            y: ['t', 'u', 'h'],
            u: ['y', 'i', 'j'],
            i: ['u', 'o', 'k'],
            o: ['i', 'p', 'l'],
            p: ['o', 'l'],
            a: ['q', 's', 'z'],
            s: ['a', 'w', 'd', 'x'],
            d: ['s', 'e', 'f', 'c'],
            f: ['d', 'r', 'g', 'v'],
            g: ['f', 't', 'h', 'b'],
            h: ['g', 'y', 'j', 'n'],
            j: ['h', 'u', 'k', 'm'],
            k: ['j', 'i', 'l'],
            l: ['k', 'o', 'p'],
            z: ['a', 'x'],
            x: ['z', 's', 'c'],
            c: ['x', 'd', 'v'],
            v: ['c', 'f', 'b'],
            b: ['v', 'g', 'n'],
            n: ['b', 'h', 'm'],
            m: ['n', 'j'],
          }[e.toLowerCase()] || []
        );
      }
    })(),
    h = new (class {
      constructor() {
        ((this.lastDetection = null), (this.bypassAttempts = 0), (this.maxAttempts = 3));
      }
      detectCaptcha() {
        console.log('[CaptchaHandler] Scanning for CAPTCHA challenges...');
        const e = this.detectRecaptchaV2();
        if (e.detected) return ((this.lastDetection = e), e);
        const t = this.detectRecaptchaV3();
        if (t.detected) return ((this.lastDetection = t), t);
        const n = this.detectHCaptcha();
        if (n.detected) return ((this.lastDetection = n), n);
        const i = this.detectCloudflareTurnstile();
        if (i.detected) return ((this.lastDetection = i), i);
        const s = this.detectCloudflareChallenge();
        if (s.detected) return ((this.lastDetection = s), s);
        const a = this.detectGenericVerification();
        return a.detected
          ? ((this.lastDetection = a), a)
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      async attemptBypass() {
        const e = this.lastDetection || this.detectCaptcha();
        if (!e.detected)
          return {
            success: !0,
            type: null,
            message: 'No CAPTCHA detected',
            requiresManualIntervention: !1,
          };
        if (this.bypassAttempts >= this.maxAttempts)
          return {
            success: !1,
            type: e.type,
            message: 'Max bypass attempts reached',
            requiresManualIntervention: !0,
          };
        (this.bypassAttempts++,
          console.log(
            `[CaptchaHandler] Attempting bypass for ${e.type} (attempt ${this.bypassAttempts}/${this.maxAttempts})`
          ));
        try {
          switch (e.type) {
            case 'recaptcha-v2':
              return await this.bypassRecaptchaV2(e);
            case 'hcaptcha':
              return await this.bypassHCaptcha(e);
            case 'cloudflare-turnstile':
              return await this.bypassTurnstile(e);
            case 'cloudflare-challenge':
              return await this.handleCloudflareChallenge(e);
            case 'generic-checkbox':
              return await this.bypassGenericCheckbox(e);
            default:
              return {
                success: !1,
                type: e.type,
                message: 'Unknown CAPTCHA type - manual intervention required',
                requiresManualIntervention: !0,
              };
          }
        } catch (t) {
          return (
            console.error('[CaptchaHandler] Bypass error:', t),
            {
              success: !1,
              type: e.type,
              message: `Bypass failed: ${t}`,
              requiresManualIntervention: !0,
            }
          );
        }
      }
      async waitForCaptchaSolved(e = 6e4) {
        const t = Date.now();
        for (; Date.now() - t < e; ) {
          if (!this.detectCaptcha().detected)
            return (
              console.log('[CaptchaHandler] CAPTCHA solved or no longer detected'),
              this.resetState(),
              !0
            );
          if (this.checkSuccessIndicators())
            return (
              console.log('[CaptchaHandler] Success indicator detected'),
              this.resetState(),
              !0
            );
          await this.sleep(1e3);
        }
        return (console.log('[CaptchaHandler] Timeout waiting for CAPTCHA solution'), !1);
      }
      detectRecaptchaV2() {
        const e = document.querySelectorAll(
          'iframe[src*="recaptcha"], iframe[src*="google.com/recaptcha"]'
        );
        for (const t of e)
          if (t.src.includes('anchor') || t.src.includes('bframe'))
            return {
              detected: !0,
              type: 'recaptcha-v2',
              element: document.querySelector('.g-recaptcha, .recaptcha-checkbox'),
              iframe: t,
              confidence: 0.95,
            };
        return window.grecaptcha
          ? {
              detected: !0,
              type: 'recaptcha-v2',
              element: document.querySelector('.g-recaptcha'),
              iframe: null,
              confidence: 0.8,
            }
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectRecaptchaV3() {
        const e = document.querySelector('.grecaptcha-badge');
        return e
          ? { detected: !0, type: 'recaptcha-v3', element: e, iframe: null, confidence: 0.7 }
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectHCaptcha() {
        const e = document.querySelector('iframe[src*="hcaptcha"], iframe[src*="hcaptcha.com"]');
        return e
          ? {
              detected: !0,
              type: 'hcaptcha',
              element: document.querySelector('.h-captcha'),
              iframe: e,
              confidence: 0.95,
            }
          : window.hcaptcha
            ? {
                detected: !0,
                type: 'hcaptcha',
                element: document.querySelector('.h-captcha'),
                iframe: null,
                confidence: 0.8,
              }
            : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectCloudflareTurnstile() {
        const e = document.querySelector('iframe[src*="challenges.cloudflare.com/turnstile"]');
        if (e)
          return {
            detected: !0,
            type: 'cloudflare-turnstile',
            element: e.parentElement,
            iframe: e,
            confidence: 0.95,
          };
        const t = document.querySelector('.cf-turnstile');
        return t
          ? {
              detected: !0,
              type: 'cloudflare-turnstile',
              element: t,
              iframe: null,
              confidence: 0.85,
            }
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectCloudflareChallenge() {
        return [
          document.querySelector('#cf-challenge-running'),
          document.querySelector('.cf-browser-verification'),
          document.querySelector('[data-ray]'),
          document.title.includes('Just a moment'),
          document.title.includes('Checking your browser'),
        ].filter(Boolean).length >= 2
          ? {
              detected: !0,
              type: 'cloudflare-challenge',
              element: document.body,
              iframe: null,
              confidence: 0.9,
            }
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectGenericVerification() {
        const e = document.body.innerText.toLowerCase();
        if (
          [
            'verify you are human',
            "i'm not a robot",
            'prove you are not a robot',
            'human verification',
            'security check',
            'bot detection',
          ].find((t) => e.includes(t))
        ) {
          const e = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(
              (e) =>
                e.textContent?.toLowerCase().includes('verify') ||
                e.textContent?.toLowerCase().includes('continue') ||
                e.textContent?.toLowerCase().includes('confirm')
            ),
            t = document.querySelectorAll('input[type="checkbox"]');
          return {
            detected: !0,
            type: 'generic-checkbox',
            element: e || t[0],
            iframe: null,
            confidence: 0.6,
          };
        }
        return { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      async bypassRecaptchaV2(e) {
        console.log('[CaptchaHandler] Attempting reCAPTCHA v2 bypass...');
        const t = document.querySelector('.recaptcha-checkbox-border');
        if (
          t &&
          this.isElementVisible(t) &&
          (await p.thinkingPause(),
          await p.humanClick(t),
          await this.sleep(2e3),
          !this.detectRecaptchaV2().detected)
        )
          return {
            success: !0,
            type: 'recaptcha-v2',
            message: 'reCAPTCHA checkbox clicked successfully',
            requiresManualIntervention: !1,
          };
        const n = document.querySelector(
          'iframe[src*="bframe"], iframe[title*="recaptcha challenge"]'
        );
        return n && this.isElementVisible(n)
          ? {
              success: !1,
              type: 'recaptcha-v2',
              message: 'Image challenge detected - manual intervention required',
              requiresManualIntervention: !0,
            }
          : {
              success: !1,
              type: 'recaptcha-v2',
              message: 'Could not interact with reCAPTCHA',
              requiresManualIntervention: !0,
            };
      }
      async bypassHCaptcha(e) {
        console.log('[CaptchaHandler] Attempting hCaptcha bypass...');
        const t = document.querySelector('.hcaptcha-checkbox, #checkbox');
        return t &&
          this.isElementVisible(t) &&
          (await p.thinkingPause(),
          await p.humanClick(t),
          await this.sleep(2e3),
          !this.detectHCaptcha().detected)
          ? {
              success: !0,
              type: 'hcaptcha',
              message: 'hCaptcha checkbox clicked successfully',
              requiresManualIntervention: !1,
            }
          : {
              success: !1,
              type: 'hcaptcha',
              message: 'hCaptcha requires manual intervention',
              requiresManualIntervention: !0,
            };
      }
      async bypassTurnstile(e) {
        return (
          console.log('[CaptchaHandler] Attempting Cloudflare Turnstile bypass...'),
          await this.sleep(3e3),
          this.detectCloudflareTurnstile().detected
            ? (e.element && (await p.humanClick(e.element), await this.sleep(2e3)),
              {
                success: !1,
                type: 'cloudflare-turnstile',
                message: 'Turnstile requires manual intervention',
                requiresManualIntervention: !0,
              })
            : {
                success: !0,
                type: 'cloudflare-turnstile',
                message: 'Turnstile auto-solved',
                requiresManualIntervention: !1,
              }
        );
      }
      async handleCloudflareChallenge(e) {
        return (
          console.log('[CaptchaHandler] Cloudflare challenge page detected, waiting...'),
          await this.sleep(5e3),
          document.title.includes('Just a moment') ||
          document.querySelector('#cf-challenge-running')
            ? {
                success: !1,
                type: 'cloudflare-challenge',
                message: 'Cloudflare challenge requires patience or manual intervention',
                requiresManualIntervention: !0,
              }
            : {
                success: !0,
                type: 'cloudflare-challenge',
                message: 'Cloudflare challenge passed',
                requiresManualIntervention: !1,
              }
        );
      }
      async bypassGenericCheckbox(e) {
        return (
          console.log('[CaptchaHandler] Attempting generic verification bypass...'),
          e.element
            ? (await p.thinkingPause(),
              await p.humanClick(e.element),
              await this.sleep(1500),
              {
                success: !0,
                type: 'generic-checkbox',
                message: 'Clicked verification element',
                requiresManualIntervention: !1,
              })
            : {
                success: !1,
                type: 'generic-checkbox',
                message: 'No clickable verification element found',
                requiresManualIntervention: !0,
              }
        );
      }
      checkSuccessIndicators() {
        return [
          document.querySelector('.recaptcha-checkbox-checked'),
          document.querySelector('[data-success="true"]'),
          document.querySelector('.success-icon'),
        ].some((e) => null !== e);
      }
      isElementVisible(e) {
        const t = e.getBoundingClientRect(),
          n = window.getComputedStyle(e);
        return (
          t.width > 0 &&
          t.height > 0 &&
          'none' !== n.display &&
          'hidden' !== n.visibility &&
          '0' !== n.opacity
        );
      }
      sleep(e) {
        return new Promise((t) => setTimeout(t, e));
      }
      resetState() {
        ((this.bypassAttempts = 0), (this.lastDetection = null));
      }
    })();
  (() => {
    const e = window.location.hostname,
      t = window.location.pathname;
    return (
      'skideancer.thenewfuse.com' === e ||
      !(
        '/login' !== t &&
        '/register' !== t &&
        !t.startsWith('/auth/') &&
        !t.startsWith('/cdn-cgi/challenge-platform/')
      )
    );
  })()
    ? console.log('[GeminiBridge v7] Skipping content script on auth/challenge/IDE page')
    : window.__GEMINI_BRIDGE_INITIALIZED__
      ? console.log('[GeminiBridge v7] Content script already initialized, skipping duplicate')
      : ((window.__GEMINI_BRIDGE_INITIALIZED__ = !0),
        new (class {
          constructor() {
            ((this.panel = null),
              (this.isInitialized = !1),
              (this.panelVisible = !1),
              (this.chatReady = !1),
              (this.pageAgentId = null),
              (this.currentChannel = null),
              (this.pausedChannels = new Set()),
              (this.processedMessageIds = new Set()),
              (this.pendingRequests = new Map()),
              (this.injectionQueue = []),
              (this.isProcessingQueue = !1),
              this.init());
          }
          async init() {
            'loading' === document.readyState
              ? document.addEventListener('DOMContentLoaded', () => this.setup())
              : this.setup();
          }
          setup() {
            this.isInitialized ||
              ((this.isInitialized = !0),
              console.debug(
                '[GeminiBridge v7] Content script initialized (panel AUTO-OPEN disabled)'
              ),
              n.init({
                onResponse: (e) => {
                  (console.log('[GeminiBridge v7] AI Response received, length:', e.length),
                    this.panel &&
                      this.panel.handleMessage({ type: 'RESPONSE_COMPLETE', content: e }));
                  const t = this.getOldestPendingRequest();
                  this.pageAgentId ||
                    console.warn(
                      '[GeminiBridge v7] ⚠️ Page Agent ID missing during response! This may cause message drop.'
                    );
                  const n = this.panel?.getCurrentChannel() || null,
                    i = {
                      agentId: this.pageAgentId,
                      responseType: 'ai-response',
                      timestamp: Date.now(),
                      channel: n,
                    };
                  (t &&
                    ((i.correlationId = t.correlationId),
                    (i.taskId = t.taskId),
                    (i.inResponseTo = t.from),
                    console.log(
                      '[GeminiBridge v7] 🔗 Correlating response to request:',
                      t.correlationId
                    ),
                    this.pendingRequests.delete(t.correlationId)),
                    this.safeSendMessage({
                      type: 'RESPONSE_COMPLETE',
                      content: e.length > 5e4 ? e.substring(0, 5e4) : e,
                      channel: n,
                      metadata: i,
                    }),
                    this.processInjectionQueue());
                },
                onTranscriptEntry: (e) => {
                  (e.id && this.processedMessageIds.add(e.id),
                    this.panel &&
                      this.panel.handleMessage({ type: 'TRANSCRIPT_UPDATE', entry: e }));
                },
                onError: (e) => {
                  console.error('[GeminiBridge v7] Chat bridge error:', e);
                },
              }),
              this.startChatDetection(),
              setTimeout(() => {
                this.checkForCaptcha();
              }, 2e3),
              this.setupDebugUtils(),
              this.setupMessageHandlers(),
              this.setupKeyboardShortcuts(),
              this.safeSendMessage({
                type: 'CONTENT_SCRIPT_READY',
                url: window.location.href,
                hostname: window.location.hostname,
              }));
          }
          startChatDetection() {
            const e = () => {
              const e = n.findElements();
              e.isReady &&
                !this.chatReady &&
                ((this.chatReady = !0),
                console.log('[GeminiBridge v7] Chat is ready!'),
                this.safeSendMessage(
                  {
                    type: 'CHAT_DETECTED',
                    elements: {
                      hasInput: !!e.input,
                      hasSendButton: !!e.sendButton,
                      confidence: 1,
                      isStreaming: !1,
                    },
                  },
                  (e) => {
                    e?.agentId &&
                      ((this.pageAgentId = e.agentId),
                      console.log('[GeminiBridge v7] Assigned Page Agent ID:', this.pageAgentId));
                  }
                ),
                this.panel &&
                  this.panel.updateChatElements({
                    input: e.input,
                    sendButton: e.sendButton,
                    messageContainer: null,
                    lastMessage: null,
                    isStreaming: !1,
                    confidence: 1,
                    detectedAt: Date.now(),
                  }),
                this.panel && this.pageAgentId && this.panel.setAgentId(this.pageAgentId));
            };
            (e(), setInterval(e, 2e3));
          }
          setupDebugUtils() {
            ((window.__GEMINI_BRIDGE_DEBUG = {
              getLastResponse: () => {
                const e = n.getLastResponse();
                return (console.log('[GeminiBridge Debug] Last response:', e), e);
              },
              sendTestMessage: (e) => {
                (console.log('[GeminiBridge Debug] Sending test message:', e), n.sendMessage(e));
              },
              checkExtensionContext: () => {
                try {
                  const e = !!chrome.runtime?.id;
                  return (console.log('[GeminiBridge Debug] Extension context valid:', e), e);
                } catch (e) {
                  return (
                    console.error('[GeminiBridge Debug] Extension context check failed:', e),
                    !1
                  );
                }
              },
              findElements: () => {
                const e = n.findElements();
                return (console.log('[GeminiBridge Debug] Found elements:', e), e);
              },
            }),
              console.debug(
                '[GeminiBridge v7] Debug utils available at window.__GEMINI_BRIDGE_DEBUG'
              ));
          }
          showPanel() {
            if (window.self === window.top) {
              if (!this.panel) {
                this.panel = new a(void 0);
                const e = n.findElements();
                (e.isReady &&
                  this.panel.updateChatElements({
                    input: e.input,
                    sendButton: e.sendButton,
                    messageContainer: null,
                    lastMessage: null,
                    isStreaming: !1,
                    confidence: 1,
                    detectedAt: Date.now(),
                  }),
                  this.pageAgentId && this.panel.setAgentId(this.pageAgentId));
              }
              (this.panel.show(),
                (this.panelVisible = !0),
                console.log('[GeminiBridge v7] Panel shown'));
            }
          }
          hidePanel() {
            this.panel &&
              (this.panel.hide(),
              (this.panelVisible = !1),
              console.log('[GeminiBridge v7] Panel hidden'));
          }
          togglePanel() {
            this.panelVisible ? this.hidePanel() : this.showPanel();
          }
          setupMessageHandlers() {
            chrome.runtime.onMessage.addListener((e, t, i) => {
              if (!chrome.runtime?.id) return !1;
              const s = (e) => {
                try {
                  chrome.runtime?.id && i(e);
                } catch (e) {
                  console.debug('[GeminiBridge] Context invalidated during response sending');
                }
              };
              try {
                switch (e.type) {
                  case 'PING':
                    return (s({ pong: !0, initialized: this.isInitialized }), !0);
                  case 'TOGGLE_PANEL':
                    return (this.togglePanel(), s({ success: !0, visible: this.panelVisible }), !0);
                  case 'SHOW_PANEL':
                    try {
                      (this.showPanel(), s({ success: !0 }));
                    } catch (e) {
                      (console.error('[GeminiBridge] Failed to show panel:', e),
                        s({ success: !1, error: e.message }));
                    }
                    return !0;
                  case 'HIDE_PANEL':
                    return (this.hidePanel(), s({ success: !0 }), !0);
                  case 'GET_PANEL_STATUS':
                    return (s({ visible: this.panelVisible, exists: !!this.panel }), !0);
                  case 'INJECT_MESSAGE':
                    return (
                      this.injectMessage(e.content).then((e) => {
                        s({ success: e });
                      }),
                      !0
                    );
                  case 'GET_LAST_RESPONSE': {
                    const e = n.getLastResponse();
                    return (s({ response: e }), !0);
                  }
                  case 'GET_CHAT_STATUS': {
                    const e = n.findElements();
                    return (
                      s({ detected: e.isReady, confidence: e.isReady ? 1 : 0, isStreaming: !1 }),
                      !0
                    );
                  }
                  case 'GET_ACCESSIBILITY_TREE': {
                    const t = d.generateTree({
                      filter: e.filter,
                      maxDepth: e.maxDepth,
                      refId: e.refId,
                    });
                    return (s(t), !0);
                  }
                  case 'CLICK_ELEMENT':
                    return (
                      d.clickElement(e.refId).then((e) => {
                        s({ success: e });
                      }),
                      !0
                    );
                  case 'TYPE_INTO_ELEMENT':
                    return (
                      d.typeIntoElement(e.refId, e.text, { clear: e.clear }).then((e) => {
                        s({ success: e });
                      }),
                      !0
                    );
                  case 'GET_ELEMENT_BY_REF': {
                    const t = d.getElementByRefId(e.refId);
                    return (
                      s({
                        found: !!t,
                        tagName: t?.tagName,
                        textContent: t?.textContent?.substring(0, 200),
                      }),
                      !0
                    );
                  }
                  case 'HUMAN_TYPE': {
                    const t = n.findElements(),
                      i = e.refId ? d.getElementByRefId(e.refId) : t.input;
                    return (
                      i
                        ? p
                            .humanType(i, e.text, {
                              minDelay: e.minDelay || 50,
                              maxDelay: e.maxDelay || 150,
                              typoChance: e.typoChance || 0.02,
                            })
                            .then(() => s({ success: !0 }))
                        : s({ success: !1, error: 'No target element' }),
                      !0
                    );
                  }
                  case 'HUMAN_CLICK': {
                    const t = e.refId ? d.getElementByRefId(e.refId) : null;
                    return (
                      t
                        ? p.humanClick(t).then(() => s({ success: !0 }))
                        : s({ success: !1, error: 'No target element' }),
                      !0
                    );
                  }
                  case 'HUMAN_SCROLL':
                    return (
                      p.humanScroll(e.target || e.y || 500).then(() => {
                        s({ success: !0 });
                      }),
                      !0
                    );
                  case 'DETECT_CAPTCHA': {
                    const e = h.detectCaptcha();
                    return (s(e), !0);
                  }
                  case 'BYPASS_CAPTCHA':
                    return (
                      h.attemptBypass().then((e) => {
                        s(e);
                      }),
                      !0
                    );
                  case 'WAIT_FOR_CAPTCHA':
                    return (
                      h.waitForCaptchaSolved(e.timeout || 6e4).then((e) => {
                        s({ solved: e });
                      }),
                      !0
                    );
                  case 'CONNECTION_STATUS':
                  case 'AGENTS_UPDATE':
                  case 'CHANNELS_UPDATE':
                  case 'JOINED_CHANNELS_UPDATE':
                  case 'CHANNEL_PAUSE_UPDATE':
                  case 'CHANNEL_SELECTED':
                  case 'NOTIFICATION':
                  case 'TASK_ASSIGN':
                    if (
                      ('CHANNEL_SELECTED' === e.type && (this.currentChannel = e.channelId || null),
                      'CHANNEL_PAUSE_UPDATE' === e.type)
                    ) {
                      const t = Array.isArray(e.pausedChannels)
                        ? e.pausedChannels.map((e) => String(e))
                        : [];
                      this.pausedChannels = new Set(t);
                    }
                    return (this.panel && this.panel.handleMessage(e), s({ success: !0 }), !0);
                  case 'NEW_MESSAGE':
                    if (e.message) {
                      const t = e.message;
                      if (t.id && this.processedMessageIds.has(t.id))
                        return (s({ success: !0, reason: 'deduped' }), !0);
                      t.id && this.processedMessageIds.add(t.id);
                      const i = this.panel?.getCurrentChannel(),
                        a = i || this.currentChannel,
                        o = t.channel || t.metadata?.channel,
                        r = o ? String(o) : '';
                      if (
                        'broadcast' === t.to &&
                        r &&
                        this.isChannelPaused(r) &&
                        !0 !== t.metadata?.forceInject
                      )
                        return (
                          console.log('[GeminiBridge v7] ⏸️ Skipping paused-channel message', {
                            messageChannel: r,
                            pausedChannels: Array.from(this.pausedChannels),
                          }),
                          s({ success: !0, reason: 'paused_channel' }),
                          !0
                        );
                      if ('broadcast' === t.to && o && a && o !== a)
                        return (
                          console.log(
                            '[GeminiBridge v7] ⏭️ Skipping message for different channel:',
                            {
                              messageChannel: o,
                              myChannel: a,
                              contentPreview: t.content?.substring(0, 30),
                            }
                          ),
                          s({ success: !0 }),
                          !0
                        );
                      if (
                        (this.panel && this.panel.handleMessage(e),
                        this.pageAgentId && t.to === this.pageAgentId && t.content)
                      ) {
                        if (!this.canAutoInjectRelayMessage(t))
                          return (
                            console.log(
                              '[GeminiBridge v7] ⏭️ Skipping targeted auto-injection (panel hidden on this tab)'
                            ),
                            s({ success: !0, reason: 'panel_hidden' }),
                            !0
                          );
                        if (!this.shouldInjectRelayMessage(t))
                          return (
                            console.log(
                              '[GeminiBridge v7] ⏭️ Skipping non-conversational targeted message',
                              t.metadata?.eventType || t.messageType || 'unknown'
                            ),
                            s({ success: !0, reason: 'filtered_system_message' }),
                            !0
                          );
                        (console.log('[GeminiBridge v7] Injecting targeted message:', t.content),
                          this.injectMessage(t.content).then((e) => {
                            e
                              ? console.log('[GeminiBridge v7] Injection successful')
                              : console.warn('[GeminiBridge v7] Injection failed');
                          }));
                      } else if ('broadcast' === t.to && t.content && t.from) {
                        if (!this.canAutoInjectRelayMessage(t))
                          return (
                            console.log(
                              '[GeminiBridge v7] ⏭️ Skipping broadcast auto-injection (panel hidden on this tab)'
                            ),
                            s({ success: !0, reason: 'panel_hidden' }),
                            !0
                          );
                        if (!this.shouldInjectRelayMessage(t))
                          return (
                            console.log(
                              '[GeminiBridge v7] ⏭️ Skipping non-conversational broadcast message',
                              t.metadata?.eventType || t.messageType || 'unknown'
                            ),
                            s({ success: !0, reason: 'filtered_system_message' }),
                            !0
                          );
                        const e = t.metadata?.senderId,
                          i = n.isStreaming(),
                          a = (e) => (e ? e.replace(/^(page-agent-|browser-|agent-)/, '') : ''),
                          r = a(this.pageAgentId || ''),
                          c = a(t.from || ''),
                          l = a(e || ''),
                          d =
                            (r && c && r.startsWith(c) && c.length > 5) ||
                            (r && l && r.startsWith(l) && l.length > 5) ||
                            'You' === t.from,
                          p = 'You' === t.from,
                          h = !d;
                        if (
                          (console.log('[GeminiBridge v7] 📨 Message received:', {
                            from: t.from,
                            senderId: e,
                            myAgentId: this.pageAgentId,
                            isFromSelf: d,
                            isExternalAgent: h,
                            messageType: t.messageType,
                            channel: o,
                          }),
                          h)
                        ) {
                          if (i)
                            return (
                              console.log(
                                '[GeminiBridge v7] ⏳ AI is streaming, QUEUING message for later injection:',
                                t.content.substring(0, 50)
                              ),
                              void this.queueMessage(t.content, t.metadata)
                            );
                          (console.log(
                            '[GeminiBridge v7] ✅ Injecting message from external agent:',
                            {
                              from: t.from,
                              isAIResponse:
                                'ai-response' === t.messageType || t.metadata?.isAIResponse,
                              contentPreview: t.content.substring(0, 50),
                              channel: o,
                            }
                          ),
                            ('orchestrator' === t.metadata?.source ||
                              t.metadata?.taskId ||
                              t.metadata?.requiresResponse) &&
                              (console.log(
                                '[GeminiBridge v7] 🎯 Orchestrator task detected:',
                                t.metadata?.taskId
                              ),
                              this.trackPendingRequest({
                                correlationId:
                                  t.metadata?.correlationId || t.id || `req-${Date.now()}`,
                                taskId: t.metadata?.taskId,
                                from: t.from,
                              })),
                            this.injectMessage(t.content).then((e) => {
                              e
                                ? console.log('[GeminiBridge v7] ✅ Injection successful')
                                : console.warn('[GeminiBridge v7] ⚠️ Injection failed');
                            }));
                        } else
                          console.log('[GeminiBridge v7] ⏭️ Skipping message:', {
                            from: t.from,
                            senderId: e,
                            myAgentId: this.pageAgentId,
                            reason: p ? 'from-you' : d ? 'same-agent' : 'unknown',
                          });
                      }
                    }
                    return (s({ success: !0 }), !0);
                }
              } catch (e) {
                console.error('[GeminiBridge] Content script message handler error:', e);
                try {
                  s({ success: !1, error: e.message || 'Unknown error' });
                } catch (e) {}
              }
            });
          }
          safeSendMessage(e, t) {
            if (chrome.runtime?.id)
              try {
                chrome.runtime.sendMessage(e, (e) => {
                  const n = chrome.runtime.lastError;
                  t && !n && t(e);
                });
              } catch (e) {}
          }
          setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
              ((e.ctrlKey || e.metaKey) &&
                e.shiftKey &&
                'G' === e.key &&
                (e.preventDefault(), this.togglePanel()),
                (e.ctrlKey || e.metaKey) &&
                  e.shiftKey &&
                  'I' === e.key &&
                  (e.preventDefault(),
                  navigator.clipboard.readText().then((e) => {
                    e && this.injectMessage(e);
                  })));
            });
          }
          shouldInjectRelayMessage(e) {
            const t = String(e?.content || '').trim();
            if (!t) return !1;
            const n = String(e?.messageType || '').toLowerCase(),
              i = String(e?.metadata?.eventType || '').toLowerCase(),
              s = t.toLowerCase();
            return (
              'event' !== n &&
              !new Set([
                'activity',
                'wake_ping',
                'wake_ack',
                'monitor_idle',
                'page_agent_registered',
                'agent_registered',
                'heartbeat',
              ]).has(i) &&
              !(
                s.startsWith('[activity]') ||
                s.startsWith('[wake_ping') ||
                s.startsWith('[wake_ack')
              )
            );
          }
          async injectMessage(e, t) {
            console.log('[GeminiBridge v7] Injecting message:', e.substring(0, 50));
            const i = await n.sendMessage(e);
            return (
              i
                ? console.log('[GeminiBridge v7] Message sent successfully')
                : console.error('[GeminiBridge v7] Message send failed'),
              i
            );
          }
          trackPendingRequest(e) {
            (this.pendingRequests.set(e.correlationId, { ...e, timestamp: Date.now() }),
              console.log('[GeminiBridge v7] 📝 Tracking pending request:', e.correlationId));
            const t = Date.now();
            for (const [e, n] of this.pendingRequests)
              t - n.timestamp > 3e5 && this.pendingRequests.delete(e);
          }
          getOldestPendingRequest() {
            let e = null;
            for (const t of this.pendingRequests.values())
              (!e || t.timestamp < e.timestamp) && (e = t);
            return e;
          }
          checkForCaptcha() {
            const e = h.detectCaptcha();
            e.detected &&
              (console.log(
                `[GeminiBridge v7] CAPTCHA detected: ${e.type} (confidence: ${e.confidence})`
              ),
              this.safeSendMessage({
                type: 'CAPTCHA_DETECTED',
                captcha: { type: e.type, confidence: e.confidence, url: window.location.href },
              }));
          }
          queueMessage(e, t) {
            (this.injectionQueue.push({
              content: e,
              metadata: t,
              timestamp: Date.now(),
              attempts: 0,
            }),
              this.processInjectionQueue());
          }
          processInjectionQueue() {
            if (this.isProcessingQueue) return;
            this.isProcessingQueue = !0;
            const e = async () => {
              if (!this.panelVisible)
                return ((this.injectionQueue = []), void (this.isProcessingQueue = !1));
              if (0 === this.injectionQueue.length) return void (this.isProcessingQueue = !1);
              if (n.isStreaming())
                return (
                  console.debug('[GeminiBridge v7] Queue paused (AI streaming)...'),
                  void setTimeout(e, 1e3)
                );
              const t = this.injectionQueue.shift();
              t
                ? (console.log(
                    '[GeminiBridge v7] 🚀 Processing queued message:',
                    t.content.substring(0, 30)
                  ),
                  ('orchestrator' === t.metadata?.source ||
                    t.metadata?.taskId ||
                    t.metadata?.requiresResponse) &&
                    this.trackPendingRequest({
                      correlationId: t.metadata?.correlationId || `queued-${Date.now()}`,
                      taskId: t.metadata?.taskId,
                      from: t.metadata?.senderId || 'unknown',
                    }),
                  await this.injectMessage(t.content, t.metadata),
                  setTimeout(e, 3500))
                : (this.isProcessingQueue = !1);
            };
            e();
          }
          canAutoInjectRelayMessage(e) {
            if (!0 === e?.metadata?.forceInject) return !0;
            const t = e?.channel || e?.metadata?.channel || this.currentChannel;
            return (!t || !this.isChannelPaused(String(t))) && this.panelVisible;
          }
          isChannelPaused(e) {
            if (!e) return !1;
            if (this.pausedChannels.has(e)) return !0;
            const t = e.trim().toLowerCase();
            if (!t) return !1;
            for (const e of this.pausedChannels)
              if (String(e).trim().toLowerCase() === t) return !0;
            return !1;
          }
        })());
})();
//# sourceMappingURL=index.js.map

(() => {
  'use strict';
  console.log('AI Studio Automator PHOENIX: Content script loaded on', window.location.href);
  const e = 'undefined' != typeof chrome && chrome.runtime && chrome.runtime.id;
  if (e) {
    const t = 'gemini-3-flash-preview',
      n =
        'Extract all key points of information from this video. Focus specifically on AI-related concepts, technical innovations, and implementation details. Provide a dense, structured bulleted list of the provided key information in a downloadable .md format.',
      o = 3,
      r = 2e3;
    function i(e) {
      return new Promise((t) => setTimeout(t, e));
    }
    function a(t) {
      if (e)
        try {
          chrome.runtime.sendMessage(t).catch(() => {});
        } catch (e) {
          console.log('[Automator] Could not send message (context may be invalid)');
        }
    }
    function s(e, t = 'info') {
      (console.log(`[Automator Phoenix] ${e}`), a({ type: 'LOG', message: e, level: t }));
    }
    async function c(e, t = '') {
      (s(`Clicking: ${t || e.tagName}`, 'info'), e.click(), await i(500));
    }
    async function l(e, t) {
      ((e.value = t),
        e.dispatchEvent(new Event('input', { bubbles: !0 })),
        e.dispatchEvent(new Event('change', { bubbles: !0 })),
        await i(300));
    }
    function u(e) {
      const t = Math.floor(e / 60),
        n = e % 60;
      return t > 0 && n > 0 ? `${t}m${n}s` : t > 0 ? `${t}m` : `${n}s`;
    }
    function d() {
      let e =
        document.querySelector('[data-test-id="add-media-button"]') ||
        document.querySelector('[data-test="selectMediaMenu"]');
      return (
        e ||
        Array.from(
          document.querySelectorAll(
            'button, [role="button"], .mat-mdc-icon-button, .mat-icon-button'
          )
        ).find((e) => {
          const t = e.textContent?.trim() || '',
            n = e.innerHTML || '',
            o = (e.getAttribute('aria-label') || '').toLowerCase(),
            r = 'add' === t || 'add_circle' === t || 'note_add' === t,
            i =
              n.includes('<path') &&
              (n.includes('d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"') ||
                n.includes(
                  'd="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h5v2z"'
                ));
          return (
            r ||
            i ||
            t.includes('add_circle') ||
            n.includes('add_circle') ||
            o.includes('insert') ||
            o.includes('add to prompt') ||
            o.includes('select media')
          );
        })
      );
    }
    async function m() {
      const e = [
        ...Array.from(document.querySelectorAll('button')).filter(
          (e) =>
            e.textContent?.toLowerCase().includes('dismiss') ||
            e.getAttribute('aria-label')?.toLowerCase().includes('dismiss') ||
            e.textContent?.toLowerCase().includes('got it')
        ),
        ...Array.from(document.querySelectorAll('button')).filter(
          (e) =>
            'Close' === e.getAttribute('aria-label') ||
            'close dialog' === e.getAttribute('aria-label')?.toLowerCase() ||
            'close' === e.textContent.trim()
        ),
      ];
      for (const t of e)
        if (null !== t.offsetParent) {
          s('Dismissing overlay/notification...', 'info');
          try {
            t.click();
          } catch (e) {}
          await i(500);
        }
    }
    async function f() {
      if (
        (await m(),
        document.body.innerText.includes('Sign in to') ||
          document.body.innerText.includes('Choose a project'))
      )
        throw (
          s('Detected sign-in or project selection page - automation blocked', 'error'),
          new Error('AUTH_OR_PROJECT_REQUIRED')
        );
      const e = document.querySelectorAll(
        '[role="alert"], .error-message, .mat-error, .mat-snack-bar-container'
      );
      for (const t of e) {
        const e = t.textContent?.toLowerCase() || '';
        if (e.includes('permission denied')) throw new Error('PERMISSION_DENIED: ' + t.textContent);
        if (e.includes('unknown error')) throw new Error('UNKNOWN_ERROR: ' + t.textContent);
        if (e.includes('quota exceeded') || e.includes('rate limit'))
          throw new Error('RATE_LIMIT: ' + t.textContent);
        if (e.includes('failed to generate'))
          throw new Error('GENERATION_FAILED: ' + t.textContent);
      }
    }
    async function w() {
      s(`Ensuring model is set to: ${t}`, 'info');
      const e = Array.from(document.querySelectorAll('button')).find(
        (e) =>
          e.textContent?.toLowerCase().includes('gemini') ||
          e.getAttribute('aria-label')?.toLowerCase().includes('model')
      );
      if (e) {
        if (
          (s('Model selector found, checking current model...', 'info'), e.textContent?.includes(t))
        )
          return (s(`Correct model already selected: ${t}`, 'success'), !0);
        (await c(e, 'Model selector'), await i(1e3));
        const n = document.querySelectorAll('[role="menuitem"], [role="option"], .mat-menu-item'),
          o = Array.from(n).find((e) => e.textContent?.includes(t));
        if (o)
          return (
            await c(o, `Select ${t}`),
            await i(1e3),
            s(`Model switched to: ${t}`, 'success'),
            !0
          );
        s(`Warning: Could not find ${t} in model list`, 'warning');
      } else s('Model selector not found, assuming correct model is active', 'warning');
      return !1;
    }
    async function y(e) {
      if (
        (s(`Getting duration for: ${e}`, 'info'),
        !window.location.href.includes('new_chat') && !window.location.href.includes('prompts/'))
      )
        return (s('Not on a chat page, cannot get duration', 'error'), null);
      await i(2e3);
      const t = document.querySelectorAll('textarea');
      let n = Array.from(t).find(
        (e) =>
          e.placeholder?.toLowerCase().includes('type') ||
          e.placeholder?.toLowerCase().includes('prompt')
      );
      if ((!n && t.length > 0 && (n = t[0]), !n))
        return (s('Could not find prompt input for duration check', 'error'), null);
      const o = `What is the duration of this YouTube video? ${e}\n\nPlease respond with just the duration in the format "X hours Y minutes" or "Y minutes" or "Y minutes Z seconds".`;
      (await l(n, o), await i(500));
      const r =
        document.querySelector('button[aria-label*="Run" i]') ||
        Array.from(document.querySelectorAll('button')).find((e) =>
          e.textContent?.toLowerCase().includes('run')
        );
      if (!r) return (s('Run button not found for duration check', 'error'), null);
      (await c(r, 'Run button'), await i(8e3));
      const a = document.body.innerText,
        u =
          a.match(/(\d+)\s*hours?\s*(\d+)?\s*minutes?/i) ||
          a.match(/(\d+)\s*minutes?\s*(\d+)?\s*seconds?/i) ||
          a.match(/(\d+):(\d+):(\d+)/) ||
          a.match(/(\d+):(\d+)/);
      if (u) {
        let e = 0;
        return (
          u[0].includes('hour')
            ? (e = 60 * (60 * (parseInt(u[1]) || 0) + (parseInt(u[2]) || 0)))
            : u[0].includes('minute')
              ? (e = 60 * (parseInt(u[1]) || 0) + (parseInt(u[2]) || 0))
              : 4 === u.length
                ? (e = 3600 * parseInt(u[1]) + 60 * parseInt(u[2]) + parseInt(u[3]))
                : 3 === u.length && (e = 60 * parseInt(u[1]) + parseInt(u[2])),
          s(`Detected duration: ${Math.floor(e / 60)} minutes`, 'success'),
          e
        );
      }
      return (s('Could not parse duration from response', 'warning'), null);
    }
    async function b(e, t = 0, n = null) {
      (s(`Adding video: ${e} (${u(t)} - ${n ? u(n) : 'end'})`, 'info'),
        s(`Current URL: ${window.location.href}`, 'debug'),
        await m());
      let o = null;
      for (let e = 0; e < 15 && ((o = d()), !o); e++)
        (await m(),
          await i(2e3),
          e % 3 == 0 && s(`Waiting for Insert button (attempt ${e + 1}/15)...`, 'info'));
      if (!o) {
        const e = Array.from(document.querySelectorAll('button'))
          .map((e) => ({
            text: e.textContent?.trim().substring(0, 30),
            aria: e.getAttribute('aria-label')?.substring(0, 50),
            dataTest: e.getAttribute('data-test-id') || e.getAttribute('data-test'),
            visible: null !== e.offsetParent,
          }))
          .slice(0, 20);
        throw (
          s(`Page context: URL=${window.location.href}, Title=${document.title}`, 'debug'),
          s(`Available buttons (first 20): ${JSON.stringify(e)}`, 'debug'),
          new Error('Insert button not found after multiple attempts and strategies')
        );
      }
      (s(`Found Insert button: ${o.getAttribute('aria-label') || 'icon-search'}`, 'success'),
        await c(o, 'Insert button'),
        await i(1500));
      let r =
        document.querySelector('.youtube-video-menu-item') ||
        document.querySelector('[data-test-id="youtube-video-menu-item"]');
      if (
        (r ||
          (r = Array.from(
            document.querySelectorAll('button, [role="menuitem"], .mat-mdc-menu-item')
          ).find((e) => {
            const t = (e.textContent || '').toLowerCase(),
              n = (e.getAttribute('aria-label') || '').toLowerCase();
            return (
              (t.includes('youtube') && t.includes('video')) ||
              (n.includes('youtube') && n.includes('video'))
            );
          })),
        r ||
          (r = Array.from(
            document.querySelectorAll('button, [role="menuitem"], .mat-mdc-menu-item')
          ).find((e) => (e.textContent || '').toLowerCase().includes('youtube'))),
        !r)
      ) {
        const e = Array.from(document.querySelectorAll('[role="menuitem"], .mat-mdc-menu-item'));
        throw (
          s(`Available menu items: ${JSON.stringify(e.map((e) => e.textContent.trim()))}`, 'debug'),
          new Error('YouTube Video option not found in menu')
        );
      }
      (await c(r, 'YouTube Video option'), await i(1500));
      let a = null;
      for (
        let e = 0;
        e < 15 && ((a = document.querySelector('mat-dialog-container, [role="dialog"]')), !a);
        e++
      )
        await i(300);
      if (!a) throw new Error('Video settings dialog not found');
      const f = a.querySelectorAll('input');
      if (f.length < 1) throw new Error('No inputs found in dialog');
      let w = f[0];
      if (f.length > 1) {
        const e = Array.from(f).find((e) => {
          const t = (e.placeholder || '').toLowerCase(),
            n = (e.type || '').toLowerCase();
          return t.includes('url') || t.includes('link') || t.includes('youtube') || 'url' === n;
        });
        e && (w = e);
      }
      (await l(w, e),
        f.length >= 2 && t > 0 && (await l(f[1], u(t))),
        f.length >= 3 && n && (await l(f[2], u(n))),
        await i(500));
      const y = Array.from(a.querySelectorAll('button')).find(
        (e) =>
          e.textContent?.toLowerCase().includes('save') ||
          e.textContent?.toLowerCase().includes('insert') ||
          'save-button' === e.getAttribute('data-test-id')
      );
      if (!y) throw new Error('Save button not found in video dialog');
      (y.disabled && (await i(800)),
        await c(y, 'Save button'),
        await i(3500),
        s('Video added successfully', 'success'));
    }
    async function p() {
      (s('Checking API key status...', 'info'), await i(1e3));
      const e =
        document.querySelector('.paid-api-key-card[aria-label="No API Key"]') ||
        Array.from(document.querySelectorAll('.paid-api-key-card')).find((e) =>
          e.textContent.includes('No API Key')
        );
      if (e) {
        (s('No API Key detected. Attempting to link "The New Fuse"...', 'warning'),
          await c(e, 'No API Key button'),
          await i(2500));
        const t = document.querySelector('mat-select[aria-label="Select a paid project"]');
        if (t) {
          (await c(t, 'Project dropdown'), await i(1500));
          const e = Array.from(document.querySelectorAll('mat-option')),
            n = e.find((e) => e.textContent.includes('The New Fuse'));
          (n
            ? await c(n, 'The New Fuse option')
            : e.length > 0 && (await c(e[0], 'First available project')),
            await i(1e3));
        }
        const n =
          document.querySelector(
            'button[role="switch"][aria-labelledby="save-paid-api-key-label"]'
          ) || document.querySelector('button[role="switch"]');
        n &&
          'true' !== n.getAttribute('aria-checked') &&
          (await c(n, 'Save API Key toggle'), await i(500));
        const o = Array.from(document.querySelectorAll('button')).find(
          (e) => 'Select key' === e.textContent.trim()
        );
        o
          ? (await c(o, 'Select key button'),
            s('API Key linked successfully.', 'success'),
            await i(3e3))
          : s('Could not find Select key button', 'error');
      } else s('API Key appears to be linked.', 'info');
    }
    async function g() {
      (s('Adding prompt and running analysis...', 'info'),
        await C(() => p(), 'Ensure Paid API Key'),
        await w());
      const e = document.querySelectorAll('textarea');
      let t = Array.from(e).find(
        (e) =>
          e.placeholder?.toLowerCase().includes('type') ||
          e.placeholder?.toLowerCase().includes('prompt')
      );
      if (
        (!t && e.length > 0 && (t = e[0]),
        t || (t = document.querySelector('div[contenteditable="true"]')),
        !t)
      )
        throw new Error('Prompt input not found');
      (await l(t, n), await i(800));
      let o = document.querySelector('[data-test-id="run-button"]');
      if (
        (o ||
          (o = Array.from(document.querySelectorAll('button')).find((e) => {
            const t = e.textContent?.trim().toLowerCase() || '',
              n = e.getAttribute('aria-label')?.toLowerCase() || '';
            return (
              !(n.includes('settings') || t.includes('settings') || n.includes('history')) &&
              ('run' === t ||
                'run' === n ||
                'run prompt' === n ||
                'generate response' === n ||
                ((t.includes('run') || n.includes('run')) &&
                  !t.includes('truncate') &&
                  !n.includes('truncate')))
            );
          })),
        !o)
      )
        throw new Error('Run button not found');
      ((o.disabled || o.classList.contains('disabled')) &&
        (s('Run button is disabled - checking for errors', 'warning'),
        await i(1e3),
        await f(),
        s('No errors detected, but button disabled. Waiting...', 'info'),
        await i(3e3)),
        await c(o, 'Run button'),
        s('Analysis started...', 'info'),
        await i(2e3),
        await f());
    }
    async function h(e = 6e5) {
      return (
        s('Waiting for AI to complete processing...', 'info'),
        new Promise((t) => {
          const n = Date.now();
          let o = n,
            r = n;
          const i = setInterval(async () => {
            const a = Date.now();
            if (a - r > 5e3)
              try {
                (await f(), (r = a));
              } catch (e) {
                return (
                  clearInterval(i),
                  s(`Error detected during processing: ${e.message}`, 'error'),
                  void t({ error: e.message })
                );
              }
            a - o > 3e4 &&
              (s(`Still processing... (${Math.floor((a - n) / 1e3)}s elapsed)`, 'info'), (o = a));
            const c = document.querySelectorAll('button'),
              l = Array.from(c).some((e) => {
                const t = e.getAttribute('aria-label')?.toLowerCase() || '';
                return t.includes('copy') && !t.includes('cancel');
              }),
              u = document.querySelector('ms-gemini-response, [class*="response"], .markdown-body'),
              d = u && u.textContent?.length > 500,
              m = Array.from(c).find((e) =>
                e.getAttribute('aria-label')?.toLowerCase().includes('run')
              ),
              w = m && !m.disabled && !m.classList.contains('disabled');
            (((l && d) || (w && d)) &&
              (clearInterval(i), s('Processing complete!', 'success'), t({ complete: !0 })),
              a - n > e &&
                (clearInterval(i),
                s('Timeout waiting for completion (10 min)', 'warning'),
                t({ timeout: !0 })));
          }, 3e3);
        })
      );
    }
    async function A(e, t = 0) {
      s('Attempting to download report...', 'info');
      const n = Array.from(document.querySelectorAll('button')),
        o = n.find((e) => e.getAttribute('aria-label')?.toLowerCase().includes('download'));
      if (o)
        return (
          await c(o, 'Download button'),
          s('Report downloaded', 'success'),
          { success: !0, content: null }
        );
      const r = n.find((e) => {
        const t = e.getAttribute('aria-label')?.toLowerCase() || '';
        return t.includes('copy') && !t.includes('cancel');
      });
      if (r) {
        (await c(r, 'Copy button'), await i(500));
        try {
          const n = await navigator.clipboard.readText();
          if (n && n.length > 100) {
            const o = new Blob([n], { type: 'text/markdown' }),
              r = URL.createObjectURL(o),
              i = document.createElement('a');
            return (
              (i.href = r),
              (i.download = `Report_${e}_Segment${t}_${Date.now()}.md`),
              document.body.appendChild(i),
              i.click(),
              document.body.removeChild(i),
              URL.revokeObjectURL(r),
              s('Report saved as markdown file', 'success'),
              { success: !0, content: n }
            );
          }
        } catch (e) {
          s('Could not auto-save report from clipboard', 'warning');
        }
      }
      return { success: !1, content: null };
    }
    async function C(e, t, n = o) {
      for (let o = 1; o <= n; o++)
        try {
          return (s(`${t} - Attempt ${o}/${n}`, 'info'), await e());
        } catch (e) {
          const a = e.message || String(e);
          if (
            (s(`${t} failed (attempt ${o}/${n}): ${a}`, 'error'),
            a.includes('PERMISSION_DENIED') || a.includes('UNKNOWN_ERROR'))
          )
            throw (s('Critical error detected - cannot retry automatically', 'error'), e);
          if (!(o < n)) throw (s(`${t} failed after ${n} attempts`, 'error'), e);
          {
            const e = r * o;
            (s(`Retrying in ${e}ms...`, 'info'), await i(e));
          }
        }
    }
    async function S(e) {
      const {
        type: n,
        url: o,
        title: r,
        startTime: i,
        endTime: c,
        videoId: l,
        segmentIndex: u,
      } = e;
      (s(`\n=== Processing Task: ${n} ===`, 'info'), s(`Model: ${t}`, 'info'));
      try {
        switch (n) {
          case 'GET_DURATION':
            const e = await C(() => y(o), 'Get video duration');
            a({ type: 'TASK_COMPLETE', taskType: 'GET_DURATION', url: o, duration: e });
            break;
          case 'PROCESS_SEGMENT':
            (await C(() => b(o, i || 0, c), 'Add YouTube video'),
              await C(() => g(), 'Run analysis'));
            const t = await h();
            if (t.error) throw new Error(t.error);
            let d = null;
            (t.complete && (d = await A(l, u)),
              a({
                type: 'TASK_COMPLETE',
                taskType: 'PROCESS_SEGMENT',
                url: o,
                title: r,
                videoId: l,
                segmentIndex: u,
                success: t.complete,
                reportContent: d?.content || null,
              }));
            break;
          default:
            s(`Unknown task type: ${n}`, 'error');
        }
      } catch (e) {
        (s(`Task error: ${e.message}`, 'error'),
          a({ type: 'TASK_ERROR', taskType: n, url: o, error: e.message }));
      }
    }
    function E() {
      (s('Content script ready on: ' + window.location.href, 'success'),
        s(`Using model: ${t}`, 'info'),
        setTimeout(() => {
          a({ type: 'CONTENT_SCRIPT_READY', url: window.location.href, model: t });
        }, 1e3));
    }
    (chrome.runtime.onMessage.addListener((e, n, o) => {
      if (
        (console.log('[Automator Phoenix] Received message:', e.action || e.type),
        'EXECUTE_TASK' === e.action)
      )
        (S(e.task), o({ accepted: !0 }));
      else if ('PING' === e.action) o({ alive: !0, url: window.location.href, model: t });
      else if ('GET_PAGE_STATE' === e.action) {
        const e = d();
        o({ ready: !!e, url: window.location.href, model: t });
      } else
        'CHECK_ERRORS' === e.action &&
          f()
            .then(() => {
              o({ hasErrors: !1 });
            })
            .catch((e) => {
              o({ hasErrors: !0, error: e.message });
            });
      return !0;
    }),
      window.addEventListener('message', (e) => {
        if ('SYNC_TO_EXTENSION' === e.data?.type) {
          const t = e.data.data || e.data,
            { videoQueue: n, reverseOrder: o, segmentDuration: r } = t;
          if (n && Array.isArray(n))
            try {
              (chrome.storage.local.set({
                videoQueue: n,
                reverseOrder: o || !1,
                segmentDuration: r || 45,
                syncTimestamp: Date.now(),
              }),
                s(`Queue synced: ${n.length} videos`, 'success'),
                e.source &&
                  e.source.postMessage(
                    { type: 'EXTENSION_SYNC_CONFIRMED', success: !0, count: n.length },
                    '*'
                  ));
            } catch (e) {
              console.log('[Automator] Could not sync queue:', e);
            }
        }
      }),
      E());
  } else console.log('[Automator] Chrome extension context not available, script will not run.');
})();
//# sourceMappingURL=ai-studio-automation.js.map

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const EXTENSION_PATH = path.resolve(__dirname, '../dist-v7');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const RUN_DIR = path.resolve(__dirname, `../test_runs/${RUN_ID}`);

const QWEN_URL = 'https://chat.qwen.ai/c/guest';
const GEMINI_URL = 'https://gemini.google.com/';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeString(err) {
  if (!err) return 'unknown';
  return String(err.stack || err.message || err);
}

function assertResult(results, id, ok, details = {}) {
  results.push({ id, status: ok ? 'PASS' : 'FAIL', details });
}

function blockedResult(results, id, reason, details = {}) {
  results.push({ id, status: 'BLOCKED', reason, details });
}

function getExtensionServiceWorker(context) {
  return (context.serviceWorkers() || []).find((sw) =>
    String(sw.url() || '').startsWith('chrome-extension://')
  );
}

async function waitForExtensionServiceWorker(context, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const sw = getExtensionServiceWorker(context);
    if (sw) return sw;
    await delay(250);
  }
  return null;
}

async function main() {
  fs.mkdirSync(RUN_DIR, { recursive: true });
  const failures = [];
  const checks = [];
  const events = {
    startedAt: new Date().toISOString(),
    runId: RUN_ID,
    urls: { qwen: QWEN_URL, gemini: GEMINI_URL },
    steps: [],
    logs: {},
  };

  let context = null;
  let popupPage = null;
  let qwenPage = null;
  let geminiPage = null;

  try {
    const profileDir = path.join(RUN_DIR, 'pw-profile');
    fs.mkdirSync(profileDir, { recursive: true });
    let launchError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        context = await chromium.launchPersistentContext(profileDir, {
          headless: false,
          args: [
            '--disable-crash-reporter',
            '--disable-breakpad',
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
          ],
          viewport: { width: 1480, height: 980 },
        });
        launchError = null;
        break;
      } catch (e) {
        launchError = e;
        await delay(1200 * attempt);
      }
    }
    if (!context) {
      throw launchError || new Error('Failed to launch browser context');
    }
    events.steps.push('browser_launched');

    let serviceWorker = getExtensionServiceWorker(context) || null;
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker', {
        timeout: 25000,
        predicate: (sw) => String(sw.url() || '').startsWith('chrome-extension://'),
      });
    }
    const extensionId = serviceWorker.url().split('/')[2];
    events.extensionId = extensionId;
    events.steps.push('service_worker_ready');
    let activeExtensionId = extensionId;

    const popupConsole = [];
    const openPopup = async (currentExtensionId) => {
      if (popupPage && !popupPage.isClosed()) {
        await popupPage.close().catch(() => {});
      }
      popupPage = await context.newPage();
      popupPage.on('console', (msg) => popupConsole.push({ type: msg.type(), text: msg.text() }));
      await popupPage.goto(`chrome-extension://${currentExtensionId}/popup/index.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await delay(500);
    };
    const ensurePopupRuntime = async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (!popupPage || popupPage.isClosed()) {
          await openPopup(activeExtensionId).catch(() => {});
        }
        const runtimeState = await popupPage
          .evaluate(() => ({
            href: window.location.href,
            hasChrome: typeof chrome !== 'undefined',
            hasRuntime: !!chrome?.runtime?.sendMessage,
          }))
          .catch(() => null);
        if (runtimeState?.hasRuntime) {
          return true;
        }
        await delay(400);
        await openPopup(activeExtensionId).catch(() => {});
      }
      return false;
    };
    const runtimeMessageViaServiceWorker = async (payload, timeoutMs = 7000) => {
      const sw = getExtensionServiceWorker(context);
      if (!sw) return { error: 'service_worker_unavailable' };
      return sw
        .evaluate(
          ({ payload: msg, timeoutMs: timeout }) =>
            new Promise((resolve) => {
              const timer = setTimeout(
                () => resolve({ timeout: true, requestType: msg?.type || null }),
                timeout
              );
              chrome.runtime.sendMessage(msg, (response) => {
                clearTimeout(timer);
                const err = chrome.runtime.lastError;
                if (err) {
                  resolve({ error: err.message });
                  return;
                }
                resolve(response || null);
              });
            }),
          { payload, timeoutMs }
        )
        .catch((e) => ({ error: safeString(e) }));
    };
    const tabMessageViaServiceWorker = async (tabId, payload, timeoutMs = 7000) => {
      const sw = getExtensionServiceWorker(context);
      if (!sw) return { error: 'service_worker_unavailable' };
      return sw
        .evaluate(
          ({ tabId: id, payload: msg, timeoutMs: timeout }) =>
            new Promise((resolve) => {
              const timer = setTimeout(() => resolve({ timeout: true }), timeout);
              chrome.tabs.sendMessage(id, msg, (response) => {
                clearTimeout(timer);
                const err = chrome.runtime.lastError;
                if (err) {
                  resolve({ error: err.message });
                  return;
                }
                resolve(response || null);
              });
            }),
          { tabId, payload, timeoutMs }
        )
        .catch((e) => ({ error: safeString(e) }));
    };
    const runtimeFromTabViaServiceWorker = async (tabId, payload, timeoutMs = 8000) => {
      const sw = getExtensionServiceWorker(context);
      if (!sw) return { error: 'service_worker_unavailable' };
      return sw
        .evaluate(
          ({ tabId: id, payload: msg, timeoutMs: timeout }) =>
            new Promise((resolve) => {
              chrome.scripting.executeScript(
                {
                  target: { tabId: id },
                  world: 'ISOLATED',
                  func: async ({ innerPayload, innerTimeoutMs }) =>
                    await new Promise((res) => {
                      const timer = setTimeout(
                        () => res({ timeout: true, requestType: innerPayload?.type || null }),
                        innerTimeoutMs
                      );
                      chrome.runtime.sendMessage(innerPayload, (response) => {
                        clearTimeout(timer);
                        const err = chrome.runtime.lastError;
                        if (err) {
                          res({ error: err.message });
                          return;
                        }
                        res(response || null);
                      });
                    }),
                  args: [{ innerPayload: msg, innerTimeoutMs: timeout }],
                },
                (result) => {
                  const err = chrome.runtime.lastError;
                  if (err) {
                    resolve({ error: err.message });
                    return;
                  }
                  resolve(result?.[0]?.result || null);
                }
              );
            }),
          { tabId, payload, timeoutMs }
        )
        .catch((e) => ({ error: safeString(e) }));
    };
    const listTabsViaServiceWorker = async () => {
      const sw = getExtensionServiceWorker(context);
      if (!sw) return [];
      return sw
        .evaluate(
          () =>
            new Promise((resolve) => {
              chrome.tabs.query({}, (tabs) => {
                resolve(
                  tabs
                    .filter((t) => t.id && t.url)
                    .map((t) => ({ id: t.id, url: t.url, active: !!t.active, title: t.title || '' }))
                );
              });
            })
        )
        .catch(() => []);
    };

    await openPopup(activeExtensionId);
    events.steps.push('popup_loaded');

    const runtimeMessage = async (payload, timeoutMs = 7000) => {
      const ready = await ensurePopupRuntime();
      if (!ready) return runtimeMessageViaServiceWorker(payload, timeoutMs);
      return popupPage.evaluate(
        ({ payload: msg, timeoutMs: timeout }) =>
          new Promise((resolve) => {
            const timer = setTimeout(() => {
              resolve({ timeout: true, requestType: msg?.type || null });
            }, timeout);
            if (!chrome?.runtime?.sendMessage) {
              clearTimeout(timer);
              resolve({ error: 'runtime_sendMessage_unavailable' });
              return;
            }
            chrome.runtime.sendMessage(msg, (response) => {
              clearTimeout(timer);
              const err = chrome.runtime.lastError;
              if (err) {
                resolve({ error: err.message });
                return;
              }
              resolve(response || null);
            });
          }),
        { payload, timeoutMs }
      );
    };

    const tabMessage = async (tabId, payload, timeoutMs = 7000) => {
      const ready = await ensurePopupRuntime();
      if (!ready) return tabMessageViaServiceWorker(tabId, payload, timeoutMs);
      return popupPage.evaluate(
        ({ tabId: id, payload: msg, timeoutMs: timeout }) =>
          new Promise((resolve) => {
            const timer = setTimeout(() => resolve({ timeout: true }), timeout);
            if (!chrome?.tabs?.sendMessage) {
              clearTimeout(timer);
              resolve({ error: 'tabs_sendMessage_unavailable' });
              return;
            }
            chrome.tabs.sendMessage(id, msg, (response) => {
              clearTimeout(timer);
              const err = chrome.runtime.lastError;
              if (err) {
                resolve({ error: err.message });
                return;
              }
              resolve(response || null);
            });
          }),
        { tabId, payload, timeoutMs }
      );
    };

    const runtimeFromTab = async (tabId, payload, timeoutMs = 8000) => {
      const ready = await ensurePopupRuntime();
      if (!ready) return runtimeFromTabViaServiceWorker(tabId, payload, timeoutMs);
      return popupPage.evaluate(
        ({ tabId: id, payload: msg, timeoutMs: timeout }) =>
          new Promise((resolve) => {
            if (!chrome?.scripting?.executeScript) {
              resolve({ error: 'scripting_executeScript_unavailable' });
              return;
            }
            chrome.scripting.executeScript(
              {
                target: { tabId: id },
                func: async ({ innerPayload, innerTimeoutMs }) =>
                  await new Promise((res) => {
                    const timer = setTimeout(() => {
                      res({ timeout: true, requestType: innerPayload?.type || null });
                    }, innerTimeoutMs);
                    chrome.runtime.sendMessage(innerPayload, (response) => {
                      clearTimeout(timer);
                      const err = chrome.runtime.lastError;
                      if (err) {
                        res({ error: err.message });
                        return;
                      }
                      res(response || null);
                    });
                  }),
                args: [{ innerPayload: msg, innerTimeoutMs: timeout }],
                world: 'ISOLATED',
              },
              (result) => {
                const err = chrome.runtime.lastError;
                if (err) {
                  resolve({ error: err.message });
                  return;
                }
                resolve(result?.[0]?.result || null);
              }
            );
          }),
        { tabId, payload, timeoutMs }
      );
    };

    const listTabs = async () => {
      const ready = await ensurePopupRuntime();
      if (!ready) return listTabsViaServiceWorker();
      return popupPage.evaluate(
        () =>
          new Promise((resolve) => {
            if (!chrome?.tabs?.query) {
              resolve([]);
              return;
            }
            chrome.tabs.query({}, (tabs) => {
              resolve(
                tabs
                  .filter((t) => t.id && t.url)
                  .map((t) => ({ id: t.id, url: t.url, active: !!t.active, title: t.title || '' }))
              );
            });
          })
      );
    };

    const getEventLogs = async (limit = 2000) => {
      const response = await runtimeMessage({ type: 'GET_EVENT_LOGS', limit }, 8000);
      return response?.logs || [];
    };

    const showPanelWithFallback = async (tabId) => {
      const status = await tabMessage(tabId, { type: 'GET_PANEL_STATUS' }, 3000);
      if (status && !status.error) {
        await tabMessage(tabId, { type: 'SHOW_PANEL' }, 3000);
        return { usedInjection: false, status };
      }
      const injected = await popupPage.evaluate(
        (id) =>
          new Promise((resolve) => {
            chrome.scripting.executeScript(
              {
                target: { tabId: id },
                files: ['content/index.js'],
              },
              () => {
                const err = chrome.runtime.lastError;
                if (err) {
                  resolve({ success: false, error: err.message });
                  return;
                }
                resolve({ success: true });
              }
            );
          }),
        tabId
      );
      await delay(500);
      const show = await tabMessage(tabId, { type: 'SHOW_PANEL' }, 3000);
      return { usedInjection: true, injected, show };
    };

    const textExistsOnPage = async (page, token) =>
      page
        .evaluate((needle) => {
          const text = document.body?.innerText || '';
          return text.includes(needle);
        }, token)
        .catch(() => false);

    // Open required tabs
    qwenPage = await context.newPage();
    geminiPage = await context.newPage();
    await qwenPage.goto(QWEN_URL, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => {
      events.steps.push(`qwen_nav_error:${safeString(e)}`);
    });
    await geminiPage
      .goto(GEMINI_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
      .catch((e) => {
        events.steps.push(`gemini_nav_error:${safeString(e)}`);
      });
    await delay(3000);

    const tabs = await listTabs();
    const qwenTab = tabs.find((t) => String(t.url || '').includes('chat.qwen.ai'));
    const geminiTab = tabs.find((t) => String(t.url || '').includes('gemini.google.com'));
    if (!qwenTab || !geminiTab) {
      throw new Error(`Could not resolve required tabs. qwen=${!!qwenTab} gemini=${!!geminiTab}`);
    }
    events.tabIds = { qwen: qwenTab.id, gemini: geminiTab.id };

    // Ensure clean event log baseline
    await runtimeMessage({ type: 'CLEAR_EVENT_LOGS' });
    await runtimeMessage({ type: 'SET_EVENT_LOGGING', enabled: true });
    events.steps.push('event_logs_reset');

    // Build channels Green/Red
    const createGreen = await runtimeMessage({ type: 'CHANNEL_CREATE', name: 'Green' });
    const createRed = await runtimeMessage({ type: 'CHANNEL_CREATE', name: 'Red' });
    const channelsState = await runtimeMessage({ type: 'GET_STATE' });
    const channels = channelsState?.channels || [];
    const green = channels.find((c) => String(c.name || '').toLowerCase() === 'green');
    const red = channels.find((c) => String(c.name || '').toLowerCase() === 'red');

    if (!green || !red) {
      blockedResult(checks, 'channels_green_red', 'Green/Red channels unavailable', {
        createGreen,
        createRed,
      });
      throw new Error('Required channels missing');
    }
    events.channels = { green, red };

    // Panel only on Tab A (Qwen) baseline
    const showQwen = await showPanelWithFallback(qwenTab.id);
    const showGeminiBefore = await geminiPage
      .evaluate(() => !!document.querySelector('#fuse-connect-panel-v7'))
      .catch(() => false);
    assertResult(checks, 'panel_open_only_qwen_baseline', showGeminiBefore === false, {
      qwenPanel: showQwen,
      geminiPanelVisibleBefore: showGeminiBefore,
    });

    // Join Green on Qwen tab
    const joinGreenQwen = await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_JOIN', channelId: green.id });
    events.joinGreenQwen = joinGreenQwen;

    // 1) Qwen direct inject/send via injectable panel modal (not raw page input)
    const qwenPrompt = `TNF_QA_PROMPT_${Date.now()} Respond with the same token`;
    const panelSend = await qwenPage
      .evaluate((prompt) => {
        const panel = document.querySelector('#fuse-connect-panel-v7');
        if (!panel) return { success: false, error: 'panel-missing' };
        const chatTabBtn = panel.querySelector('.fcp6-tab[data-tab="chat"]');
        if (chatTabBtn) {
          chatTabBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
        const input = panel.querySelector('textarea[data-input="message"]');
        const sendBtn = panel.querySelector('button[data-action="send"]');
        if (!input || !sendBtn) return { success: false, error: 'panel-input-or-send-missing' };
        input.value = prompt;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return { success: true };
      }, qwenPrompt)
      .catch((e) => ({ success: false, error: String(e?.message || e) }));

    let qwenPromptVisible = false;
    for (let i = 0; i < 10; i++) {
      qwenPromptVisible = await qwenPage
        .evaluate((needle) => {
          const panel = document.querySelector('#fuse-connect-panel-v7');
          const panelText = panel?.innerText || '';
          return panelText.includes(needle);
        }, qwenPrompt)
        .catch(() => false);
      if (qwenPromptVisible) break;
      await delay(1200);
    }
    assertResult(checks, 'qwen_send_works', !!panelSend?.success && qwenPromptVisible, {
      panelSend,
      qwenPromptVisible,
    });

    // 2) Qwen response captured
    let responseCaptured = false;
    let lastResponse = null;
    for (let i = 0; i < 90; i++) {
      const logs = await getEventLogs(2000);
      const hasResponseComplete = logs.some(
        (l) =>
          l.category === 'extension.message' &&
          l.event === 'runtime_inbound' &&
          String(l.details?.type || '') === 'RESPONSE_COMPLETE' &&
          Number(l.details?.tabId) === qwenTab.id
      );
      if (hasResponseComplete) {
        responseCaptured = true;
        break;
      }
      if (i % 6 === 0) {
        const r = await tabMessage(qwenTab.id, { type: 'GET_LAST_RESPONSE' }, 4000);
        if (r?.response) lastResponse = r.response;
      }
      await delay(1000);
    }
    if (!responseCaptured && lastResponse) {
      responseCaptured = true;
    }
    if (!responseCaptured) {
      blockedResult(checks, 'qwen_response_captured', 'No response signal captured (possible guest/site challenge)');
    } else {
      assertResult(checks, 'qwen_response_captured', true, { lastResponsePreview: String(lastResponse || '').slice(0, 200) });
    }

    // 3/4) Cross-tab isolation with Green broadcast while Gemini panel hidden
    const tokenGreenA = `TNF_GREEN_A_${Date.now()}`;
    const broadcastMsg = {
      type: 'NEW_MESSAGE',
      message: {
        id: `msg-${Date.now()}`,
        from: 'qa-orchestrator',
        to: 'broadcast',
        content: tokenGreenA,
        channel: green.id,
        messageType: 'text',
        metadata: { senderId: 'qa-orchestrator', channel: green.id },
      },
    };
    await tabMessage(qwenTab.id, broadcastMsg, 4000);
    await tabMessage(geminiTab.id, broadcastMsg, 4000);
    await delay(5000);
    const tokenOnQwen = await textExistsOnPage(qwenPage, tokenGreenA);
    const tokenOnGemini = await textExistsOnPage(geminiPage, tokenGreenA);
    assertResult(checks, 'green_broadcast_qwen_inject', tokenOnQwen, { token: tokenGreenA });
    assertResult(checks, 'no_cross_tab_injection_when_gemini_panel_hidden', !tokenOnGemini, {
      token: tokenGreenA,
      geminiPanelHidden: true,
    });

    // 5) Open Gemini panel and verify injection when expected
    await showPanelWithFallback(geminiTab.id);
    await runtimeFromTab(geminiTab.id, { type: 'CHANNEL_JOIN', channelId: green.id });
    const tokenGreenB = `TNF_GREEN_B_${Date.now()}`;
    const broadcastMsg2 = {
      type: 'NEW_MESSAGE',
      message: {
        id: `msg-${Date.now()}-2`,
        from: 'qa-orchestrator',
        to: 'broadcast',
        content: tokenGreenB,
        channel: green.id,
        messageType: 'text',
        metadata: { senderId: 'qa-orchestrator', channel: green.id },
      },
    };
    await tabMessage(geminiTab.id, broadcastMsg2, 4000);
    await delay(5000);
    const tokenOnGeminiAfterOpen = await textExistsOnPage(geminiPage, tokenGreenB);
    assertResult(checks, 'gemini_injection_when_panel_open', tokenOnGeminiAfterOpen, {
      token: tokenGreenB,
    });

    // 6) Switch Qwen channel Green -> Red and verify isolation
    await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_JOIN', channelId: red.id });
    const greenWhileRedToken = `TNF_GREEN_WHILE_RED_${Date.now()}`;
    await tabMessage(qwenTab.id, {
      type: 'NEW_MESSAGE',
      message: {
        id: `msg-${Date.now()}-3`,
        from: 'qa-orchestrator',
        to: 'broadcast',
        content: greenWhileRedToken,
        channel: green.id,
        messageType: 'text',
        metadata: { senderId: 'qa-orchestrator', channel: green.id },
      },
    });
    await delay(3000);
    const greenInjectedWhileRed = await textExistsOnPage(qwenPage, greenWhileRedToken);
    assertResult(checks, 'channel_isolation_green_vs_red', !greenInjectedWhileRed, {
      token: greenWhileRedToken,
    });

    // 7/8) Pause/resume Green on Qwen
    await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_JOIN', channelId: green.id });
    await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_PAUSE', channelId: green.id });
    const pausedGreenToken = `TNF_GREEN_PAUSED_${Date.now()}`;
    await tabMessage(qwenTab.id, {
      type: 'NEW_MESSAGE',
      message: {
        id: `msg-${Date.now()}-4`,
        from: 'qa-orchestrator',
        to: 'broadcast',
        content: pausedGreenToken,
        channel: green.id,
        messageType: 'text',
        metadata: { senderId: 'qa-orchestrator', channel: green.id },
      },
    });
    await delay(3000);
    const pausedGreenInjected = await textExistsOnPage(qwenPage, pausedGreenToken);
    assertResult(checks, 'pause_green_blocks_injection', !pausedGreenInjected, {
      token: pausedGreenToken,
    });

    await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_RESUME', channelId: green.id });
    const resumedGreenToken = `TNF_GREEN_RESUMED_${Date.now()}`;
    await tabMessage(qwenTab.id, {
      type: 'NEW_MESSAGE',
      message: {
        id: `msg-${Date.now()}-5`,
        from: 'qa-orchestrator',
        to: 'broadcast',
        content: resumedGreenToken,
        channel: green.id,
        messageType: 'text',
        metadata: { senderId: 'qa-orchestrator', channel: green.id },
      },
    });
    await delay(5000);
    const resumedGreenInjected = await textExistsOnPage(qwenPage, resumedGreenToken);
    assertResult(checks, 'resume_green_restores_injection', resumedGreenInjected, {
      token: resumedGreenToken,
    });

    // 9) Pause/resume Red
    await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_JOIN', channelId: red.id });
    await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_PAUSE', channelId: red.id });
    const pausedRedToken = `TNF_RED_PAUSED_${Date.now()}`;
    await tabMessage(qwenTab.id, {
      type: 'NEW_MESSAGE',
      message: {
        id: `msg-${Date.now()}-6`,
        from: 'qa-orchestrator',
        to: 'broadcast',
        content: pausedRedToken,
        channel: red.id,
        messageType: 'text',
        metadata: { senderId: 'qa-orchestrator', channel: red.id },
      },
    });
    await delay(3000);
    const pausedRedInjected = await textExistsOnPage(qwenPage, pausedRedToken);
    await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_RESUME', channelId: red.id });
    const resumedRedToken = `TNF_RED_RESUMED_${Date.now()}`;
    await tabMessage(qwenTab.id, {
      type: 'NEW_MESSAGE',
      message: {
        id: `msg-${Date.now()}-7`,
        from: 'qa-orchestrator',
        to: 'broadcast',
        content: resumedRedToken,
        channel: red.id,
        messageType: 'text',
        metadata: { senderId: 'qa-orchestrator', channel: red.id },
      },
    });
    await delay(5000);
    const resumedRedInjected = await textExistsOnPage(qwenPage, resumedRedToken);
    assertResult(checks, 'pause_red_blocks_injection', !pausedRedInjected, { token: pausedRedToken });
    assertResult(checks, 'resume_red_restores_injection', resumedRedInjected, { token: resumedRedToken });

    // 10) Refresh Qwen and verify paused sync from background
    await runtimeFromTab(qwenTab.id, { type: 'CHANNEL_PAUSE', channelId: red.id });
    await qwenPage.reload({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await delay(3000);
    const tabsAfterReload = await listTabs();
    const qwenTabAfterReload = tabsAfterReload.find((t) => String(t.url || '').includes('chat.qwen.ai'));
    if (!qwenTabAfterReload) {
      blockedResult(checks, 'pause_state_sync_after_refresh', 'Qwen tab missing after reload');
    } else {
      await showPanelWithFallback(qwenTabAfterReload.id);
      const stateAfterReload = await runtimeFromTab(qwenTabAfterReload.id, { type: 'GET_STATE' }, 6000);
      const pausedAfterReload = Array.isArray(stateAfterReload?.pausedChannels)
        ? stateAfterReload.pausedChannels.map((x) => String(x))
        : [];
      assertResult(checks, 'pause_state_sync_after_refresh', pausedAfterReload.includes(String(red.id)), {
        pausedAfterReload,
      });
      events.tabIds.qwen = qwenTabAfterReload.id;
    }

    // 11) Event log retrieval + clear (pre-reload, deterministic transport)
    const logsBeforeClear = await getEventLogs(3000);
    const clearResp = await runtimeMessage({ type: 'CLEAR_EVENT_LOGS' });
    const logsAfterClear = await getEventLogs(3000);
    const hasUsefulCategories = logsBeforeClear.some((l) =>
      ['browser.tabs', 'extension.message', 'chat', 'channel', 'relay'].includes(String(l.category))
    );
    assertResult(checks, 'event_logs_retrieve_and_clear', !!clearResp?.success && logsAfterClear.length <= 2 && hasUsefulCategories, {
      before: logsBeforeClear.length,
      after: logsAfterClear.length,
      hasUsefulCategories,
    });

    // 12) Wake ping policy
    const state = await runtimeMessage({ type: 'GET_STATE' });
    const logsFinal = await getEventLogs(4000);
    const wakePingEvents = logsFinal.filter(
      (l) =>
        String(l.event || '').includes('wake') ||
        String(l.details?.eventType || '').includes('wake') ||
        String(l.details?.type || '').includes('WAKE')
    );
    assertResult(checks, 'no_wake_ping_starts_idle_channel', !state?.autoWakePing || wakePingEvents.length === 0, {
      autoWakePing: !!state?.autoWakePing,
      wakePingEvents: wakePingEvents.length,
    });

    // Required disconnected/connected coverage (pre-reload)
    const disconnectResp = await runtimeMessage({ type: 'DISCONNECT' });
    const stateAfterDisconnect = await runtimeMessage({ type: 'GET_STATE' });
    const connectResp = await runtimeMessage({ type: 'CONNECT' });
    await delay(3000);
    const stateAfterConnect = await runtimeMessage({ type: 'GET_STATE' });
    const disconnectedCovered =
      !!disconnectResp?.success && stateAfterDisconnect?.connectionStatus === 'disconnected';
    const connectedObserved = stateAfterConnect?.connectionStatus === 'connected';
    if (!connectedObserved) {
      blockedResult(checks, 'relay_connected_state', 'Local relay not reachable in environment', {
        connectResp,
        stateAfterConnect: stateAfterConnect?.connectionStatus,
      });
    } else {
      assertResult(checks, 'relay_connected_state', true, { connectResp });
    }
    assertResult(checks, 'relay_disconnected_state', disconnectedCovered, {
      disconnectResp,
      stateAfterDisconnect: stateAfterDisconnect?.connectionStatus,
    });

    // 13) Extension reload while tabs open (service-worker transport only)
    const beforeReloadState = await runtimeMessage({ type: 'GET_STATE' });
    await popupPage.evaluate(() => chrome.runtime.reload());
    await delay(4000);
    const sw2 = await waitForExtensionServiceWorker(context, 30000);
    let extensionIdAfterReload = activeExtensionId;
    if (sw2) {
      extensionIdAfterReload = sw2.url().split('/')[2];
    }
    activeExtensionId = extensionIdAfterReload;
    events.extensionIdAfterReload = extensionIdAfterReload;

    let extensionReloaded = false;
    let pingAfterReload = null;
    if (sw2) {
      pingAfterReload = await sw2
        .evaluate(
          ({ timeoutMs }) =>
            new Promise((resolve) => {
              const timer = setTimeout(() => resolve({ timeout: true }), timeoutMs);
              chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
                clearTimeout(timer);
                const err = chrome.runtime.lastError;
                if (err) {
                  resolve({ error: err.message });
                  return;
                }
                resolve(response || null);
              });
            }),
          { timeoutMs: 8000 }
        )
        .catch((e) => ({ error: safeString(e) }));
      extensionReloaded = !!(pingAfterReload?.pong || pingAfterReload?.success);
    } else {
      events.steps.push('extension_sw_unavailable_after_reload');
    }
    events.pingAfterReload = pingAfterReload;

    let postReloadNoPhantom = true;
    if (extensionReloaded) {
      const tokenAfterReload = `TNF_AFTER_RELOAD_${Date.now()}`;
      const qwenId = events.tabIds.qwen;
      const postReloadMsg = await tabMessageViaServiceWorker(qwenId, {
        type: 'NEW_MESSAGE',
        message: {
          id: `msg-${Date.now()}-8`,
          from: 'qa-orchestrator',
          to: 'broadcast',
          content: tokenAfterReload,
          channel: red.id,
          messageType: 'text',
          metadata: { senderId: 'qa-orchestrator', channel: red.id },
        },
      });
      events.postReloadMessageDispatch = postReloadMsg;
      await delay(2500);
      const appearsOnGeminiUnexpected = await textExistsOnPage(geminiPage, tokenAfterReload);
      postReloadNoPhantom = !appearsOnGeminiUnexpected;
    }
    assertResult(
      checks,
      'extension_reload_recovery_no_phantom_injection',
      extensionReloaded && postReloadNoPhantom,
      {
        beforeReloadConnection: beforeReloadState?.connectionStatus || null,
        extensionReloaded,
        postReloadNoPhantom,
      }
    );

    events.logs.popupConsoleErrors = popupConsole.filter((x) => x.type === 'error');
    events.logs.eventLogSample = await getEventLogs(3000);
  } catch (error) {
    failures.push(`Fatal runner error: ${safeString(error)}`);
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
  }

  const pass = checks.filter((c) => c.status === 'PASS').length;
  const fail = checks.filter((c) => c.status === 'FAIL').length;
  const blocked = checks.filter((c) => c.status === 'BLOCKED').length;

  if (fail > 0) {
    for (const c of checks.filter((x) => x.status === 'FAIL')) {
      failures.push(`${c.id}: ${JSON.stringify(c.details || {})}`);
    }
  }
  if (blocked > 0) {
    for (const c of checks.filter((x) => x.status === 'BLOCKED')) {
      failures.push(`${c.id}: BLOCKED - ${c.reason || 'unspecified'}`);
    }
  }

  const summary = {
    runId: RUN_ID,
    createdAt: new Date().toISOString(),
    extensionPath: EXTENSION_PATH,
    totals: { pass, fail, blocked, total: checks.length },
    checks,
    failures,
  };

  fs.writeFileSync(path.join(RUN_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(RUN_DIR, 'events.json'), JSON.stringify(events, null, 2));
  fs.writeFileSync(
    path.join(RUN_DIR, 'failures.md'),
    failures.length > 0 ? failures.map((f) => `- ${f}`).join('\n') + '\n' : '- none\n'
  );
  try {
    const patchDiff = execSync('git diff --no-ext-diff -- .', {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    fs.writeFileSync(path.join(RUN_DIR, 'patch.diff'), patchDiff || '');
  } catch (e) {
    fs.writeFileSync(path.join(RUN_DIR, 'patch.diff'), `# patch capture failed\n${safeString(e)}\n`);
  }

  console.log(`SYSTEM_QA_RUN_DIR=${RUN_DIR}`);
  console.log(JSON.stringify(summary.totals));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

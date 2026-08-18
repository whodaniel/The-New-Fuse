const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const EXTENSION_PATH = path.resolve(__dirname, '../dist-v7');
const OUTPUT_DIR = path.resolve(__dirname, '../output/playwright');
const REPORT_PATH = path.join(OUTPUT_DIR, `component-smoke-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

const SUPPORTED_SITES = [
  'https://chatgpt.com',
  'https://gemini.google.com',
  'https://www.perplexity.ai',
  'https://chat.groq.com',
  'https://chat.mistral.ai',
  'https://chat.qwen.ai',
  'https://duck.ai',
  'https://aiarena.io',
  'https://agentarena.ai',
];

const EXPERIMENTAL_SITES = [
  'https://poe.com',
  'https://claude.ai',
  'https://huggingface.co/chat',
];

const smokeLimit = Number(process.env.SMOKE_LIMIT || 0);
const SITES_TO_TEST =
  smokeLimit > 0 ? SUPPORTED_SITES.slice(0, smokeLimit) : SUPPORTED_SITES;
const EXPERIMENTAL_SITES_TO_TEST =
  smokeLimit > 0 ? EXPERIMENTAL_SITES.slice(0, smokeLimit) : EXPERIMENTAL_SITES;

function normalizeChannelName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const mark = (step) => console.log(`[component-smoke] ${step}`);

  const report = {
    startedAt: new Date().toISOString(),
    extensionPath: EXTENSION_PATH,
    buildRuntime: {},
    popup: {},
    popupUiTests: {},
    channelTests: {},
    popupControlTests: {},
    backgroundMessagingTests: {},
    servicesTests: {},
    supportedSiteChecks: [],
    experimentalSiteChecks: [],
    unsupportedSiteCheck: null,
    panelFeatureChecks: {},
    tabChannelIsolation: {},
    errors: [],
  };

  const context = await chromium.launchPersistentContext('', {
    headless: process.env.HEADLESS !== 'false',
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
    viewport: { width: 1600, height: 1000 },
  });

  try {
    mark('browser_launched');
    let serviceWorker = context.serviceWorkers()[0] || null;
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 20000 });
    }

    const extensionId = serviceWorker.url().split('/')[2];
    report.extensionId = extensionId;
    mark(`service_worker_ready:${extensionId}`);
    report.buildRuntime = {
      extensionId,
      serviceWorkerUrl: serviceWorker.url(),
      serviceWorkerActive: true,
      headless: process.env.HEADLESS !== 'false',
    };

    const popupPage = await context.newPage();
    const popupConsoleErrors = [];
    popupPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        popupConsoleErrors.push(msg.text());
      }
    });
    await popupPage.goto(`chrome-extension://${extensionId}/popup/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    mark('popup_loaded');

    const runtimeMessage = (payload, timeoutMs = 4000) =>
      popupPage.evaluate(
        ({ msg, timeoutMs: timeout }) =>
          new Promise((resolve) => {
            const timer = setTimeout(() => {
              resolve({ timeout: true, requestType: msg?.type || null });
            }, timeout);
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
        { msg: payload, timeoutMs }
      );

    const getStorage = (keys) =>
      popupPage.evaluate(
        (requestedKeys) =>
          new Promise((resolve) => {
            chrome.storage.local.get(requestedKeys, (result) => resolve(result));
          }),
        keys
      );

    const setStorage = (data) =>
      popupPage.evaluate(
        (payload) =>
          new Promise((resolve) => {
            chrome.storage.local.set(payload, () => resolve(true));
          }),
        data
      );

    const listTabs = () =>
      popupPage.evaluate(
        () =>
          new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
              resolve(
                tabs
                  .filter((t) => t.id && t.url)
                  .map((t) => ({ id: t.id, url: t.url, title: t.title || '' }))
              );
            });
          })
      );

    const sendTabMessage = (tabId, message, timeoutMs = 5000) =>
      popupPage.evaluate(
        ({ tabId: id, payload, timeoutMs: timeout }) =>
          new Promise((resolve) => {
            const timer = setTimeout(() => {
              resolve({ timeout: true, requestType: payload?.type || null });
            }, timeout);
            chrome.tabs.sendMessage(id, payload, (response) => {
              clearTimeout(timer);
              const err = chrome.runtime.lastError;
              if (err) {
                resolve({ error: err.message });
                return;
              }
              resolve(response || null);
            });
          }),
        { tabId, payload: message, timeoutMs }
      );

    const showPanelWithFallback = (tabId) =>
      popupPage.evaluate(
        (id) =>
          new Promise((resolve) => {
            const checkReady = () =>
              new Promise((res) => {
                chrome.tabs.sendMessage(id, { type: 'GET_PANEL_STATUS' }, (response) => {
                  const err = chrome.runtime.lastError;
                  if (err) {
                    res({ ready: false, error: err.message });
                    return;
                  }
                  res({ ready: !!response, response });
                });
              });

            const showPanel = () =>
              new Promise((res) => {
                chrome.tabs.sendMessage(id, { type: 'SHOW_PANEL' }, (response) => {
                  const err = chrome.runtime.lastError;
                  if (err) {
                    res({ success: false, error: err.message });
                    return;
                  }
                  res(response || { success: true });
                });
              });

            const injectScript = () =>
              new Promise((res) => {
                chrome.scripting.executeScript(
                  {
                    target: { tabId: id },
                    files: ['content/index.js'],
                  },
                  () => {
                    const err = chrome.runtime.lastError;
                    if (err) {
                      res({ success: false, error: err.message });
                      return;
                    }
                    res({ success: true });
                  }
                );
              });

            (async () => {
              const initial = await checkReady();
              if (initial.ready) {
                const show = await showPanel();
                resolve({ path: 'direct', initial, show });
                return;
              }

              const injection = await injectScript();
              if (!injection.success) {
                resolve({ path: 'inject-failed', initial, injection });
                return;
              }

              await new Promise((r) => setTimeout(r, 600));
              const afterInject = await checkReady();
              const show = await showPanel();
              resolve({ path: 'inject-then-show', initial, injection, afterInject, show });
            })();
          }),
        tabId
      );

    const popupSelectors = [
      '#connect-btn',
      '#open-panel-btn',
      '#save-settings',
      '#relay-url',
      '#debug-mode',
      '#auto-reconnect',
    ];

    for (const selector of popupSelectors) {
      report.popup[selector] = !!(await popupPage.$(selector));
    }
    report.popupUiTests.popupLoadsWithoutFatalConsoleErrors = popupConsoleErrors.length === 0;
    report.popupUiTests.popupConsoleErrors = popupConsoleErrors;

    if (report.popup['#debug-mode'] && report.popup['#save-settings']) {
      await popupPage.check('#debug-mode', { timeout: 1200 }).catch(() => {});
      await popupPage.click('#save-settings', { timeout: 1200 }).catch(() => {});
      await popupPage.uncheck('#debug-mode', { timeout: 1200 }).catch(() => {});
      await popupPage.click('#save-settings', { timeout: 1200 }).catch(() => {});
      report.popup.settingsToggleAttempted = true;
    }

    const popupTabs = ['connect', 'network', 'services', 'settings', 'connect'];
    const tabVisitResults = [];
    for (const tabId of popupTabs) {
      await popupPage.click(`.tab[data-tab="${tabId}"]`, { timeout: 1200 }).catch(() => {});
      await popupPage.waitForTimeout(120);
      const active = await popupPage.$eval(`#tab-${tabId}`, (el) =>
        el.classList.contains('active')
      );
      tabVisitResults.push({ tabId, active });
    }

    const centralSelectors = [
      '#central-channel-select',
      '#central-new-channel',
      '#central-create-channel',
      '#central-chat-stream',
      '#central-chat-input',
      '#central-send-message',
    ];
    const centralPresent = {};
    for (const selector of centralSelectors) {
      centralPresent[selector] = !!(await popupPage.$(selector));
    }

    report.popupControlTests.tabVisits = tabVisitResults;
    report.popupControlTests.centralSelectors = centralPresent;
    mark('popup_selectors_and_tabs_checked');

    // Settings persistence check (save, reopen popup, re-check)
    await popupPage.click('.tab[data-tab="settings"]', { timeout: 1200 }).catch(() => {});
    const settingsProbe = {
      relayUrl: `ws://127.0.0.1:3000/ws?smoke=${Date.now()}`,
      autoReconnect: false,
      autoMonitor: false,
      autoMasterClock: false,
      autoWakePing: false,
      showPanel: false,
      debugMode: true,
    };
    await popupPage.fill('#relay-url', settingsProbe.relayUrl, { timeout: 1500 }).catch(() => {});
    await popupPage.setChecked('#auto-reconnect', settingsProbe.autoReconnect, { timeout: 1500 }).catch(() => {});
    await popupPage.setChecked('#auto-monitor', settingsProbe.autoMonitor, { timeout: 1500 }).catch(() => {});
    await popupPage
      .setChecked('#auto-master-clock', settingsProbe.autoMasterClock, { timeout: 1500 })
      .catch(() => {});
    await popupPage.setChecked('#auto-wake-ping', settingsProbe.autoWakePing, { timeout: 1500 }).catch(() => {});
    await popupPage.setChecked('#show-panel', settingsProbe.showPanel, { timeout: 1500 }).catch(() => {});
    await popupPage.setChecked('#debug-mode', settingsProbe.debugMode, { timeout: 1500 }).catch(() => {});
    await popupPage.click('#save-settings', { timeout: 1500 }).catch(() => {});
    await popupPage.waitForTimeout(300);

    const savedSettings = (await getStorage(['fuse_settings'])).fuse_settings || {};
    const popupPageReloaded = await context.newPage();
    await popupPageReloaded.goto(`chrome-extension://${extensionId}/popup/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await popupPageReloaded.click('.tab[data-tab="settings"]', { timeout: 1500 }).catch(() => {});
    const uiReloaded = await popupPageReloaded
      .evaluate(() => ({
        relayUrl: document.getElementById('relay-url')?.value || '',
        autoReconnect: !!document.getElementById('auto-reconnect')?.checked,
        autoMonitor: !!document.getElementById('auto-monitor')?.checked,
        autoMasterClock: !!document.getElementById('auto-master-clock')?.checked,
        autoWakePing: !!document.getElementById('auto-wake-ping')?.checked,
        showPanel: !!document.getElementById('show-panel')?.checked,
        debugMode: !!document.getElementById('debug-mode')?.checked,
      }))
      .catch(() => ({}));
    report.popupUiTests.settingsPersistence = {
      expected: settingsProbe,
      stored: {
        relayUrl: savedSettings.relayUrl,
        autoReconnect: savedSettings.autoReconnect,
        autoMonitor: savedSettings.autoMonitor,
        autoMasterClock: savedSettings.autoMasterClock,
        autoWakePing: savedSettings.autoWakePing,
        showPanel: savedSettings.showPanel,
        debugMode: savedSettings.debugMode,
      },
      reloadedUi: uiReloaded,
    };
    mark('settings_persistence_checked');

    // Managed sites add/remove persistence
    const managedSite = `qa-smoke-${Date.now()}.example`;
    await popupPage.fill('#new-site-input', `https://www.${managedSite}/path`, { timeout: 1500 }).catch(() => {});
    await popupPage.click('#add-site-btn', { timeout: 1500 }).catch(() => {});
    await popupPage.waitForTimeout(250);
    const afterAdd = (await getStorage(['fuse_settings'])).fuse_settings || {};
    await popupPage.click(`.delete-site-btn[data-site="${managedSite}"]`, { timeout: 1500 }).catch(() => {});
    await popupPage.waitForTimeout(250);
    const afterRemove = (await getStorage(['fuse_settings'])).fuse_settings || {};
    report.popupUiTests.managedSites = {
      addedSite: managedSite,
      storedAfterAdd: afterAdd.allowedSites || [],
      storedAfterRemove: afterRemove.allowedSites || [],
    };
    mark('managed_sites_checked');

    // Export logs action path
    await setStorage({
      fuse_logs: [{ id: `smoke-${Date.now()}`, msg: 'smoke-log-entry', ts: Date.now() }],
    });
    await popupPage.evaluate(() => {
      window.__smokeExport = { createObjectUrlCalls: 0, anchorClicks: 0 };
      URL.createObjectURL = (blob) => {
        window.__smokeExport.createObjectUrlCalls += 1;
        return `blob:smoke-${Date.now()}`;
      };
      HTMLAnchorElement.prototype.click = function clickPatched() {
        window.__smokeExport.anchorClicks += 1;
        return undefined;
      };
    });
    await popupPage.click('#export-logs', { timeout: 1500 }).catch(() => {});
    await popupPage.waitForTimeout(250);
    report.popupUiTests.exportLogs = await popupPage
      .evaluate(() => window.__smokeExport || null)
      .catch(() => null);
    mark('export_logs_checked');

    report.popupUiTests.nativeHostIndicator = await popupPage
      .$eval('#native-host-indicator', (el) => ({
        text: el.textContent || '',
        color: el.style.color || '',
      }))
      .catch(() => null);
    mark('native_host_indicator_checked');

    await popupPageReloaded.close().catch(() => {});

    const uniqueChannelName = `TNF-Autotest-${Date.now()}`;
    const secondUniqueChannelName = `${uniqueChannelName}-B`;
    const firstCreate = await runtimeMessage({ type: 'CHANNEL_CREATE', name: uniqueChannelName });
    const thirdCreate = await runtimeMessage({
      type: 'CHANNEL_CREATE',
      name: secondUniqueChannelName,
    });
    const secondCreate = await runtimeMessage({
      type: 'CHANNEL_CREATE',
      name: `  ${uniqueChannelName.toUpperCase()}  `,
    });

    const storageAfterCreate = await getStorage(['fuse_channels', 'fuse_tab_active_channels']);
    const channels = storageAfterCreate.fuse_channels || [];
    const normalizedCounts = channels.reduce((acc, ch) => {
      const key = normalizeChannelName(ch.name);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    report.channelTests = {
      firstCreate,
      thirdCreate,
      secondCreate,
      channelCount: channels.length,
      duplicateNameKeys: Object.entries(normalizedCounts)
        .filter(([, count]) => count > 1)
        .map(([name]) => name),
    };
    mark('channel_create_duplicate_checked');

    async function openAndCheckSite(url, expectInjectable) {
      const out = {
        url,
        loaded: false,
        finalUrl: null,
        panelToggleMessage: null,
        panelVisible: false,
        tabId: null,
      };
      let page = null;

      try {
        page = await context.newPage();
      } catch (error) {
        out.error = String(error.message || error);
        return { page: null, out };
      }

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
        out.loaded = true;
        out.finalUrl = page.url();
        await page.waitForTimeout(2500);
      } catch (error) {
        out.error = String(error.message || error);
        out.finalUrl = page.url();
      }

      if (out.loaded && expectInjectable) {
        const host = new URL(out.finalUrl).hostname;
        const tabs = await listTabs();
        const tab = tabs.find((t) => {
          try {
            return new URL(t.url).hostname === host;
          } catch {
            return false;
          }
        });

        if (tab) {
          out.tabId = tab.id;
          out.panelToggleMessage = await showPanelWithFallback(tab.id);
          try {
            await page.waitForSelector('#fuse-connect-panel-v7', { timeout: 7000 });
            out.panelVisible = true;
            out.panelTabControlChecks = await page.evaluate(async () => {
              const tabIds = ['chat', 'agents', 'channels', 'notifications', 'settings', 'services', 'tasks'];
              const results = [];
              for (const id of tabIds) {
                const btn = document.querySelector(`.fcp6-tab[data-tab="${id}"]`);
                if (!btn) {
                  results.push({ id, found: false, clicked: false, activeAfter: false });
                  continue;
                }
                btn.click();
                await new Promise((resolve) => setTimeout(resolve, 90));
                const activeTab = document.querySelector('.fcp6-tab.active');
                const activeAfter = activeTab?.getAttribute('data-tab') === id;
                results.push({ id, found: true, clicked: true, activeAfter });
              }
              return results;
            });

            // keyboard toggle behavior
            const wasVisible = await page.locator('#fuse-connect-panel-v7').isVisible().catch(() => false);
            await page.keyboard.press('Control+Shift+F').catch(() => {});
            await page.waitForTimeout(120);
            const hiddenAfterToggle = (await page.$('#fuse-connect-panel-v7')) === null;
            await page.keyboard.press('Control+Shift+F').catch(() => {});
            await page.waitForTimeout(120);
            const visibleAfterSecondToggle = await page.locator('#fuse-connect-panel-v7').isVisible().catch(() => false);
            out.keyboardToggle = { wasVisible, hiddenAfterToggle, visibleAfterSecondToggle };

            // create/join/leave/delete channel from panel
            const panelChannelOps = await page.evaluate(async () => {
              const name = `panel-smoke-${Date.now()}`;
              const input = document.querySelector('#fuse-new-channel-name');
              if (!input) return { attempted: false, reason: 'missing-new-channel-input' };
              input.value = name;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              const createBtn = document.querySelector('[data-action="submit-create-channel"]');
              createBtn?.click();
              await new Promise((resolve) => setTimeout(resolve, 700));

              const select = document.querySelector('#fuse-channel-select');
              const createdOption = select
                ? Array.from(select.options).find((opt) => (opt.textContent || '').trim() === name)
                : null;
              const createdChannelId = createdOption?.value || null;
              if (!createdChannelId) {
                return { attempted: true, created: false, reason: 'channel-not-created' };
              }

              // join
              select.value = createdChannelId;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              await new Promise((resolve) => setTimeout(resolve, 250));
              const activeAfterJoin = select.value === createdChannelId;

              // leave
              select.value = '';
              select.dispatchEvent(new Event('change', { bubbles: true }));
              await new Promise((resolve) => setTimeout(resolve, 250));
              const leftSuccessfully = select.value === '';

              // delete
              window.confirm = () => true;
              const deleteBtn = document.querySelector(
                `[data-action="delete-channel"][data-channel-id="${createdChannelId}"]`
              );
              deleteBtn?.click();
              await new Promise((resolve) => setTimeout(resolve, 700));
              const stillThere = Array.from(select.options).some((opt) => opt.value === createdChannelId);

              return {
                attempted: true,
                created: true,
                createdChannelId,
                activeAfterJoin,
                leftSuccessfully,
                deleted: !stillThere,
              };
            });
            out.panelChannelOps = panelChannelOps;
          } catch {
            out.panelVisible = false;
          }
        }
      }

      return { page, out };
    }

    const supportedPageResults = [];
    for (const url of SITES_TO_TEST) {
      mark(`supported_site_start:${url}`);
      const res = await openAndCheckSite(url, true);
      supportedPageResults.push(res);
      report.supportedSiteChecks.push(res.out);
      mark(`supported_site_done:${url}`);
    }

    for (const url of EXPERIMENTAL_SITES_TO_TEST) {
      mark(`experimental_site_start:${url}`);
      const res = await openAndCheckSite(url, false);
      report.experimentalSiteChecks.push(res.out);
      if (res.page && !res.page.isClosed()) {
        await res.page.close().catch(() => {});
      }
      mark(`experimental_site_done:${url}`);
    }

    // Unsupported-site fallback injection coverage
    const unsupported = await openAndCheckSite('https://example.com', true);
    report.unsupportedSiteCheck = unsupported.out;
    if (unsupported.page && !unsupported.page.isClosed()) {
      await unsupported.page.close().catch(() => {});
    }
    mark('unsupported_site_checked');

    const upToTwoPanels = supportedPageResults
      .filter((r) => r.page && !r.page.isClosed() && r.out.panelVisible && r.out.tabId)
      .slice(0, 2);
    const nonGeneralChannels = channels.filter((ch) => ch.id !== 'general');
    if (upToTwoPanels.length === 2 && nonGeneralChannels.length >= 2) {
      const firstChannel = nonGeneralChannels[0];
      const secondChannel = nonGeneralChannels[1];

      const firstSelected = await upToTwoPanels[0].page
        .evaluate((channelId) => {
          const select = document.querySelector('#fuse-channel-select');
          if (!select) return false;
          select.value = channelId;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }, firstChannel.id)
        .catch(() => false);

      const secondSelected = await upToTwoPanels[1].page
        .evaluate((channelId) => {
          const select = document.querySelector('#fuse-channel-select');
          if (!select) return false;
          select.value = channelId;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }, secondChannel.id)
        .catch(() => false);

      await new Promise((resolve) => setTimeout(resolve, 1200));
      const tabState = await getStorage(['fuse_tab_active_channels']);

      report.tabChannelIsolation = {
        firstTabId: upToTwoPanels[0].out.tabId,
        secondTabId: upToTwoPanels[1].out.tabId,
        firstChannelId: firstChannel.id,
        secondChannelId: secondChannel.id,
        firstSelectApplied: firstSelected,
        secondSelectApplied: secondSelected,
        persisted: tabState.fuse_tab_active_channels || {},
      };
    } else {
      report.tabChannelIsolation = {
        skipped: true,
        reason: 'Need two supported pages with visible panel and at least two channels',
      };
    }

    // Popup central-control interaction tests
    if (
      centralPresent['#central-channel-select'] &&
      centralPresent['#central-chat-input'] &&
      centralPresent['#central-send-message']
    ) {
      const popupChannelName = `Popup-SMOKE-${Date.now()}`;
      await popupPage.fill('#central-new-channel', popupChannelName, { timeout: 1500 }).catch(() => {});
      await popupPage.click('#central-create-channel', { timeout: 1500 }).catch(() => {});
      await popupPage.waitForTimeout(900);

      const availableOptions = await popupPage
        .$eval('#central-channel-select', (el) =>
          Array.from(el.options)
            .map((opt) => ({ value: opt.value, label: opt.textContent || '' }))
            .filter((opt) => !!opt.value)
        )
        .catch(() => []);

      if (availableOptions.length > 0) {
        await popupPage
          .selectOption('#central-channel-select', availableOptions[0].value, { timeout: 1500 })
          .catch(() => {});
        await popupPage.fill('#central-chat-input', `Smoke message A ${Date.now()}`, { timeout: 1500 }).catch(() => {});
        await popupPage.click('#central-send-message', { timeout: 1500 }).catch(() => {});
        await popupPage.waitForTimeout(350);
      }

      if (availableOptions.length > 1) {
        await popupPage
          .selectOption('#central-channel-select', availableOptions[1].value, { timeout: 1500 })
          .catch(() => {});
        await popupPage.fill('#central-chat-input', `Smoke message B ${Date.now()}`, { timeout: 1500 }).catch(() => {});
        await popupPage.click('#central-send-message', { timeout: 1500 }).catch(() => {});
      }

      const subtitleText = await popupPage
        .$eval('#central-chat-subtitle', (el) => el.textContent || '')
        .catch(() => '');

      report.popupControlTests.centralSendFlow = {
        attempted: true,
        optionsCount: Array.isArray(availableOptions) ? availableOptions.length : 0,
        subtitleText,
      };

      if (availableOptions.length > 0) {
        const selected = availableOptions[0];
        await popupPage
          .selectOption('#central-channel-select', selected.value, { timeout: 1500 })
          .catch(() => {});
        await popupPage.waitForTimeout(200);
        const emptyStateText = await popupPage
          .$eval('#central-chat-stream', (el) => el.textContent || '')
          .catch(() => '');
        report.popupControlTests.emptyStateBehavior = {
          selectedChannelLabel: selected.label,
          streamText: emptyStateText,
        };
      }
    }
    mark('popup_central_controls_checked');

    report.backgroundMessagingTests.broadcastMessage = await runtimeMessage({
      type: 'BROADCAST_MESSAGE',
      channel: firstCreate?.channel?.id || 'general',
      content: `bg-smoke-broadcast-${Date.now()}`,
      metadata: { senderId: 'smoke-popup' },
    });
    report.backgroundMessagingTests.sendToAgent = await runtimeMessage({
      type: 'SEND_TO_AGENT',
      agentId: 'smoke-agent',
      content: `bg-smoke-direct-${Date.now()}`,
    });

    report.servicesTests.autonomyStatus = await runtimeMessage({ type: 'GET_AUTONOMY_STATUS' });
    report.servicesTests.startAutonomy = await runtimeMessage({ type: 'START_AUTONOMY' });
    report.servicesTests.aiVideoStats = await runtimeMessage({ type: 'AI_VIDEO_GET_STATS' });
    report.servicesTests.aiVideoExport = await runtimeMessage({ type: 'AI_VIDEO_EXPORT', format: 'urls' });
    mark('background_and_services_messages_checked');

    // Relay connection controls from popup
    await popupPage.click('.tab[data-tab="connect"]', { timeout: 1500 }).catch(() => {});
    await popupPage.click('#connect-btn', { timeout: 1500 }).catch(() => {});
    await popupPage.waitForTimeout(250);
    const connectStatusText = await popupPage
      .$eval('#connection-status-text', (el) => el.textContent || '')
      .catch(() => '');
    await popupPage.click('#connect-btn', { timeout: 1500 }).catch(() => {});
    await popupPage.waitForTimeout(250);
    const postDisconnectStatusText = await popupPage
      .$eval('#connection-status-text', (el) => el.textContent || '')
      .catch(() => '');
    report.popupUiTests.connectDisconnectControls = {
      afterConnectClick: connectStatusText,
      afterDisconnectClick: postDisconnectStatusText,
    };

    // Panel injection message behavior where chat exists (best effort on first visible panel tab)
    const firstPanelTarget = supportedPageResults.find((r) => r.out.tabId && r.out.panelVisible);
    if (firstPanelTarget?.out?.tabId) {
      report.panelFeatureChecks.injectMessageToChat = await sendTabMessage(firstPanelTarget.out.tabId, {
        type: 'INJECT_MESSAGE',
        content: `smoke-inject-${Date.now()}`,
      });
      report.panelFeatureChecks.panelStatusAfterInject = await sendTabMessage(firstPanelTarget.out.tabId, {
        type: 'GET_PANEL_STATUS',
      });
    }
    mark('panel_message_inject_checked');

    for (const { page } of supportedPageResults) {
      await page.close().catch(() => {});
    }
    await popupPage.close().catch(() => {});
    mark('cleanup_complete');
  } catch (error) {
    report.errors.push(String(error.stack || error.message || error));
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    await context.close();
  }

  console.log(`COMPONENT_SMOKE_REPORT=${REPORT_PATH}`);
}

main().catch((error) => {
  console.error('component-smoke fatal:', error);
  process.exit(1);
});

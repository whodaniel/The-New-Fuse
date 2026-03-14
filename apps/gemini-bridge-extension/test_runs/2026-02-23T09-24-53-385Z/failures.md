- Fatal runner error: browserType.launchPersistentContext: Target page, context
  or browser has been closed Browser logs:

<launching>
/path/to/Library/Caches/ms-playwright/chromium-1208/chrome-mac-x64/Google Chrome
for Testing.app/Contents/MacOS/Google Chrome for Testing
--disable-field-trial-config --disable-background-networking
--disable-background-timer-throttling --disable-backgrounding-occluded-windows
--disable-back-forward-cache --disable-breakpad
--disable-client-side-phishing-detection
--disable-component-extensions-with-background-pages --disable-component-update
--no-default-browser-check --disable-default-apps --disable-dev-shm-usage
--disable-extensions
--disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints
--enable-features=CDPScreenshotNewSurface --allow-pre-commit-input
--disable-hang-monitor --disable-ipc-flooding-protection
--disable-popup-blocking --disable-prompt-on-repost
--disable-renderer-backgrounding --force-color-profile=srgb
--metrics-recording-only --no-first-run --password-store=basic
--use-mock-keychain --no-service-autorun --export-tagged-pdf
--disable-search-engine-choice-screen
--unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch
--enable-automation --disable-infobars --disable-search-engine-choice-screen
--disable-sync --no-sandbox
--disable-extensions-except=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7
--load-extension=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7
--user-data-dir=/var/folders/tr/dm8vp49j06x047vp19yt_91w0000gn/T/playwright_chromiumdev_profile-YU6oR3
--remote-debugging-pipe about:blank <launched> pid=53963 [pid=53963][err]
[0223/042454.209207:ERROR:third_party/crashpad/crashpad/util/mach/bootstrap.cc:65]
bootstrap_check_in
org.chromium.crashpad.child_port_handshake.53967.740003.HJAUKNRSGLHMWNUJ:
Permission denied (1100) [pid=53963][err]
[0223/042454.210506:ERROR:third_party/crashpad/crashpad/util/file/file_io.cc:103]
ReadExactly: expected 4, observed 0 [pid=53963][err]
[0223/042454.211828:ERROR:third_party/crashpad/crashpad/util/mach/bootstrap.cc:65]
bootstrap_check_in
org.chromium.crashpad.child_port_handshake.53965.740001.DHHSLAXDJNXIRAAD:
Permission denied (1100) [pid=53963][err]
[0223/042454.213084:ERROR:third_party/crashpad/crashpad/util/file/file_io.cc:103]
ReadExactly: expected 4, observed 0 [pid=53963][err] Received signal 6
[pid=53963][err] [0x000118491a33] [pid=53963][err] [0x000118495ce3]
[pid=53963][err] [0x7ff81e30edfd] [pid=53963][err] [0x000000000001]
[pid=53963][err] [0x7ff81e244d14] [pid=53963][err] [0x7ff823e38508]
[pid=53963][err] [0x7ff823e34fb6] [pid=53963][err] [0x7ff827043a0f]
[pid=53963][err] [0x7ff827043997] [pid=53963][err] [0x7ff820dc5573]
[pid=53963][err] [0x7ff820dc32c2] [pid=53963][err] [0x7ff820dc2f05]
[pid=53963][err] [0x000112b4b26c] [pid=53963][err] [0x0001134fe12f]
[pid=53963][err] [0x0001134fdf15] [pid=53963][err] [0x0001145bfed8]
[pid=53963][err] [0x000112d56986] [pid=53963][err] [0x0001106dfe8b]
[pid=53963][err] [0x000100af380d] [pid=53963][err] [0x00011062852e]
[pid=53963][err] [end of stack trace] Call log: [2m - <launching>
/path/to/Library/Caches/ms-playwright/chromium-1208/chrome-mac-x64/Google Chrome
for Testing.app/Contents/MacOS/Google Chrome for Testing
--disable-field-trial-config --disable-background-networking
--disable-background-timer-throttling --disable-backgrounding-occluded-windows
--disable-back-forward-cache --disable-breakpad
--disable-client-side-phishing-detection
--disable-component-extensions-with-background-pages --disable-component-update
--no-default-browser-check --disable-default-apps --disable-dev-shm-usage
--disable-extensions
--disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints
--enable-features=CDPScreenshotNewSurface --allow-pre-commit-input
--disable-hang-monitor --disable-ipc-flooding-protection
--disable-popup-blocking --disable-prompt-on-repost
--disable-renderer-backgrounding --force-color-profile=srgb
--metrics-recording-only --no-first-run --password-store=basic
--use-mock-keychain --no-service-autorun --export-tagged-pdf
--disable-search-engine-choice-screen
--unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch
--enable-automation --disable-infobars --disable-search-engine-choice-screen
--disable-sync --no-sandbox
--disable-extensions-except=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7
--load-extension=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7
--user-data-dir=/var/folders/tr/dm8vp49j06x047vp19yt_91w0000gn/T/playwright_chromiumdev_profile-YU6oR3
--remote-debugging-pipe about:blank[22m [2m - <launched> pid=53963[22m [2m -
[pid=53963][err]
[0223/042454.209207:ERROR:third_party/crashpad/crashpad/util/mach/bootstrap.cc:65]
bootstrap_check_in
org.chromium.crashpad.child_port_handshake.53967.740003.HJAUKNRSGLHMWNUJ:
Permission denied (1100)[22m [2m - [pid=53963][err]
[0223/042454.210506:ERROR:third_party/crashpad/crashpad/util/file/file_io.cc:103]
ReadExactly: expected 4, observed 0[22m [2m - [pid=53963][err]
[0223/042454.211828:ERROR:third_party/crashpad/crashpad/util/mach/bootstrap.cc:65]
bootstrap_check_in
org.chromium.crashpad.child_port_handshake.53965.740001.DHHSLAXDJNXIRAAD:
Permission denied (1100)[22m [2m - [pid=53963][err]
[0223/042454.213084:ERROR:third_party/crashpad/crashpad/util/file/file_io.cc:103]
ReadExactly: expected 4, observed 0[22m [2m - [pid=53963][err] Received signal
6[22m [2m - [pid=53963][err] [0x000118491a33][22m [2m - [pid=53963][err]
[0x000118495ce3][22m [2m - [pid=53963][err] [0x7ff81e30edfd][22m [2m -
[pid=53963][err] [0x000000000001][22m [2m - [pid=53963][err]
[0x7ff81e244d14][22m [2m - [pid=53963][err] [0x7ff823e38508][22m [2m -
[pid=53963][err] [0x7ff823e34fb6][22m [2m - [pid=53963][err]
[0x7ff827043a0f][22m [2m - [pid=53963][err] [0x7ff827043997][22m [2m -
[pid=53963][err] [0x7ff820dc5573][22m [2m - [pid=53963][err]
[0x7ff820dc32c2][22m [2m - [pid=53963][err] [0x7ff820dc2f05][22m [2m -
[pid=53963][err] [0x000112b4b26c][22m [2m - [pid=53963][err]
[0x0001134fe12f][22m [2m - [pid=53963][err] [0x0001134fdf15][22m [2m -
[pid=53963][err] [0x0001145bfed8][22m [2m - [pid=53963][err]
[0x000112d56986][22m [2m - [pid=53963][err] [0x0001106dfe8b][22m [2m -
[pid=53963][err] [0x000100af380d][22m [2m - [pid=53963][err]
[0x00011062852e][22m [2m - [pid=53963][err] [end of stack trace][22m [2m -
[pid=53963] <gracefully close start>[22m [2m - [pid=53963] <kill>[22m [2m -
[pid=53963] <will force kill>[22m [2m - [pid=53963] exception while trying to
kill process: Error: kill EPERM[22m [2m - [pid=53963]
<process did exit: exitCode=null, signal=SIGABRT>[22m [2m - [pid=53963] starting
temporary directories cleanup[22m [2m - [pid=53963] finished temporary
directories cleanup[22m [2m - [pid=53963] <gracefully close end>[22m

    at async main (/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/scripts/system-qa-loop.cjs:47:15)

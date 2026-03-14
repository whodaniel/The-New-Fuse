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
--disable-sync --no-sandbox --disable-crash-reporter --disable-breakpad
--disable-extensions-except=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7
--load-extension=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7
--user-data-dir=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/test_runs/2026-02-23T09-35-18-532Z/pw-profile
--remote-debugging-pipe about:blank <launched> pid=55553 [pid=55553][err]
[0223/043523.048567:ERROR:third_party/crashpad/crashpad/util/mach/bootstrap.cc:65]
bootstrap_check_in
org.chromium.crashpad.child_port_handshake.55557.746920.GQHYZRHKZQYFZDRI:
Permission denied (1100) [pid=55553][err]
[0223/043523.049842:ERROR:third_party/crashpad/crashpad/util/file/file_io.cc:103]
ReadExactly: expected 4, observed 0 [pid=55553][err]
[0223/043523.051318:ERROR:third_party/crashpad/crashpad/util/mach/bootstrap.cc:65]
bootstrap_check_in
org.chromium.crashpad.child_port_handshake.55555.746918.UQRKOATMSOPOHGFY:
Permission denied (1100) [pid=55553][err]
[0223/043523.052245:ERROR:third_party/crashpad/crashpad/util/file/file_io.cc:103]
ReadExactly: expected 4, observed 0 [pid=55553][err]
[0223/043523.053369:ERROR:third_party/crashpad/crashpad/util/file/file_io_posix.cc:208]
open /path/to/Library/Application Support/Google/Chrome for
Testing/Crashpad/settings.dat: Operation not permitted (1) [pid=55553][err]
[0223/043523.053696:ERROR:third_party/crashpad/crashpad/util/file/file_io_posix.cc:208]
open /path/to/Library/Application Support/Google/Chrome for
Testing/Crashpad/settings.dat: Operation not permitted (1) [pid=55553][err]
Received signal 6 [pid=55553][err] [0x00012a26ba33] [pid=55553][err]
[0x00012a26fce3] [pid=55553][err] [0x7ff81e30edfd] [pid=55553][err]
[0x000000000001] [pid=55553][err] [0x7ff81e244d14] [pid=55553][err]
[0x7ff823e38508] [pid=55553][err] [0x7ff823e34fb6] [pid=55553][err]
[0x7ff827043a0f] [pid=55553][err] [0x7ff827043997] [pid=55553][err]
[0x7ff820dc5573] [pid=55553][err] [0x7ff820dc32c2] [pid=55553][err]
[0x7ff820dc2f05] [pid=55553][err] [0x00012492526c] [pid=55553][err]
[0x0001252d812f] [pid=55553][err] [0x0001252d7f15] [pid=55553][err]
[0x000126399ed8] [pid=55553][err] [0x000124b30986] [pid=55553][err]
[0x0001224b9e8b] [pid=55553][err] [0x00010753780d] [pid=55553][err]
[0x000113d9a52e] [pid=55553][err] [end of stack trace] Call log: [2m -
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
--disable-sync --no-sandbox --disable-crash-reporter --disable-breakpad
--disable-extensions-except=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7
--load-extension=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7
--user-data-dir=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/test_runs/2026-02-23T09-35-18-532Z/pw-profile
--remote-debugging-pipe about:blank[22m [2m - <launched> pid=55553[22m [2m -
[pid=55553][err]
[0223/043523.048567:ERROR:third_party/crashpad/crashpad/util/mach/bootstrap.cc:65]
bootstrap_check_in
org.chromium.crashpad.child_port_handshake.55557.746920.GQHYZRHKZQYFZDRI:
Permission denied (1100)[22m [2m - [pid=55553][err]
[0223/043523.049842:ERROR:third_party/crashpad/crashpad/util/file/file_io.cc:103]
ReadExactly: expected 4, observed 0[22m [2m - [pid=55553][err]
[0223/043523.051318:ERROR:third_party/crashpad/crashpad/util/mach/bootstrap.cc:65]
bootstrap_check_in
org.chromium.crashpad.child_port_handshake.55555.746918.UQRKOATMSOPOHGFY:
Permission denied (1100)[22m [2m - [pid=55553][err]
[0223/043523.052245:ERROR:third_party/crashpad/crashpad/util/file/file_io.cc:103]
ReadExactly: expected 4, observed 0[22m [2m - [pid=55553][err]
[0223/043523.053369:ERROR:third_party/crashpad/crashpad/util/file/file_io_posix.cc:208]
open /path/to/Library/Application Support/Google/Chrome for
Testing/Crashpad/settings.dat: Operation not permitted (1)[22m [2m -
[pid=55553][err]
[0223/043523.053696:ERROR:third_party/crashpad/crashpad/util/file/file_io_posix.cc:208]
open /path/to/Library/Application Support/Google/Chrome for
Testing/Crashpad/settings.dat: Operation not permitted (1)[22m [2m -
[pid=55553][err] Received signal 6[22m [2m - [pid=55553][err]
[0x00012a26ba33][22m [2m - [pid=55553][err] [0x00012a26fce3][22m [2m -
[pid=55553][err] [0x7ff81e30edfd][22m [2m - [pid=55553][err]
[0x000000000001][22m [2m - [pid=55553][err] [0x7ff81e244d14][22m [2m -
[pid=55553][err] [0x7ff823e38508][22m [2m - [pid=55553][err]
[0x7ff823e34fb6][22m [2m - [pid=55553][err] [0x7ff827043a0f][22m [2m -
[pid=55553][err] [0x7ff827043997][22m [2m - [pid=55553][err]
[0x7ff820dc5573][22m [2m - [pid=55553][err] [0x7ff820dc32c2][22m [2m -
[pid=55553][err] [0x7ff820dc2f05][22m [2m - [pid=55553][err]
[0x00012492526c][22m [2m - [pid=55553][err] [0x0001252d812f][22m [2m -
[pid=55553][err] [0x0001252d7f15][22m [2m - [pid=55553][err]
[0x000126399ed8][22m [2m - [pid=55553][err] [0x000124b30986][22m [2m -
[pid=55553][err] [0x0001224b9e8b][22m [2m - [pid=55553][err]
[0x00010753780d][22m [2m - [pid=55553][err] [0x000113d9a52e][22m [2m -
[pid=55553][err] [end of stack trace][22m [2m - [pid=55553]
<gracefully close start>[22m [2m - [pid=55553] <kill>[22m [2m - [pid=55553]
<will force kill>[22m [2m - [pid=55553] exception while trying to kill process:
Error: kill EPERM[22m [2m - [pid=55553]
<process did exit: exitCode=null, signal=SIGABRT>[22m [2m - [pid=55553] starting
temporary directories cleanup[22m [2m - [pid=55553] finished temporary
directories cleanup[22m [2m - [pid=55553] <gracefully close end>[22m

    at async main (/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/scripts/system-qa-loop.cjs:52:19)

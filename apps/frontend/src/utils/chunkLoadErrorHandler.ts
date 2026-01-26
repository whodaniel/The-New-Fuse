/**
 * Chunk Load Error Handler
 *
 * Handles "Failed to fetch dynamically imported module" errors
 * that occur when:
 * 1. A new deployment happens and old chunks are no longer available
 * 2. Network issues prevent chunk loading
 * 3. Cache mismatches between HTML and JS chunks
 *
 * Solution: Detect chunk load failures and reload the page to get fresh HTML + chunks
 */

const CHUNK_LOAD_ERROR_MESSAGES = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Unable to preload CSS',
];

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

let retryCount = 0;
let isReloading = false;

/**
 * Check if an error is a chunk loading error
 */
export function isChunkLoadError(error: Error): boolean {
  const message = error.message || error.toString();
  return CHUNK_LOAD_ERROR_MESSAGES.some((msg) => message.toLowerCase().includes(msg.toLowerCase()));
}

/**
 * Handle chunk load error by reloading the page
 * This ensures we get fresh HTML with correct chunk references
 */
export function handleChunkLoadError(error: Error): void {
  if (!isChunkLoadError(error)) {
    return; // Not a chunk load error, let it propagate
  }

  console.warn('[Chunk Load Error]', error.message);

  // Prevent multiple simultaneous reload attempts
  if (isReloading) {
    console.log('[Chunk Load Error] Already reloading, ignoring...');
    return;
  }

  retryCount++;

  if (retryCount > MAX_RETRIES) {
    console.error('[Chunk Load Error] Max retries reached. Please refresh manually.');
    // Show user-friendly error message
    showChunkErrorModal();
    return;
  }

  console.log(`[Chunk Load Error] Attempting reload (${retryCount}/${MAX_RETRIES})...`);
  isReloading = true;

  // Clear cache and reload
  setTimeout(() => {
    // Force a hard reload to bypass cache
    window.location.reload();
  }, RETRY_DELAY);
}

/**
 * Show a user-friendly modal when chunk loading fails
 */
function showChunkErrorModal(): void {
  const existingModal = document.getElementById('chunk-error-modal');
  if (existingModal) {
    return; // Modal already shown
  }

  const modal = document.createElement('div');
  modal.id = 'chunk-error-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 32px;
    border-radius: 12px;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;

  content.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px;">🔄</div>
    <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 24px;">Update Available</h2>
    <p style="margin: 0 0 24px 0; color: #666; font-size: 16px; line-height: 1.5;">
      A new version of The New Fuse has been deployed. Please refresh the page to get the latest updates.
    </p>
    <button id="refresh-button" style="
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    ">
      Refresh Now
    </button>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Add hover effect
  const button = document.getElementById('refresh-button');
  if (button) {
    button.addEventListener('mouseenter', () => {
      button.style.background = '#2563eb';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = '#3b82f6';
    });
    button.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

/**
 * Install global error handlers for chunk load errors
 */
export function installChunkErrorHandlers(): void {
  // Handle unhandled promise rejections (most common for dynamic imports)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error instanceof Error && isChunkLoadError(error)) {
      event.preventDefault(); // Prevent default error logging
      handleChunkLoadError(error);
    }
  });

  // Handle regular errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    if (error instanceof Error && isChunkLoadError(error)) {
      event.preventDefault(); // Prevent default error logging
      handleChunkLoadError(error);
    }
  });

  console.log('[Chunk Load Error Handler] Installed global handlers');
}

/**
 * Wrap a lazy import with automatic retry on chunk load failure
 */
export function retryLazyImport<T>(importFn: () => Promise<T>, retries = 3): Promise<T> {
  return new Promise((resolve, reject) => {
    importFn()
      .then(resolve)
      .catch((error) => {
        if (isChunkLoadError(error) && retries > 0) {
          console.log(`[Chunk Retry] Retrying import... (${retries} retries left)`);
          // Wait a bit before retrying
          setTimeout(() => {
            retryLazyImport(importFn, retries - 1)
              .then(resolve)
              .catch(reject);
          }, 500);
        } else {
          reject(error);
        }
      });
  });
}

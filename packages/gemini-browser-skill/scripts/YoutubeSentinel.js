'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
const playwright_1 = require('playwright');
const STATE_FILE_PATH =
  '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/transcript-v2-state.json';
const POLL_INTERVAL = 30000; // 30 seconds
async function monitorActiveTab() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
  console.log('[Sentinel] Monitoring profile:', profileDir);
  const context = await playwright_1.chromium.launchPersistentContext(profileDir, {
    headless: false, // Must be non-headless to see what user is watching
    channel: 'chrome',
  });
  console.log('[Sentinel] Always-on detection active. Polling every 30s...');
  setInterval(async () => {
    var _a;
    try {
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        if (url.includes('youtube.com/watch?v=')) {
          const videoId = (_a = url.match(/v=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1];
          if (videoId && !isAlreadyInState(videoId)) {
            console.log(
              `[Sentinel] 🎯 New video detected: ${videoId}. Triggering shadow ingestion...`
            );
            await triggerIngestion(page, videoId);
          }
        }
      }
    } catch (e) {
      console.error('[Sentinel] Polling error:', e.message);
    }
  }, POLL_INTERVAL);
}
function isAlreadyInState(videoId) {
  if (!fs.existsSync(STATE_FILE_PATH)) return false;
  const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
  return state.queue.some((v) => v.videoId === videoId);
}
async function triggerIngestion(page, videoId) {
  const title = await page.title();
  console.log(`[Sentinel] Queueing "${title}" for processing.`);
  // In a real implementation, this would call the TranscriptProcessorV2 logic
  // or add to the state file and signal the processor.
  // For now, we update the state.
  const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
  const maxIndex = state.queue.reduce((max, v) => Math.max(max, v.index || 0), 0);
  state.queue.unshift({
    index: maxIndex + 1,
    url: page.url().split('&')[0],
    title: title.replace(' - YouTube', ''),
    videoId,
    status: 'pending',
    processingAttempts: 0,
    detectedBy: 'Sentinel',
  });
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
  console.log(`[Sentinel] Video #${maxIndex + 1} added to queue.`);
}
monitorActiveTab().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWW91dHViZVNlbnRpbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiWW91dHViZVNlbnRpbmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3QiwyQ0FBaUQ7QUFFakQsTUFBTSxlQUFlLEdBQUcsb0ZBQW9GLENBQUM7QUFDN0csTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLENBQUMsYUFBYTtBQUUxQyxLQUFLLFVBQVUsZ0JBQWdCO0lBQzdCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksTUFBTSxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDeEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUUxRCxNQUFNLE9BQU8sR0FBRyxNQUFNLHFCQUFRLENBQUMsdUJBQXVCLENBQUMsVUFBVSxFQUFFO1FBQ2pFLFFBQVEsRUFBRSxLQUFLLEVBQUUsb0RBQW9EO1FBQ3JFLE9BQU8sRUFBRSxRQUFRO0tBQ2xCLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsNkRBQTZELENBQUMsQ0FBQztJQUUzRSxXQUFXLENBQUMsS0FBSyxJQUFJLEVBQUU7O1FBQ3JCLElBQUksQ0FBQztZQUNILE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUM7b0JBQ3pDLE1BQU0sT0FBTyxHQUFHLE1BQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsMENBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLElBQUksT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsT0FBTyxrQ0FBa0MsQ0FBQyxDQUFDO3dCQUM1RixNQUFNLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDeEMsQ0FBQztnQkFDSCxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2xCLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELENBQUM7SUFDSCxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDcEIsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBZTtJQUN2QyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUNsRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDcEUsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxPQUFPLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRUQsS0FBSyxVQUFVLGdCQUFnQixDQUFDLElBQVUsRUFBRSxPQUFlO0lBQ3ZELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEtBQUssbUJBQW1CLENBQUMsQ0FBQztJQUU5RCw2RUFBNkU7SUFDN0UscURBQXFEO0lBQ3JELGdDQUFnQztJQUNoQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDcEUsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFXLEVBQUUsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTdGLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQ2hCLEtBQUssRUFBRSxRQUFRLEdBQUcsQ0FBQztRQUNuQixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztRQUN0QyxPQUFPO1FBQ1AsTUFBTSxFQUFFLFNBQVM7UUFDakIsa0JBQWtCLEVBQUUsQ0FBQztRQUNyQixVQUFVLEVBQUUsVUFBVTtLQUN6QixDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixRQUFRLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFFRCxnQkFBZ0IsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY2hyb21pdW0sIHR5cGUgUGFnZSB9IGZyb20gJ3BsYXl3cmlnaHQnO1xuXG5jb25zdCBTVEFURV9GSUxFX1BBVEggPSAnL1VzZXJzLzxvd25lcj4vRGVza3RvcC9BMS1JbnRlci1MTE0tQ29tL1RoZS1OZXctRnVzZS9kYXRhL3RyYW5zY3JpcHQtdjItc3RhdGUuanNvbic7XG5jb25zdCBQT0xMX0lOVEVSVkFMID0gMzAwMDA7IC8vIDMwIHNlY29uZHNcblxuYXN5bmMgZnVuY3Rpb24gbW9uaXRvckFjdGl2ZVRhYigpIHtcbiAgY29uc3QgcHJvZmlsZURpciA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FIHx8ICcvdG1wJywgJy52aWRlby1wcm9jZXNzb3ItY2hyb21lLWFsdCcpO1xuICBjb25zb2xlLmxvZygnW1NlbnRpbmVsXSBNb25pdG9yaW5nIHByb2ZpbGU6JywgcHJvZmlsZURpcik7XG5cbiAgY29uc3QgY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICBoZWFkbGVzczogZmFsc2UsIC8vIE11c3QgYmUgbm9uLWhlYWRsZXNzIHRvIHNlZSB3aGF0IHVzZXIgaXMgd2F0Y2hpbmdcbiAgICBjaGFubmVsOiAnY2hyb21lJyxcbiAgfSk7XG5cbiAgY29uc29sZS5sb2coJ1tTZW50aW5lbF0gQWx3YXlzLW9uIGRldGVjdGlvbiBhY3RpdmUuIFBvbGxpbmcgZXZlcnkgMzBzLi4uJyk7XG5cbiAgc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYWdlcyA9IGNvbnRleHQucGFnZXMoKTtcbiAgICAgIGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xuICAgICAgICBjb25zdCB1cmwgPSBwYWdlLnVybCgpO1xuICAgICAgICBpZiAodXJsLmluY2x1ZGVzKCd5b3V0dWJlLmNvbS93YXRjaD92PScpKSB7XG4gICAgICAgICAgY29uc3QgdmlkZW9JZCA9IHVybC5tYXRjaCgvdj0oW14mXSspLyk/LlsxXTtcbiAgICAgICAgICBpZiAodmlkZW9JZCAmJiAhaXNBbHJlYWR5SW5TdGF0ZSh2aWRlb0lkKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtTZW50aW5lbF0g8J+OryBOZXcgdmlkZW8gZGV0ZWN0ZWQ6ICR7dmlkZW9JZH0uIFRyaWdnZXJpbmcgc2hhZG93IGluZ2VzdGlvbi4uLmApO1xuICAgICAgICAgICAgYXdhaXQgdHJpZ2dlckluZ2VzdGlvbihwYWdlLCB2aWRlb0lkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbU2VudGluZWxdIFBvbGxpbmcgZXJyb3I6JywgZS5tZXNzYWdlKTtcbiAgICB9XG4gIH0sIFBPTExfSU5URVJWQUwpO1xufVxuXG5mdW5jdGlvbiBpc0FscmVhZHlJblN0YXRlKHZpZGVvSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoU1RBVEVfRklMRV9QQVRIKSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKFNUQVRFX0ZJTEVfUEFUSCwgJ3V0Zi04JykpO1xuICByZXR1cm4gc3RhdGUucXVldWUuc29tZSgodjogYW55KSA9PiB2LnZpZGVvSWQgPT09IHZpZGVvSWQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB0cmlnZ2VySW5nZXN0aW9uKHBhZ2U6IFBhZ2UsIHZpZGVvSWQ6IHN0cmluZykge1xuICAgIGNvbnN0IHRpdGxlID0gYXdhaXQgcGFnZS50aXRsZSgpO1xuICAgIGNvbnNvbGUubG9nKGBbU2VudGluZWxdIFF1ZXVlaW5nIFwiJHt0aXRsZX1cIiBmb3IgcHJvY2Vzc2luZy5gKTtcbiAgICBcbiAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgY2FsbCB0aGUgVHJhbnNjcmlwdFByb2Nlc3NvclYyIGxvZ2ljIFxuICAgIC8vIG9yIGFkZCB0byB0aGUgc3RhdGUgZmlsZSBhbmQgc2lnbmFsIHRoZSBwcm9jZXNzb3IuXG4gICAgLy8gRm9yIG5vdywgd2UgdXBkYXRlIHRoZSBzdGF0ZS5cbiAgICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKFNUQVRFX0ZJTEVfUEFUSCwgJ3V0Zi04JykpO1xuICAgIGNvbnN0IG1heEluZGV4ID0gc3RhdGUucXVldWUucmVkdWNlKChtYXg6IG51bWJlciwgdjogYW55KSA9PiBNYXRoLm1heChtYXgsIHYuaW5kZXggfHwgMCksIDApO1xuICAgIFxuICAgIHN0YXRlLnF1ZXVlLnVuc2hpZnQoe1xuICAgICAgICBpbmRleDogbWF4SW5kZXggKyAxLFxuICAgICAgICB1cmw6IHBhZ2UudXJsKCkuc3BsaXQoJyYnKVswXSxcbiAgICAgICAgdGl0bGU6IHRpdGxlLnJlcGxhY2UoJyAtIFlvdVR1YmUnLCAnJyksXG4gICAgICAgIHZpZGVvSWQsXG4gICAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgICAgICBwcm9jZXNzaW5nQXR0ZW1wdHM6IDAsXG4gICAgICAgIGRldGVjdGVkQnk6ICdTZW50aW5lbCdcbiAgICB9KTtcbiAgICBcbiAgICBmcy53cml0ZUZpbGVTeW5jKFNUQVRFX0ZJTEVfUEFUSCwgSlNPTi5zdHJpbmdpZnkoc3RhdGUsIG51bGwsIDIpKTtcbiAgICBjb25zb2xlLmxvZyhgW1NlbnRpbmVsXSBWaWRlbyAjJHttYXhJbmRleCArIDF9IGFkZGVkIHRvIHF1ZXVlLmApO1xufVxuXG5tb25pdG9yQWN0aXZlVGFiKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4iXX0=

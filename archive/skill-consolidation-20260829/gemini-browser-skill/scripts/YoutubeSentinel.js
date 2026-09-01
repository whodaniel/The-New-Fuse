"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const playwright_1 = require("playwright");
const STATE_FILE_PATH = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/transcript-v2-state.json';
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
                        console.log(`[Sentinel] 🎯 New video detected: ${videoId}. Triggering shadow ingestion...`);
                        await triggerIngestion(page, videoId);
                    }
                }
            }
        }
        catch (e) {
            console.error('[Sentinel] Polling error:', e.message);
        }
    }, POLL_INTERVAL);
}
function isAlreadyInState(videoId) {
    if (!fs.existsSync(STATE_FILE_PATH))
        return false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWW91dHViZVNlbnRpbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiWW91dHViZVNlbnRpbmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3QiwyQ0FBaUQ7QUFFakQsTUFBTSxlQUFlLEdBQ25CLG9GQUFvRixDQUFDO0FBQ3ZGLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxDQUFDLGFBQWE7QUFFMUMsS0FBSyxVQUFVLGdCQUFnQjtJQUM3QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE1BQU0sRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ3hGLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFMUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxxQkFBUSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRTtRQUNqRSxRQUFRLEVBQUUsS0FBSyxFQUFFLG9EQUFvRDtRQUNyRSxPQUFPLEVBQUUsUUFBUTtLQUNsQixDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLDZEQUE2RCxDQUFDLENBQUM7SUFFM0UsV0FBVyxDQUFDLEtBQUssSUFBSSxFQUFFOztRQUNyQixJQUFJLENBQUM7WUFDSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDOUIsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN2QixJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDO29CQUN6QyxNQUFNLE9BQU8sR0FBRyxNQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLDBDQUFHLENBQUMsQ0FBQyxDQUFDO29CQUM1QyxJQUFJLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQ1QscUNBQXFDLE9BQU8sa0NBQWtDLENBQy9FLENBQUM7d0JBQ0YsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3hDLENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztZQUNoQixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4RCxDQUFDO0lBQ0gsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ3BCLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLE9BQWU7SUFDdkMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDbEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUssT0FBTyxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUVELEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxJQUFVLEVBQUUsT0FBZTtJQUN6RCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixLQUFLLG1CQUFtQixDQUFDLENBQUM7SUFFOUQsNEVBQTRFO0lBQzVFLHFEQUFxRDtJQUNyRCxnQ0FBZ0M7SUFDaEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBVyxFQUFFLENBQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU3RixLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUNsQixLQUFLLEVBQUUsUUFBUSxHQUFHLENBQUM7UUFDbkIsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdCLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7UUFDdEMsT0FBTztRQUNQLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLGtCQUFrQixFQUFFLENBQUM7UUFDckIsVUFBVSxFQUFFLFVBQVU7S0FDdkIsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsUUFBUSxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNuRSxDQUFDO0FBRUQsZ0JBQWdCLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNocm9taXVtLCB0eXBlIFBhZ2UgfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuY29uc3QgU1RBVEVfRklMRV9QQVRIID1cbiAgJy9Vc2Vycy88b3duZXI+L0Rlc2t0b3AvQTEtSW50ZXItTExNLUNvbS9UaGUtTmV3LUZ1c2UvZGF0YS90cmFuc2NyaXB0LXYyLXN0YXRlLmpzb24nO1xuY29uc3QgUE9MTF9JTlRFUlZBTCA9IDMwMDAwOyAvLyAzMCBzZWNvbmRzXG5cbmFzeW5jIGZ1bmN0aW9uIG1vbml0b3JBY3RpdmVUYWIoKSB7XG4gIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZS1hbHQnKTtcbiAgY29uc29sZS5sb2coJ1tTZW50aW5lbF0gTW9uaXRvcmluZyBwcm9maWxlOicsIHByb2ZpbGVEaXIpO1xuXG4gIGNvbnN0IGNvbnRleHQgPSBhd2FpdCBjaHJvbWl1bS5sYXVuY2hQZXJzaXN0ZW50Q29udGV4dChwcm9maWxlRGlyLCB7XG4gICAgaGVhZGxlc3M6IGZhbHNlLCAvLyBNdXN0IGJlIG5vbi1oZWFkbGVzcyB0byBzZWUgd2hhdCB1c2VyIGlzIHdhdGNoaW5nXG4gICAgY2hhbm5lbDogJ2Nocm9tZScsXG4gIH0pO1xuXG4gIGNvbnNvbGUubG9nKCdbU2VudGluZWxdIEFsd2F5cy1vbiBkZXRlY3Rpb24gYWN0aXZlLiBQb2xsaW5nIGV2ZXJ5IDMwcy4uLicpO1xuXG4gIHNldEludGVydmFsKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFnZXMgPSBjb250ZXh0LnBhZ2VzKCk7XG4gICAgICBmb3IgKGNvbnN0IHBhZ2Ugb2YgcGFnZXMpIHtcbiAgICAgICAgY29uc3QgdXJsID0gcGFnZS51cmwoKTtcbiAgICAgICAgaWYgKHVybC5pbmNsdWRlcygneW91dHViZS5jb20vd2F0Y2g/dj0nKSkge1xuICAgICAgICAgIGNvbnN0IHZpZGVvSWQgPSB1cmwubWF0Y2goL3Y9KFteJl0rKS8pPy5bMV07XG4gICAgICAgICAgaWYgKHZpZGVvSWQgJiYgIWlzQWxyZWFkeUluU3RhdGUodmlkZW9JZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICBgW1NlbnRpbmVsXSDwn46vIE5ldyB2aWRlbyBkZXRlY3RlZDogJHt2aWRlb0lkfS4gVHJpZ2dlcmluZyBzaGFkb3cgaW5nZXN0aW9uLi4uYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGF3YWl0IHRyaWdnZXJJbmdlc3Rpb24ocGFnZSwgdmlkZW9JZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbU2VudGluZWxdIFBvbGxpbmcgZXJyb3I6JywgZS5tZXNzYWdlKTtcbiAgICB9XG4gIH0sIFBPTExfSU5URVJWQUwpO1xufVxuXG5mdW5jdGlvbiBpc0FscmVhZHlJblN0YXRlKHZpZGVvSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoU1RBVEVfRklMRV9QQVRIKSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKFNUQVRFX0ZJTEVfUEFUSCwgJ3V0Zi04JykpO1xuICByZXR1cm4gc3RhdGUucXVldWUuc29tZSgodjogYW55KSA9PiB2LnZpZGVvSWQgPT09IHZpZGVvSWQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB0cmlnZ2VySW5nZXN0aW9uKHBhZ2U6IFBhZ2UsIHZpZGVvSWQ6IHN0cmluZykge1xuICBjb25zdCB0aXRsZSA9IGF3YWl0IHBhZ2UudGl0bGUoKTtcbiAgY29uc29sZS5sb2coYFtTZW50aW5lbF0gUXVldWVpbmcgXCIke3RpdGxlfVwiIGZvciBwcm9jZXNzaW5nLmApO1xuXG4gIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBjYWxsIHRoZSBUcmFuc2NyaXB0UHJvY2Vzc29yVjIgbG9naWNcbiAgLy8gb3IgYWRkIHRvIHRoZSBzdGF0ZSBmaWxlIGFuZCBzaWduYWwgdGhlIHByb2Nlc3Nvci5cbiAgLy8gRm9yIG5vdywgd2UgdXBkYXRlIHRoZSBzdGF0ZS5cbiAgY29uc3Qgc3RhdGUgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhTVEFURV9GSUxFX1BBVEgsICd1dGYtOCcpKTtcbiAgY29uc3QgbWF4SW5kZXggPSBzdGF0ZS5xdWV1ZS5yZWR1Y2UoKG1heDogbnVtYmVyLCB2OiBhbnkpID0+IE1hdGgubWF4KG1heCwgdi5pbmRleCB8fCAwKSwgMCk7XG5cbiAgc3RhdGUucXVldWUudW5zaGlmdCh7XG4gICAgaW5kZXg6IG1heEluZGV4ICsgMSxcbiAgICB1cmw6IHBhZ2UudXJsKCkuc3BsaXQoJyYnKVswXSxcbiAgICB0aXRsZTogdGl0bGUucmVwbGFjZSgnIC0gWW91VHViZScsICcnKSxcbiAgICB2aWRlb0lkLFxuICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgIHByb2Nlc3NpbmdBdHRlbXB0czogMCxcbiAgICBkZXRlY3RlZEJ5OiAnU2VudGluZWwnLFxuICB9KTtcblxuICBmcy53cml0ZUZpbGVTeW5jKFNUQVRFX0ZJTEVfUEFUSCwgSlNPTi5zdHJpbmdpZnkoc3RhdGUsIG51bGwsIDIpKTtcbiAgY29uc29sZS5sb2coYFtTZW50aW5lbF0gVmlkZW8gIyR7bWF4SW5kZXggKyAxfSBhZGRlZCB0byBxdWV1ZS5gKTtcbn1cblxubW9uaXRvckFjdGl2ZVRhYigpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl19
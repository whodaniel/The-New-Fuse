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
const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLSdNsZjFbYrVOWZZlWtKvQ4YgshmswLsQ';
async function scrapePlaylist() {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
    console.log('Using profile:', profileDir);
    const context = await playwright_1.chromium.launchPersistentContext(profileDir, {
        headless: true, // Run headless for extraction
        channel: 'chrome',
    });
    const page = await context.newPage();
    console.log('Navigating to playlist:', PLAYLIST_URL);
    await page.goto(PLAYLIST_URL, { waitUntil: 'networkidle' });
    // Scroll to load all videos (YouTube playlists lazy load)
    console.log('Scrolling to load all items...');
    let previousCount = 0;
    let currentCount = 0;
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollBy(0, 5000));
        await page.waitForTimeout(2000);
        currentCount = await page.locator('ytd-playlist-video-renderer').count();
        if (currentCount === previousCount && currentCount > 0)
            break;
        previousCount = currentCount;
        console.log(`Found ${currentCount} videos so far...`);
    }
    const videos = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('ytd-playlist-video-renderer'));
        return items.map((item, index) => {
            var _a;
            const titleLink = item.querySelector('#video-title');
            const url = (titleLink === null || titleLink === void 0 ? void 0 : titleLink.href) || '';
            const videoId = ((_a = url.match(/v=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1]) || '';
            return {
                index: index + 1,
                title: (titleLink === null || titleLink === void 0 ? void 0 : titleLink.innerText.trim()) || 'Unknown',
                url: url.split('&list=')[0], // Clean URL
                videoId
            };
        });
    });
    console.log(`\nSuccessfully scraped ${videos.length} videos.`);
    const outputPath = path.join(process.cwd(), 'data', 'ai-4-playlist.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2));
    console.log('Data saved to:', outputPath);
    await context.close();
}
scrapePlaylist().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyYXBlLXBsYXlsaXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyYXBlLXBsYXlsaXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3QiwyQ0FBc0M7QUFFdEMsTUFBTSxZQUFZLEdBQUcsMEVBQTBFLENBQUM7QUFFaEcsS0FBSyxVQUFVLGNBQWM7SUFDM0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxNQUFNLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztJQUN4RixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRTFDLE1BQU0sT0FBTyxHQUFHLE1BQU0scUJBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLEVBQUU7UUFDakUsUUFBUSxFQUFFLElBQUksRUFBRSw4QkFBOEI7UUFDOUMsT0FBTyxFQUFFLFFBQVE7S0FDbEIsQ0FBQyxDQUFDO0lBRUgsTUFBTSxJQUFJLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUVyRCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFFNUQsMERBQTBEO0lBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUM5QyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBRXJCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUM1QixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNwRCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pFLElBQUksWUFBWSxLQUFLLGFBQWEsSUFBSSxZQUFZLEdBQUcsQ0FBQztZQUFFLE1BQU07UUFDOUQsYUFBYSxHQUFHLFlBQVksQ0FBQztRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsWUFBWSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1FBQ3RDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQztRQUNuRixPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7O1lBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFzQixDQUFDO1lBQzFFLE1BQU0sR0FBRyxHQUFHLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksS0FBSSxFQUFFLENBQUM7WUFDbEMsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLDBDQUFHLENBQUMsQ0FBQyxLQUFJLEVBQUUsQ0FBQztZQUNsRCxPQUFPO2dCQUNMLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQztnQkFDaEIsS0FBSyxFQUFFLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSSxTQUFTO2dCQUMvQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZO2dCQUN6QyxPQUFPO2FBQ1IsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixNQUFNLENBQUMsTUFBTSxVQUFVLENBQUMsQ0FBQztJQUUvRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUMxRSxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM1RCxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU5RCxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRTFDLE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFFRCxjQUFjLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNocm9taXVtIH0gZnJvbSAncGxheXdyaWdodCc7XG5cbmNvbnN0IFBMQVlMSVNUX1VSTCA9ICdodHRwczovL3d3dy55b3V0dWJlLmNvbS9wbGF5bGlzdD9saXN0PVBMU2ROc1pqRmJZclZPV1pabFd0S3ZRNFlnc2htc3dMc1EnO1xuXG5hc3luYyBmdW5jdGlvbiBzY3JhcGVQbGF5bGlzdCgpIHtcbiAgY29uc3QgcHJvZmlsZURpciA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FIHx8ICcvdG1wJywgJy52aWRlby1wcm9jZXNzb3ItY2hyb21lLWFsdCcpO1xuICBjb25zb2xlLmxvZygnVXNpbmcgcHJvZmlsZTonLCBwcm9maWxlRGlyKTtcblxuICBjb25zdCBjb250ZXh0ID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoUGVyc2lzdGVudENvbnRleHQocHJvZmlsZURpciwge1xuICAgIGhlYWRsZXNzOiB0cnVlLCAvLyBSdW4gaGVhZGxlc3MgZm9yIGV4dHJhY3Rpb25cbiAgICBjaGFubmVsOiAnY2hyb21lJyxcbiAgfSk7XG5cbiAgY29uc3QgcGFnZSA9IGF3YWl0IGNvbnRleHQubmV3UGFnZSgpO1xuICBjb25zb2xlLmxvZygnTmF2aWdhdGluZyB0byBwbGF5bGlzdDonLCBQTEFZTElTVF9VUkwpO1xuICBcbiAgYXdhaXQgcGFnZS5nb3RvKFBMQVlMSVNUX1VSTCwgeyB3YWl0VW50aWw6ICduZXR3b3JraWRsZScgfSk7XG5cbiAgLy8gU2Nyb2xsIHRvIGxvYWQgYWxsIHZpZGVvcyAoWW91VHViZSBwbGF5bGlzdHMgbGF6eSBsb2FkKVxuICBjb25zb2xlLmxvZygnU2Nyb2xsaW5nIHRvIGxvYWQgYWxsIGl0ZW1zLi4uJyk7XG4gIGxldCBwcmV2aW91c0NvdW50ID0gMDtcbiAgbGV0IGN1cnJlbnRDb3VudCA9IDA7XG4gIFxuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHdpbmRvdy5zY3JvbGxCeSgwLCA1MDAwKSk7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcbiAgICBjdXJyZW50Q291bnQgPSBhd2FpdCBwYWdlLmxvY2F0b3IoJ3l0ZC1wbGF5bGlzdC12aWRlby1yZW5kZXJlcicpLmNvdW50KCk7XG4gICAgaWYgKGN1cnJlbnRDb3VudCA9PT0gcHJldmlvdXNDb3VudCAmJiBjdXJyZW50Q291bnQgPiAwKSBicmVhaztcbiAgICBwcmV2aW91c0NvdW50ID0gY3VycmVudENvdW50O1xuICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2N1cnJlbnRDb3VudH0gdmlkZW9zIHNvIGZhci4uLmApO1xuICB9XG5cbiAgY29uc3QgdmlkZW9zID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiB7XG4gICAgY29uc3QgaXRlbXMgPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3l0ZC1wbGF5bGlzdC12aWRlby1yZW5kZXJlcicpKTtcbiAgICByZXR1cm4gaXRlbXMubWFwKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGVMaW5rID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcjdmlkZW8tdGl0bGUnKSBhcyBIVE1MQW5jaG9yRWxlbWVudDtcbiAgICAgIGNvbnN0IHVybCA9IHRpdGxlTGluaz8uaHJlZiB8fCAnJztcbiAgICAgIGNvbnN0IHZpZGVvSWQgPSB1cmwubWF0Y2goL3Y9KFteJl0rKS8pPy5bMV0gfHwgJyc7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpbmRleDogaW5kZXggKyAxLFxuICAgICAgICB0aXRsZTogdGl0bGVMaW5rPy5pbm5lclRleHQudHJpbSgpIHx8ICdVbmtub3duJyxcbiAgICAgICAgdXJsOiB1cmwuc3BsaXQoJyZsaXN0PScpWzBdLCAvLyBDbGVhbiBVUkxcbiAgICAgICAgdmlkZW9JZFxuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgY29uc29sZS5sb2coYFxcblN1Y2Nlc3NmdWxseSBzY3JhcGVkICR7dmlkZW9zLmxlbmd0aH0gdmlkZW9zLmApO1xuICBcbiAgY29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnZGF0YScsICdhaS00LXBsYXlsaXN0Lmpzb24nKTtcbiAgZnMubWtkaXJTeW5jKHBhdGguZGlybmFtZShvdXRwdXRQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGZzLndyaXRlRmlsZVN5bmMob3V0cHV0UGF0aCwgSlNPTi5zdHJpbmdpZnkodmlkZW9zLCBudWxsLCAyKSk7XG4gIFxuICBjb25zb2xlLmxvZygnRGF0YSBzYXZlZCB0bzonLCBvdXRwdXRQYXRoKTtcblxuICBhd2FpdCBjb250ZXh0LmNsb3NlKCk7XG59XG5cbnNjcmFwZVBsYXlsaXN0KCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4iXX0=
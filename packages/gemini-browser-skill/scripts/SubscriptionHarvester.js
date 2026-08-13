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
const SUBSCRIPTIONS_URL = 'https://www.youtube.com/feed/subscriptions';
const OUTPUT_DIR = path.join(__dirname, '../data/harvested');
async function harvestSubscriptions() {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
    console.log('[Harvester] Using profile:', profileDir);
    const context = await playwright_1.chromium.launchPersistentContext(profileDir, {
        headless: true,
        channel: 'chrome',
    });
    const page = await context.newPage();
    console.log('[Harvester] Navigating to subscriptions...');
    await page.goto(SUBSCRIPTIONS_URL, { waitUntil: 'networkidle' });
    // Wait for the grid to load
    await page.waitForSelector('ytd-rich-item-renderer');
    const newVideos = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('ytd-rich-item-renderer'));
        return items.map((item) => {
            var _a;
            const titleLink = item.querySelector('#video-title-link');
            const channelLink = item.querySelector('#avatar-link');
            const url = (titleLink === null || titleLink === void 0 ? void 0 : titleLink.href) || '';
            const videoId = ((_a = url.match(/v=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1]) || '';
            return {
                title: (titleLink === null || titleLink === void 0 ? void 0 : titleLink.innerText.trim()) || 'Unknown',
                channel: (channelLink === null || channelLink === void 0 ? void 0 : channelLink.title) || 'Unknown',
                url: url.split('&list=')[0],
                videoId,
                harvestedAt: new Date().toISOString()
            };
        });
    });
    console.log(`[Harvester] Found ${newVideos.length} recent videos from subscriptions.`);
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(OUTPUT_DIR, `subs-harvest-${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(newVideos, null, 2));
    console.log('[Harvester] Data saved to:', outputPath);
    await context.close();
    return newVideos;
}
harvestSubscriptions().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3Vic2NyaXB0aW9uSGFydmVzdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU3Vic2NyaXB0aW9uSGFydmVzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3QiwyQ0FBc0M7QUFFdEMsTUFBTSxpQkFBaUIsR0FBRyw0Q0FBNEMsQ0FBQztBQUN2RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBRTdELEtBQUssVUFBVSxvQkFBb0I7SUFDakMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxNQUFNLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztJQUN4RixPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRXRELE1BQU0sT0FBTyxHQUFHLE1BQU0scUJBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLEVBQUU7UUFDakUsUUFBUSxFQUFFLElBQUk7UUFDZCxPQUFPLEVBQUUsUUFBUTtLQUNsQixDQUFDLENBQUM7SUFFSCxNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7SUFFMUQsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFFakUsNEJBQTRCO0lBQzVCLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBRXJELE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7UUFDekMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1FBQzlFLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFOztZQUN4QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFzQixDQUFDO1lBQy9FLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFzQixDQUFDO1lBQzVFLE1BQU0sR0FBRyxHQUFHLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksS0FBSSxFQUFFLENBQUM7WUFDbEMsTUFBTSxPQUFPLEdBQUcsQ0FBQSxNQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLDBDQUFHLENBQUMsQ0FBQyxLQUFJLEVBQUUsQ0FBQztZQUVsRCxPQUFPO2dCQUNMLEtBQUssRUFBRSxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUksU0FBUztnQkFDL0MsT0FBTyxFQUFFLENBQUEsV0FBVyxhQUFYLFdBQVcsdUJBQVgsV0FBVyxDQUFFLEtBQUssS0FBSSxTQUFTO2dCQUN4QyxHQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLE9BQU87Z0JBQ1AsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2FBQ3RDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsU0FBUyxDQUFDLE1BQU0sb0NBQW9DLENBQUMsQ0FBQztJQUV2RixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNqRSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsU0FBUyxPQUFPLENBQUMsQ0FBQztJQUMzRSxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRSxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRXRELE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3RCLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRCxvQkFBb0IsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY2hyb21pdW0gfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuY29uc3QgU1VCU0NSSVBUSU9OU19VUkwgPSAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vZmVlZC9zdWJzY3JpcHRpb25zJztcbmNvbnN0IE9VVFBVVF9ESVIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vZGF0YS9oYXJ2ZXN0ZWQnKTtcblxuYXN5bmMgZnVuY3Rpb24gaGFydmVzdFN1YnNjcmlwdGlvbnMoKSB7XG4gIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZS1hbHQnKTtcbiAgY29uc29sZS5sb2coJ1tIYXJ2ZXN0ZXJdIFVzaW5nIHByb2ZpbGU6JywgcHJvZmlsZURpcik7XG5cbiAgY29uc3QgY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICBoZWFkbGVzczogdHJ1ZSxcbiAgICBjaGFubmVsOiAnY2hyb21lJyxcbiAgfSk7XG5cbiAgY29uc3QgcGFnZSA9IGF3YWl0IGNvbnRleHQubmV3UGFnZSgpO1xuICBjb25zb2xlLmxvZygnW0hhcnZlc3Rlcl0gTmF2aWdhdGluZyB0byBzdWJzY3JpcHRpb25zLi4uJyk7XG4gIFxuICBhd2FpdCBwYWdlLmdvdG8oU1VCU0NSSVBUSU9OU19VUkwsIHsgd2FpdFVudGlsOiAnbmV0d29ya2lkbGUnIH0pO1xuXG4gIC8vIFdhaXQgZm9yIHRoZSBncmlkIHRvIGxvYWRcbiAgYXdhaXQgcGFnZS53YWl0Rm9yU2VsZWN0b3IoJ3l0ZC1yaWNoLWl0ZW0tcmVuZGVyZXInKTtcblxuICBjb25zdCBuZXdWaWRlb3MgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICBjb25zdCBpdGVtcyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgneXRkLXJpY2gtaXRlbS1yZW5kZXJlcicpKTtcbiAgICByZXR1cm4gaXRlbXMubWFwKChpdGVtKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZUxpbmsgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJyN2aWRlby10aXRsZS1saW5rJykgYXMgSFRNTEFuY2hvckVsZW1lbnQ7XG4gICAgICBjb25zdCBjaGFubmVsTGluayA9IGl0ZW0ucXVlcnlTZWxlY3RvcignI2F2YXRhci1saW5rJykgYXMgSFRNTEFuY2hvckVsZW1lbnQ7XG4gICAgICBjb25zdCB1cmwgPSB0aXRsZUxpbms/LmhyZWYgfHwgJyc7XG4gICAgICBjb25zdCB2aWRlb0lkID0gdXJsLm1hdGNoKC92PShbXiZdKykvKT8uWzFdIHx8ICcnO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogdGl0bGVMaW5rPy5pbm5lclRleHQudHJpbSgpIHx8ICdVbmtub3duJyxcbiAgICAgICAgY2hhbm5lbDogY2hhbm5lbExpbms/LnRpdGxlIHx8ICdVbmtub3duJyxcbiAgICAgICAgdXJsOiB1cmwuc3BsaXQoJyZsaXN0PScpWzBdLFxuICAgICAgICB2aWRlb0lkLFxuICAgICAgICBoYXJ2ZXN0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcblxuICBjb25zb2xlLmxvZyhgW0hhcnZlc3Rlcl0gRm91bmQgJHtuZXdWaWRlb3MubGVuZ3RofSByZWNlbnQgdmlkZW9zIGZyb20gc3Vic2NyaXB0aW9ucy5gKTtcbiAgXG4gIGlmICghZnMuZXhpc3RzU3luYyhPVVRQVVRfRElSKSkge1xuICAgIGZzLm1rZGlyU3luYyhPVVRQVVRfRElSLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgfVxuXG4gIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csICctJyk7XG4gIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4oT1VUUFVUX0RJUiwgYHN1YnMtaGFydmVzdC0ke3RpbWVzdGFtcH0uanNvbmApO1xuICBmcy53cml0ZUZpbGVTeW5jKG91dHB1dFBhdGgsIEpTT04uc3RyaW5naWZ5KG5ld1ZpZGVvcywgbnVsbCwgMikpO1xuICBcbiAgY29uc29sZS5sb2coJ1tIYXJ2ZXN0ZXJdIERhdGEgc2F2ZWQgdG86Jywgb3V0cHV0UGF0aCk7XG5cbiAgYXdhaXQgY29udGV4dC5jbG9zZSgpO1xuICByZXR1cm4gbmV3VmlkZW9zO1xufVxuXG5oYXJ2ZXN0U3Vic2NyaXB0aW9ucygpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl19
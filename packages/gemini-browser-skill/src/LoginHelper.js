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
async function login() {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
    console.log(`[LoginHelper] 📂 Using Profile Directory: ${profileDir}`);
    console.log('[LoginHelper] 🚀 Launching Chrome (Clean Mode)...');
    console.log('[LoginHelper] 👉 Please sign in to Google/YouTube/AI Studio in the browser window that opens.');
    console.log('[LoginHelper] 👉 Once signed in, verify you can access https://aistudio.google.com/');
    console.log('[LoginHelper] ⏱️ This script will keep the browser open for 10 minutes or until you close it manually.');
    if (!fs.existsSync(profileDir)) {
        console.log('[LoginHelper] Creating profile directory...');
        fs.mkdirSync(profileDir, { recursive: true });
    }
    const context = await playwright_1.chromium.launchPersistentContext(profileDir, {
        headless: false,
        channel: 'chrome',
        args: [
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,800',
        ],
        viewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    await page.goto('https://accounts.google.com/ServiceLogin');
    // Also open AI Studio in a second tab
    const page2 = await context.newPage();
    await page2.goto('https://aistudio.google.com/');
    // Debugging: Check AI Studio state
    await page2.waitForTimeout(5000); // Wait for load
    console.log(`[LoginHelper] 🔍 Current URL: ${page2.url()}`);
    console.log(`[LoginHelper] 📄 Page Title: ${await page2.title()}`);
    const textarea = page2.locator('textarea[aria-label="Enter a prompt"]');
    if ((await textarea.count()) > 0 && (await textarea.isVisible())) {
        console.log('[LoginHelper] ✅ SUCCESS: Prompt box found! Automation should work.');
    }
    else {
        console.log('[LoginHelper] ❌ FAILURE: Prompt box NOT found.');
        console.log('[LoginHelper] 📸 Taking debug screenshot...');
        await page2.screenshot({ path: path.join(process.cwd(), 'login_debug.png') });
        // Check for common alternative states
        if ((await page2.locator('text="Sign in"').count()) > 0) {
            console.log('[LoginHelper] ⚠️ Detected "Sign in" text - You might not be logged in.');
        }
    }
    // Wait for a long time to let user sign in
    await new Promise((resolve) => setTimeout(resolve, 600000)); // 10 minutes
    await context.close();
}
login().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9naW5IZWxwZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJMb2dpbkhlbHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsMkNBQXNDO0FBRXRDLEtBQUssVUFBVSxLQUFLO0lBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksTUFBTSxFQUFFLCtCQUErQixDQUFDLENBQUM7SUFFMUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2Q0FBNkMsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUN2RSxPQUFPLENBQUMsR0FBRyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7SUFDakUsT0FBTyxDQUFDLEdBQUcsQ0FDVCwrRkFBK0YsQ0FDaEcsQ0FBQztJQUNGLE9BQU8sQ0FBQyxHQUFHLENBQ1QscUZBQXFGLENBQ3RGLENBQUM7SUFDRixPQUFPLENBQUMsR0FBRyxDQUNULHdHQUF3RyxDQUN6RyxDQUFDO0lBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7UUFDM0QsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxxQkFBUSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRTtRQUNqRSxRQUFRLEVBQUUsS0FBSztRQUNmLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLElBQUksRUFBRTtZQUNKLGdCQUFnQjtZQUNoQiw0QkFBNEI7WUFDNUIsK0NBQStDO1lBQy9DLHdCQUF3QjtTQUN6QjtRQUNELFFBQVEsRUFBRSxJQUFJO1FBQ2QsaUJBQWlCLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQztRQUMxQyxTQUFTLEVBQ1AsdUhBQXVIO0tBQzFILENBQUMsQ0FBQztJQUVILE1BQU0sSUFBSSxHQUFHLE1BQU0sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3JDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO0lBRTVELHNDQUFzQztJQUN0QyxNQUFNLEtBQUssR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUVqRCxtQ0FBbUM7SUFDbkMsTUFBTSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZ0JBQWdCO0lBRWxELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRW5FLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUN4RSxJQUFJLENBQUMsTUFBTSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDakUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1FBQzlELE9BQU8sQ0FBQyxHQUFHLENBQUMsNkNBQTZDLENBQUMsQ0FBQztRQUMzRCxNQUFNLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFOUUsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3hELE9BQU8sQ0FBQyxHQUFHLENBQUMsd0VBQXdFLENBQUMsQ0FBQztRQUN4RixDQUFDO0lBQ0gsQ0FBQztJQUVELDJDQUEyQztJQUMzQyxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhO0lBRTFFLE1BQU0sT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFFRCxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNocm9taXVtIH0gZnJvbSAncGxheXdyaWdodCc7XG5cbmFzeW5jIGZ1bmN0aW9uIGxvZ2luKCkge1xuICBjb25zdCBwcm9maWxlRGlyID0gcGF0aC5qb2luKHByb2Nlc3MuZW52LkhPTUUgfHwgJy90bXAnLCAnLnZpZGVvLXByb2Nlc3Nvci1jaHJvbWUtY2xlYW4nKTtcblxuICBjb25zb2xlLmxvZyhgW0xvZ2luSGVscGVyXSDwn5OCIFVzaW5nIFByb2ZpbGUgRGlyZWN0b3J5OiAke3Byb2ZpbGVEaXJ9YCk7XG4gIGNvbnNvbGUubG9nKCdbTG9naW5IZWxwZXJdIPCfmoAgTGF1bmNoaW5nIENocm9tZSAoQ2xlYW4gTW9kZSkuLi4nKTtcbiAgY29uc29sZS5sb2coXG4gICAgJ1tMb2dpbkhlbHBlcl0g8J+RiSBQbGVhc2Ugc2lnbiBpbiB0byBHb29nbGUvWW91VHViZS9BSSBTdHVkaW8gaW4gdGhlIGJyb3dzZXIgd2luZG93IHRoYXQgb3BlbnMuJ1xuICApO1xuICBjb25zb2xlLmxvZyhcbiAgICAnW0xvZ2luSGVscGVyXSDwn5GJIE9uY2Ugc2lnbmVkIGluLCB2ZXJpZnkgeW91IGNhbiBhY2Nlc3MgaHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tLydcbiAgKTtcbiAgY29uc29sZS5sb2coXG4gICAgJ1tMb2dpbkhlbHBlcl0g4o+x77iPIFRoaXMgc2NyaXB0IHdpbGwga2VlcCB0aGUgYnJvd3NlciBvcGVuIGZvciAxMCBtaW51dGVzIG9yIHVudGlsIHlvdSBjbG9zZSBpdCBtYW51YWxseS4nXG4gICk7XG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKHByb2ZpbGVEaXIpKSB7XG4gICAgY29uc29sZS5sb2coJ1tMb2dpbkhlbHBlcl0gQ3JlYXRpbmcgcHJvZmlsZSBkaXJlY3RvcnkuLi4nKTtcbiAgICBmcy5ta2RpclN5bmMocHJvZmlsZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIH1cblxuICBjb25zdCBjb250ZXh0ID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoUGVyc2lzdGVudENvbnRleHQocHJvZmlsZURpciwge1xuICAgIGhlYWRsZXNzOiBmYWxzZSxcbiAgICBjaGFubmVsOiAnY2hyb21lJyxcbiAgICBhcmdzOiBbXG4gICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgJy0tbm8tZGVmYXVsdC1icm93c2VyLWNoZWNrJyxcbiAgICAgICctLWRpc2FibGUtYmxpbmstZmVhdHVyZXM9QXV0b21hdGlvbkNvbnRyb2xsZWQnLFxuICAgICAgJy0td2luZG93LXNpemU9MTI4MCw4MDAnLFxuICAgIF0sXG4gICAgdmlld3BvcnQ6IG51bGwsXG4gICAgaWdub3JlRGVmYXVsdEFyZ3M6IFsnLS1lbmFibGUtYXV0b21hdGlvbiddLFxuICAgIHVzZXJBZ2VudDpcbiAgICAgICdNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxuICB9KTtcblxuICBjb25zdCBwYWdlID0gYXdhaXQgY29udGV4dC5uZXdQYWdlKCk7XG4gIGF3YWl0IHBhZ2UuZ290bygnaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL1NlcnZpY2VMb2dpbicpO1xuXG4gIC8vIEFsc28gb3BlbiBBSSBTdHVkaW8gaW4gYSBzZWNvbmQgdGFiXG4gIGNvbnN0IHBhZ2UyID0gYXdhaXQgY29udGV4dC5uZXdQYWdlKCk7XG4gIGF3YWl0IHBhZ2UyLmdvdG8oJ2h0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS8nKTtcblxuICAvLyBEZWJ1Z2dpbmc6IENoZWNrIEFJIFN0dWRpbyBzdGF0ZVxuICBhd2FpdCBwYWdlMi53YWl0Rm9yVGltZW91dCg1MDAwKTsgLy8gV2FpdCBmb3IgbG9hZFxuXG4gIGNvbnNvbGUubG9nKGBbTG9naW5IZWxwZXJdIPCflI0gQ3VycmVudCBVUkw6ICR7cGFnZTIudXJsKCl9YCk7XG4gIGNvbnNvbGUubG9nKGBbTG9naW5IZWxwZXJdIPCfk4QgUGFnZSBUaXRsZTogJHthd2FpdCBwYWdlMi50aXRsZSgpfWApO1xuXG4gIGNvbnN0IHRleHRhcmVhID0gcGFnZTIubG9jYXRvcigndGV4dGFyZWFbYXJpYS1sYWJlbD1cIkVudGVyIGEgcHJvbXB0XCJdJyk7XG4gIGlmICgoYXdhaXQgdGV4dGFyZWEuY291bnQoKSkgPiAwICYmIChhd2FpdCB0ZXh0YXJlYS5pc1Zpc2libGUoKSkpIHtcbiAgICBjb25zb2xlLmxvZygnW0xvZ2luSGVscGVyXSDinIUgU1VDQ0VTUzogUHJvbXB0IGJveCBmb3VuZCEgQXV0b21hdGlvbiBzaG91bGQgd29yay4nKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnW0xvZ2luSGVscGVyXSDinYwgRkFJTFVSRTogUHJvbXB0IGJveCBOT1QgZm91bmQuJyk7XG4gICAgY29uc29sZS5sb2coJ1tMb2dpbkhlbHBlcl0g8J+TuCBUYWtpbmcgZGVidWcgc2NyZWVuc2hvdC4uLicpO1xuICAgIGF3YWl0IHBhZ2UyLnNjcmVlbnNob3QoeyBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2xvZ2luX2RlYnVnLnBuZycpIH0pO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGNvbW1vbiBhbHRlcm5hdGl2ZSBzdGF0ZXNcbiAgICBpZiAoKGF3YWl0IHBhZ2UyLmxvY2F0b3IoJ3RleHQ9XCJTaWduIGluXCInKS5jb3VudCgpKSA+IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbTG9naW5IZWxwZXJdIOKaoO+4jyBEZXRlY3RlZCBcIlNpZ24gaW5cIiB0ZXh0IC0gWW91IG1pZ2h0IG5vdCBiZSBsb2dnZWQgaW4uJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gV2FpdCBmb3IgYSBsb25nIHRpbWUgdG8gbGV0IHVzZXIgc2lnbiBpblxuICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA2MDAwMDApKTsgLy8gMTAgbWludXRlc1xuXG4gIGF3YWl0IGNvbnRleHQuY2xvc2UoKTtcbn1cblxubG9naW4oKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiJdfQ==
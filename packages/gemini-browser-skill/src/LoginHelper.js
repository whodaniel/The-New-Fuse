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
const playwright_1 = require('playwright');
const path = __importStar(require('path'));
const fs = __importStar(require('fs'));
async function login() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  console.log(`[LoginHelper] 📂 Using Profile Directory: ${profileDir}`);
  console.log('[LoginHelper] 🚀 Launching Chrome (Clean Mode)...');
  console.log(
    '[LoginHelper] 👉 Please sign in to Google/YouTube/AI Studio in the browser window that opens.'
  );
  console.log(
    '[LoginHelper] 👉 Once signed in, verify you can access https://aistudio.google.com/'
  );
  console.log(
    '[LoginHelper] ⏱️ This script will keep the browser open for 10 minutes or until you close it manually.'
  );
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
      '--disable-blink-features=AutomationControlled', // Key for hiding automation
    ],
    viewport: { width: 1400, height: 900 },
    ignoreDefaultArgs: ['--enable-automation'],
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
  } else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9naW5IZWxwZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJMb2dpbkhlbHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDJDQUFzQztBQUN0QywyQ0FBNkI7QUFDN0IsdUNBQXlCO0FBRXpCLEtBQUssVUFBVSxLQUFLO0lBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksTUFBTSxFQUFFLCtCQUErQixDQUFDLENBQUM7SUFFMUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2Q0FBNkMsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUN2RSxPQUFPLENBQUMsR0FBRyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7SUFDakUsT0FBTyxDQUFDLEdBQUcsQ0FBQywrRkFBK0YsQ0FBQyxDQUFDO0lBQzdHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUZBQXFGLENBQUMsQ0FBQztJQUNuRyxPQUFPLENBQUMsR0FBRyxDQUFDLHdHQUF3RyxDQUFDLENBQUM7SUFFdEgsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7UUFDM0QsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxxQkFBUSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRTtRQUMvRCxRQUFRLEVBQUUsS0FBSztRQUNmLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLElBQUksRUFBRTtZQUNKLGdCQUFnQjtZQUNoQiw0QkFBNEI7WUFDNUIsK0NBQStDLEVBQUUsNEJBQTRCO1NBQzlFO1FBQ0QsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFO1FBQ3RDLGlCQUFpQixFQUFFLENBQUMscUJBQXFCLENBQUM7UUFDMUMsU0FBUyxFQUNQLHVIQUF1SDtLQUMxSCxDQUFDLENBQUM7SUFFTCxNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNyQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsMENBQTBDLENBQUMsQ0FBQztJQUU1RCxzQ0FBc0M7SUFDdEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdEMsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7SUFFakQsbUNBQW1DO0lBQ25DLE1BQU0sS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjtJQUVsRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLE1BQU0sS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVuRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7SUFDeEUsSUFBSSxNQUFNLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksTUFBTSxRQUFRLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztRQUMzRCxPQUFPLENBQUMsR0FBRyxDQUFDLG9FQUFvRSxDQUFDLENBQUM7SUFDdEYsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLENBQUMsR0FBRyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFDOUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1FBQzNELE1BQU0sS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUU5RSxzQ0FBc0M7UUFDdEMsSUFBSSxNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7UUFDMUYsQ0FBQztJQUNMLENBQUM7SUFFRCwyQ0FBMkM7SUFDM0MsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWE7SUFFeEUsTUFBTSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDeEIsQ0FBQztBQUVELEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IGNocm9taXVtIH0gZnJvbSAncGxheXdyaWdodCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5hc3luYyBmdW5jdGlvbiBsb2dpbigpIHtcbiAgY29uc3QgcHJvZmlsZURpciA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FIHx8ICcvdG1wJywgJy52aWRlby1wcm9jZXNzb3ItY2hyb21lLWNsZWFuJyk7XG4gIFxuICBjb25zb2xlLmxvZyhgW0xvZ2luSGVscGVyXSDwn5OCIFVzaW5nIFByb2ZpbGUgRGlyZWN0b3J5OiAke3Byb2ZpbGVEaXJ9YCk7XG4gIGNvbnNvbGUubG9nKCdbTG9naW5IZWxwZXJdIPCfmoAgTGF1bmNoaW5nIENocm9tZSAoQ2xlYW4gTW9kZSkuLi4nKTtcbiAgY29uc29sZS5sb2coJ1tMb2dpbkhlbHBlcl0g8J+RiSBQbGVhc2Ugc2lnbiBpbiB0byBHb29nbGUvWW91VHViZS9BSSBTdHVkaW8gaW4gdGhlIGJyb3dzZXIgd2luZG93IHRoYXQgb3BlbnMuJyk7XG4gIGNvbnNvbGUubG9nKCdbTG9naW5IZWxwZXJdIPCfkYkgT25jZSBzaWduZWQgaW4sIHZlcmlmeSB5b3UgY2FuIGFjY2VzcyBodHRwczovL2Fpc3R1ZGlvLmdvb2dsZS5jb20vJyk7XG4gIGNvbnNvbGUubG9nKCdbTG9naW5IZWxwZXJdIOKPse+4jyBUaGlzIHNjcmlwdCB3aWxsIGtlZXAgdGhlIGJyb3dzZXIgb3BlbiBmb3IgMTAgbWludXRlcyBvciB1bnRpbCB5b3UgY2xvc2UgaXQgbWFudWFsbHkuJyk7XG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKHByb2ZpbGVEaXIpKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0xvZ2luSGVscGVyXSBDcmVhdGluZyBwcm9maWxlIGRpcmVjdG9yeS4uLicpO1xuICAgICAgZnMubWtkaXJTeW5jKHByb2ZpbGVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9XG5cbiAgY29uc3QgY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICAgIGhlYWRsZXNzOiBmYWxzZSxcbiAgICAgIGNoYW5uZWw6ICdjaHJvbWUnLFxuICAgICAgYXJnczogW1xuICAgICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLCBcbiAgICAgICAgJy0tZGlzYWJsZS1ibGluay1mZWF0dXJlcz1BdXRvbWF0aW9uQ29udHJvbGxlZCcsIC8vIEtleSBmb3IgaGlkaW5nIGF1dG9tYXRpb25cbiAgICAgIF0sXG4gICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTQwMCwgaGVpZ2h0OiA5MDAgfSxcbiAgICAgIGlnbm9yZURlZmF1bHRBcmdzOiBbJy0tZW5hYmxlLWF1dG9tYXRpb24nXSxcbiAgICAgIHVzZXJBZ2VudDpcbiAgICAgICAgJ01vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjAuMC4wLjAgU2FmYXJpLzUzNy4zNicsXG4gICAgfSk7XG5cbiAgY29uc3QgcGFnZSA9IGF3YWl0IGNvbnRleHQubmV3UGFnZSgpO1xuICBhd2FpdCBwYWdlLmdvdG8oJ2h0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9TZXJ2aWNlTG9naW4nKTtcbiAgXG4gIC8vIEFsc28gb3BlbiBBSSBTdHVkaW8gaW4gYSBzZWNvbmQgdGFiXG4gIGNvbnN0IHBhZ2UyID0gYXdhaXQgY29udGV4dC5uZXdQYWdlKCk7XG4gIGF3YWl0IHBhZ2UyLmdvdG8oJ2h0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS8nKTtcblxuICAvLyBEZWJ1Z2dpbmc6IENoZWNrIEFJIFN0dWRpbyBzdGF0ZVxuICBhd2FpdCBwYWdlMi53YWl0Rm9yVGltZW91dCg1MDAwKTsgLy8gV2FpdCBmb3IgbG9hZFxuICBcbiAgY29uc29sZS5sb2coYFtMb2dpbkhlbHBlcl0g8J+UjSBDdXJyZW50IFVSTDogJHtwYWdlMi51cmwoKX1gKTtcbiAgY29uc29sZS5sb2coYFtMb2dpbkhlbHBlcl0g8J+ThCBQYWdlIFRpdGxlOiAke2F3YWl0IHBhZ2UyLnRpdGxlKCl9YCk7XG5cbiAgY29uc3QgdGV4dGFyZWEgPSBwYWdlMi5sb2NhdG9yKCd0ZXh0YXJlYVthcmlhLWxhYmVsPVwiRW50ZXIgYSBwcm9tcHRcIl0nKTtcbiAgaWYgKGF3YWl0IHRleHRhcmVhLmNvdW50KCkgPiAwICYmIGF3YWl0IHRleHRhcmVhLmlzVmlzaWJsZSgpKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0xvZ2luSGVscGVyXSDinIUgU1VDQ0VTUzogUHJvbXB0IGJveCBmb3VuZCEgQXV0b21hdGlvbiBzaG91bGQgd29yay4nKTtcbiAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbTG9naW5IZWxwZXJdIOKdjCBGQUlMVVJFOiBQcm9tcHQgYm94IE5PVCBmb3VuZC4nKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbTG9naW5IZWxwZXJdIPCfk7ggVGFraW5nIGRlYnVnIHNjcmVlbnNob3QuLi4nKTtcbiAgICAgIGF3YWl0IHBhZ2UyLnNjcmVlbnNob3QoeyBwYXRoOiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2xvZ2luX2RlYnVnLnBuZycpIH0pO1xuICAgICAgXG4gICAgICAvLyBDaGVjayBmb3IgY29tbW9uIGFsdGVybmF0aXZlIHN0YXRlc1xuICAgICAgaWYgKGF3YWl0IHBhZ2UyLmxvY2F0b3IoJ3RleHQ9XCJTaWduIGluXCInKS5jb3VudCgpID4gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbTG9naW5IZWxwZXJdIOKaoO+4jyBEZXRlY3RlZCBcIlNpZ24gaW5cIiB0ZXh0IC0gWW91IG1pZ2h0IG5vdCBiZSBsb2dnZWQgaW4uJyk7XG4gICAgICB9XG4gIH1cblxuICAvLyBXYWl0IGZvciBhIGxvbmcgdGltZSB0byBsZXQgdXNlciBzaWduIGluXG4gIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA2MDAwMDApKTsgLy8gMTAgbWludXRlc1xuXG4gIGF3YWl0IGNvbnRleHQuY2xvc2UoKTtcbn1cblxubG9naW4oKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiJdfQ==

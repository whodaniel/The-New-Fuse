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
async function openYoutube() {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
    console.log('Launching browser with profile:', profileDir);
    fs.mkdirSync(profileDir, { recursive: true });
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
    await page.goto('https://www.youtube.com/feed/playlists');
    console.log('\n================================================================');
    console.log('BROWSER OPENED TO YOUTUBE PLAYLISTS');
    console.log('1. Please log in to your main Google account.');
    console.log('2. Select your YouTube brand account.');
    console.log('3. Locate the "AI 4" playlist.');
    console.log('4. Once you are on the "AI 4" playlist page, tell me.');
    console.log('================================================================\n');
    // Wait for user to finish in browser (keep script running)
    await new Promise(() => { });
}
openYoutube().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3Blbi15b3V0dWJlLXBsYXlsaXN0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wZW4teW91dHViZS1wbGF5bGlzdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLDJDQUFzQztBQUV0QyxLQUFLLFVBQVUsV0FBVztJQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE1BQU0sRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ3hGLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDM0QsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUU5QyxNQUFNLE9BQU8sR0FBRyxNQUFNLHFCQUFRLENBQUMsdUJBQXVCLENBQUMsVUFBVSxFQUFFO1FBQ2pFLFFBQVEsRUFBRSxLQUFLO1FBQ2YsT0FBTyxFQUFFLFFBQVE7UUFDakIsSUFBSSxFQUFFO1lBQ0osZ0JBQWdCO1lBQ2hCLDRCQUE0QjtZQUM1QiwrQ0FBK0M7WUFDL0Msd0JBQXdCO1NBQ3pCO1FBQ0QsUUFBUSxFQUFFLElBQUk7UUFDZCxpQkFBaUIsRUFBRSxDQUFDLHFCQUFxQixDQUFDO1FBQzFDLFNBQVMsRUFDUCx1SEFBdUg7S0FDMUgsQ0FBQyxDQUFDO0lBRUgsTUFBTSxJQUFJLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDckMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLHdDQUF3QyxDQUFDLENBQUM7SUFFMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO0lBQ2xGLE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsQ0FBQztJQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLCtDQUErQyxDQUFDLENBQUM7SUFDN0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7SUFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO0lBRWxGLDJEQUEyRDtJQUMzRCxNQUFNLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFFRCxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNocm9taXVtIH0gZnJvbSAncGxheXdyaWdodCc7XG5cbmFzeW5jIGZ1bmN0aW9uIG9wZW5Zb3V0dWJlKCkge1xuICBjb25zdCBwcm9maWxlRGlyID0gcGF0aC5qb2luKHByb2Nlc3MuZW52LkhPTUUgfHwgJy90bXAnLCAnLnZpZGVvLXByb2Nlc3Nvci1jaHJvbWUtYWx0Jyk7XG4gIGNvbnNvbGUubG9nKCdMYXVuY2hpbmcgYnJvd3NlciB3aXRoIHByb2ZpbGU6JywgcHJvZmlsZURpcik7XG4gIGZzLm1rZGlyU3luYyhwcm9maWxlRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICBjb25zdCBjb250ZXh0ID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoUGVyc2lzdGVudENvbnRleHQocHJvZmlsZURpciwge1xuICAgIGhlYWRsZXNzOiBmYWxzZSxcbiAgICBjaGFubmVsOiAnY2hyb21lJyxcbiAgICBhcmdzOiBbXG4gICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgJy0tbm8tZGVmYXVsdC1icm93c2VyLWNoZWNrJyxcbiAgICAgICctLWRpc2FibGUtYmxpbmstZmVhdHVyZXM9QXV0b21hdGlvbkNvbnRyb2xsZWQnLFxuICAgICAgJy0td2luZG93LXNpemU9MTI4MCw4MDAnLFxuICAgIF0sXG4gICAgdmlld3BvcnQ6IG51bGwsXG4gICAgaWdub3JlRGVmYXVsdEFyZ3M6IFsnLS1lbmFibGUtYXV0b21hdGlvbiddLFxuICAgIHVzZXJBZ2VudDpcbiAgICAgICdNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxuICB9KTtcblxuICBjb25zdCBwYWdlID0gYXdhaXQgY29udGV4dC5uZXdQYWdlKCk7XG4gIGF3YWl0IHBhZ2UuZ290bygnaHR0cHM6Ly93d3cueW91dHViZS5jb20vZmVlZC9wbGF5bGlzdHMnKTtcblxuICBjb25zb2xlLmxvZygnXFxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuICBjb25zb2xlLmxvZygnQlJPV1NFUiBPUEVORUQgVE8gWU9VVFVCRSBQTEFZTElTVFMnKTtcbiAgY29uc29sZS5sb2coJzEuIFBsZWFzZSBsb2cgaW4gdG8geW91ciBtYWluIEdvb2dsZSBhY2NvdW50LicpO1xuICBjb25zb2xlLmxvZygnMi4gU2VsZWN0IHlvdXIgWW91VHViZSBicmFuZCBhY2NvdW50LicpO1xuICBjb25zb2xlLmxvZygnMy4gTG9jYXRlIHRoZSBcIkFJIDRcIiBwbGF5bGlzdC4nKTtcbiAgY29uc29sZS5sb2coJzQuIE9uY2UgeW91IGFyZSBvbiB0aGUgXCJBSSA0XCIgcGxheWxpc3QgcGFnZSwgdGVsbCBtZS4nKTtcbiAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4nKTtcblxuICAvLyBXYWl0IGZvciB1c2VyIHRvIGZpbmlzaCBpbiBicm93c2VyIChrZWVwIHNjcmlwdCBydW5uaW5nKVxuICBhd2FpdCBuZXcgUHJvbWlzZSgoKSA9PiB7fSk7XG59XG5cbm9wZW5Zb3V0dWJlKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4iXX0=
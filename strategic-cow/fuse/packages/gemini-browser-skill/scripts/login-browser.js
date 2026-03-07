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
async function login() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
  console.log('Launching browser for login at:', profileDir);
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
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  await page.goto('https://aistudio.google.com/app/prompts/new_chat');
  console.log('Browser open. Please log in to Google AI Studio.');
  console.log('Press Ctrl+C to stop this script once logged in.');
  // Keep alive
  await new Promise(() => {});
}
login().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4tYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxvZ2luLWJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLDJDQUFzQztBQUV0QyxLQUFLLFVBQVUsS0FBSztJQUNsQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE1BQU0sRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ3hGLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDM0QsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUU5QyxNQUFNLE9BQU8sR0FBRyxNQUFNLHFCQUFRLENBQUMsdUJBQXVCLENBQUMsVUFBVSxFQUFFO1FBQ2pFLFFBQVEsRUFBRSxLQUFLO1FBQ2YsT0FBTyxFQUFFLFFBQVE7UUFDakIsSUFBSSxFQUFFO1lBQ0osZ0JBQWdCO1lBQ2hCLDRCQUE0QjtZQUM1QiwrQ0FBK0M7WUFDL0Msd0JBQXdCO1NBQ3pCO1FBQ0QsUUFBUSxFQUFFLElBQUk7UUFDZCxpQkFBaUIsRUFBRSxDQUFDLHFCQUFxQixDQUFDO1FBQzFDLFNBQVMsRUFDUCx1SEFBdUg7S0FDMUgsQ0FBQyxDQUFDO0lBRUgsTUFBTSxJQUFJLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDckMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxDQUFDLENBQUM7SUFFcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO0lBQ2hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0RBQWtELENBQUMsQ0FBQztJQUVoRSxhQUFhO0lBQ2IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBRUQsS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjaHJvbWl1bSB9IGZyb20gJ3BsYXl3cmlnaHQnO1xuXG5hc3luYyBmdW5jdGlvbiBsb2dpbigpIHtcbiAgY29uc3QgcHJvZmlsZURpciA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FIHx8ICcvdG1wJywgJy52aWRlby1wcm9jZXNzb3ItY2hyb21lLWFsdCcpO1xuICBjb25zb2xlLmxvZygnTGF1bmNoaW5nIGJyb3dzZXIgZm9yIGxvZ2luIGF0OicsIHByb2ZpbGVEaXIpO1xuICBmcy5ta2RpclN5bmMocHJvZmlsZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG5cbiAgY29uc3QgY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICBoZWFkbGVzczogZmFsc2UsXG4gICAgY2hhbm5lbDogJ2Nocm9tZScsXG4gICAgYXJnczogW1xuICAgICAgJy0tbm8tZmlyc3QtcnVuJyxcbiAgICAgICctLW5vLWRlZmF1bHQtYnJvd3Nlci1jaGVjaycsXG4gICAgICAnLS1kaXNhYmxlLWJsaW5rLWZlYXR1cmVzPUF1dG9tYXRpb25Db250cm9sbGVkJyxcbiAgICAgICctLXdpbmRvdy1zaXplPTEyODAsODAwJyxcbiAgICBdLFxuICAgIHZpZXdwb3J0OiBudWxsLFxuICAgIGlnbm9yZURlZmF1bHRBcmdzOiBbJy0tZW5hYmxlLWF1dG9tYXRpb24nXSxcbiAgICB1c2VyQWdlbnQ6XG4gICAgICAnTW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMC4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcbiAgfSk7XG5cbiAgY29uc3QgcGFnZSA9IGF3YWl0IGNvbnRleHQubmV3UGFnZSgpO1xuICBhd2FpdCBwYWdlLmdvdG8oJ2h0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS9hcHAvcHJvbXB0cy9uZXdfY2hhdCcpO1xuXG4gIGNvbnNvbGUubG9nKCdCcm93c2VyIG9wZW4uIFBsZWFzZSBsb2cgaW4gdG8gR29vZ2xlIEFJIFN0dWRpby4nKTtcbiAgY29uc29sZS5sb2coJ1ByZXNzIEN0cmwrQyB0byBzdG9wIHRoaXMgc2NyaXB0IG9uY2UgbG9nZ2VkIGluLicpO1xuXG4gIC8vIEtlZXAgYWxpdmVcbiAgYXdhaXQgbmV3IFByb21pc2UoKCkgPT4ge30pO1xufVxuXG5sb2dpbigpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl19

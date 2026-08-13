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
/// <reference lib="dom" />
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
const playwright_1 = require('playwright');
// Reuse config from V2
const PROFILE_DIR = path.join(process.env.HOME || '/tmp', '.video-processor-chrome');
const LIBRARY_URL = 'https://aistudio.google.com/app/library';
const OUT_DIR = path.join(process.cwd(), 'data', 'library_import');
async function main() {
  console.log('🚀 Starting Library Importer...');
  await fs.promises.mkdir(OUT_DIR, { recursive: true });
  const context = await playwright_1.chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    channel: 'chrome',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();
  try {
    console.log(`Navigating to ${LIBRARY_URL}...`);
    await page.goto(LIBRARY_URL, { waitUntil: 'domcontentloaded' });
    // Allow manual login/loading time if needed, but usually persistent profile handles it.
    await page.waitForTimeout(5000);
    // Try to find the list of prompts/chats.
    // We'll look for generic row elements or text.
    // Common selectors in AI Studio (might change, so we'll be dynamic)
    // We'll dump a screenshot if we can't find anything.
    console.log('Scanning for conversations...');
    // Wait for something that looks like a list
    try {
      await page.waitForSelector('ms-file-list-item, .file-row, a[href*="/app/prompts/"]', {
        timeout: 10000,
      });
    } catch (e) {
      console.log('⚠️ Could not find obvious list items. Dumping page structure...');
      const html = await page.content();
      await fs.promises.writeFile(path.join(OUT_DIR, 'library_dump.html'), html);
      console.log('Saved library_dump.html. Please verify selectors.');
      // Fallback: Try to find ANY links to prompts
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map((a) => ({ href: a.href, text: a.innerText }))
          .filter((l) => l.href.includes('/app/prompts/') || l.href.includes('/app/chat/'));
      });
      console.log(`Found ${links.length} potential chat links.`);
      if (links.length === 0) {
        throw new Error('No chats found.');
      }
      // Process these links
      for (const link of links) {
        await processChatLink(context, link.href);
      }
      return;
    }
    // If we have a robust list selector:
    const rows = page.locator('ms-file-list-item, .file-row, a[href*="/app/prompts/"]');
    const count = await rows.count();
    console.log(`Found ${count} items in library.`);
    // Iterate
    // Note: Doing this via new tabs is safer to assume list doesn't refresh
    const hrefs = [];
    for (let i = 0; i < count; i++) {
      const href = await rows.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }
    // Uniq
    const uniqueHrefs = [...new Set(hrefs)].filter(
      (h) => h.includes('/app/prompts/') || h.includes('/app/chat/')
    );
    console.log(`Processing ${uniqueHrefs.length} unique conversations...`);
    for (const href of uniqueHrefs) {
      const fullUrl = href.startsWith('http') ? href : `https://aistudio.google.com${href}`;
      await processChatLink(context, fullUrl);
    }
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await context.close();
  }
}
async function processChatLink(context, url) {
  var _a;
  const id =
    ((_a = url.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0]) ||
    'unknown_' + Date.now();
  const outFile = path.join(OUT_DIR, `chat_${id}.json`);
  try {
    await fs.promises.access(outFile);
    console.log(`Skipping ${id} (already imported)`);
    return;
  } catch (e) {
    // File doesn't exist, proceed
  }
  console.log(`Opening ${id}...`);
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Let chat load
    // Extract content
    const data = await page.evaluate(() => {
      // Try to find user prompts and model responses
      // Selectors are tricky, we'll try to grab all text organized by structure
      const history = [];
      const turns = document.querySelectorAll('ms-chat-turn');
      if (turns.length > 0) {
        turns.forEach((turn) => {
          const role = turn.classList.contains('user') ? 'user' : 'model';
          const text = turn.textContent || '';
          history.push({ role, text });
        });
      } else {
        // Fallback for different UI version
        const container = document.querySelector('main') || document.body;
        history.push({ role: 'unknown', text: container.innerText });
      }
      return history;
    });
    const chatData = {
      id,
      url,
      importedAt: new Date().toISOString(),
      turns: data,
    };
    await fs.promises.writeFile(outFile, JSON.stringify(chatData, null, 2));
    console.log(`✅ Saved ${data.length} turns from ${id}`);
  } catch (e) {
    console.error(`Error processing ${url}:`, e);
  } finally {
    await page.close();
  }
}
main();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlicmFyeUltcG9ydGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTGlicmFyeUltcG9ydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkJBQTJCO0FBQzNCLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsMkNBQTJEO0FBRTNELHVCQUF1QjtBQUN2QixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE1BQU0sRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3JGLE1BQU0sV0FBVyxHQUFHLHlDQUF5QyxDQUFDO0FBQzlELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBRW5FLEtBQUssVUFBVSxJQUFJO0lBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsQ0FBQztJQUMvQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRXRELE1BQU0sT0FBTyxHQUFHLE1BQU0scUJBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUU7UUFDbEUsUUFBUSxFQUFFLEtBQUs7UUFDZixPQUFPLEVBQUUsUUFBUTtRQUNqQixJQUFJLEVBQUU7WUFDSixnQkFBZ0I7WUFDaEIsNEJBQTRCO1lBQzVCLCtDQUErQztTQUNoRDtRQUNELFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRTtLQUN2QyxDQUFDLENBQUM7SUFFSCxNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUVyQyxJQUFJLENBQUM7UUFDSCxPQUFPLENB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IC8+XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY2hyb21pdW0sIHR5cGUgQnJvd3NlckNvbnRleHQgfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuLy8gUmV1c2UgY29uZmlnIGZyb20gVjJcbmNvbnN0IFBST0ZJTEVfRElSID0gcGF0aC5qb2luKHByb2Nlc3MuZW52LkhPTUUgfHwgJy90bXAnLCAnLnZpZGVvLXByb2Nlc3Nvci1jaHJvbWUnKTtcbmNvbnN0IExJQlJBUllfVVJMID0gJ2h0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS9hcHAvbGlicmFyeSc7XG5jb25zdCBPVVRfRElSID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdkYXRhJywgJ2xpYnJhcnlfaW1wb3J0Jyk7XG5cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIGNvbnNvbGUubG9nKCfwn5qAIFN0YXJ0aW5nIExpYnJhcnkgSW1wb3J0ZXIuLi4nKTtcbiAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIoT1VUX0RJUiwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG5cbiAgY29uc3QgY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KFBST0ZJTEVfRElSLCB7XG4gICAgaGVhZGxlc3M6IGZhbHNlLFxuICAgIGNoYW5uZWw6ICdjaHJvbWUnLFxuICAgIGFyZ3M6IFtcbiAgICAgICctLW5vLWZpcnN0LXJ1bicsXG4gICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgJy0tZGlzYWJsZS1ibGluay1mZWF0dXJlcz1BdXRvbWF0aW9uQ29udHJvbGxlZCcsXG4gICAgXSxcbiAgICB2aWV3cG9ydDogeyB3aWR0aDogMTQwMCwgaGVpZ2h0OiA5MDAgfSxcbiAgfSk7XG5cbiAgY29uc3QgcGFnZSA9IGF3YWl0IGNvbnRleHQubmV3UGFnZSgpO1xuXG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coYE5hdmlnYXRpbmcgdG8gJHtMSUJSQVJZX1VSTH0uLi5gKTtcbiAgICBhd2FpdCBwYWdlLmdvdG8oTElCUkFSWV9VUkwsIHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcgfSk7XG5cbiAgICAvLyBBbGxvdyBtYW51YWwgbG9naW4vbG9hZGluZyB0aW1lIGlmIG5lZWRlZCwgYnV0IHVzdWFsbHkgcGVyc2lzdGVudCBwcm9maWxlIGhhbmRsZXMgaXQuXG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcblxuICAgIC8vIFRyeSB0byBmaW5kIHRoZSBsaXN0IG9mIHByb21wdHMvY2hhdHMuXG4gICAgLy8gV2UnbGwgbG9vayBmb3IgZ2VuZXJpYyByb3cgZWxlbWVudHMgb3IgdGV4dC5cbiAgICAvLyBDb21tb24gc2VsZWN0b3JzIGluIEFJIFN0dWRpbyAobWlnaHQgY2hhbmdlLCBzbyB3ZSdsbCBiZSBkeW5hbWljKVxuICAgIC8vIFdlJ2xsIGR1bXAgYSBzY3JlZW5zaG90IGlmIHdlIGNhbid0IGZpbmQgYW55dGhpbmcuXG5cbiAgICBjb25zb2xlLmxvZygnU2Nhbm5pbmcgZm9yIGNvbnZlcnNhdGlvbnMuLi4nKTtcblxuICAgIC8vIFdhaXQgZm9yIHNvbWV0aGluZyB0aGF0IGxvb2tzIGxpa2UgYSBsaXN0XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclNlbGVjdG9yKCdtcy1maWxlLWxpc3QtaXRlbSwgLmZpbGUtcm93LCBhW2hyZWYqPVwiL2FwcC9wcm9tcHRzL1wiXScsIHtcbiAgICAgICAgdGltZW91dDogMTAwMDAsXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pqg77iPIENvdWxkIG5vdCBmaW5kIG9idmlvdXMgbGlzdCBpdGVtcy4gRHVtcGluZyBwYWdlIHN0cnVjdHVyZS4uLicpO1xuICAgICAgY29uc3QgaHRtbCA9IGF3YWl0IHBhZ2UuY29udGVudCgpO1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKHBhdGguam9pbihPVVRfRElSLCAnbGlicmFyeV9kdW1wLmh0bWwnKSwgaHRtbCk7XG4gICAgICBjb25zb2xlLmxvZygnU2F2ZWQgbGlicmFyeV9kdW1wLmh0bWwuIFBsZWFzZSB2ZXJpZnkgc2VsZWN0b3JzLicpO1xuXG4gICAgICAvLyBGYWxsYmFjazogVHJ5IHRvIGZpbmQgQU5ZIGxpbmtzIHRvIHByb21wdHNcbiAgICAgIGNvbnN0IGxpbmtzID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKSlcbiAgICAgICAgICAubWFwKChhKSA9PiAoeyBocmVmOiBhLmhyZWYsIHRleHQ6IGEuaW5uZXJUZXh0IH0pKVxuICAgICAgICAgIC5maWx0ZXIoKGwpID0+IGwuaHJlZi5pbmNsdWRlcygnL2FwcC9wcm9tcHRzLycpIHx8IGwuaHJlZi5pbmNsdWRlcygnL2FwcC9jaGF0LycpKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZyhgRm91bmQgJHtsaW5rcy5sZW5ndGh9IHBvdGVudGlhbCBjaGF0IGxpbmtzLmApO1xuXG4gICAgICBpZiAobGlua3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gY2hhdHMgZm91bmQuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFByb2Nlc3MgdGhlc2UgbGlua3NcbiAgICAgIGZvciAoY29uc3QgbGluayBvZiBsaW5rcykge1xuICAgICAgICBhd2FpdCBwcm9jZXNzQ2hhdExpbmsoY29udGV4dCwgbGluay5ocmVmKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoYXZlIGEgcm9idXN0IGxpc3Qgc2VsZWN0b3I6XG4gICAgY29uc3Qgcm93cyA9IHBhZ2UubG9jYXRvcignbXMtZmlsZS1saXN0LWl0ZW0sIC5maWxlLXJvdywgYVtocmVmKj1cIi9hcHAvcHJvbXB0cy9cIl0nKTtcbiAgICBjb25zdCBjb3VudCA9IGF3YWl0IHJvd3MuY291bnQoKTtcbiAgICBjb25zb2xlLmxvZyhgRm91bmQgJHtjb3VudH0gaXRlbXMgaW4gbGlicmFyeS5gKTtcblxuICAgIC8vIEl0ZXJhdGVcbiAgICAvLyBOb3RlOiBEb2luZyB0aGlzIHZpYSBuZXcgdGFicyBpcyBzYWZlciB0byBhc3N1bWUgbGlzdCBkb2Vzbid0IHJlZnJlc2hcbiAgICBjb25zdCBocmVmczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGhyZWYgPSBhd2FpdCByb3dzLm50aChpKS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICAgIGlmIChocmVmKSBocmVmcy5wdXNoKGhyZWYpO1xuICAgIH1cblxuICAgIC8vIFVuaXFcbiAgICBjb25zdCB1bmlxdWVIcmVmcyA9IFsuLi5uZXcgU2V0KGhyZWZzKV0uZmlsdGVyKFxuICAgICAgKGgpID0+IGguaW5jbHVkZXMoJy9hcHAvcHJvbXB0cy8nKSB8fCBoLmluY2x1ZGVzKCcvYXBwL2NoYXQvJylcbiAgICApO1xuXG4gICAgY29uc29sZS5sb2coYFByb2Nlc3NpbmcgJHt1bmlxdWVIcmVmcy5sZW5ndGh9IHVuaXF1ZSBjb252ZXJzYXRpb25zLi4uYCk7XG5cbiAgICBmb3IgKGNvbnN0IGhyZWYgb2YgdW5pcXVlSHJlZnMpIHtcbiAgICAgIGNvbnN0IGZ1bGxVcmwgPSBocmVmLnN0YXJ0c1dpdGgoJ2h0dHAnKSA/IGhyZWYgOiBgaHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tJHtocmVmfWA7XG4gICAgICBhd2FpdCBwcm9jZXNzQ2hhdExpbmsoY29udGV4dCwgZnVsbFVybCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcignRmF0YWwgZXJyb3I6JywgZSk7XG4gIH0gZmluYWxseSB7XG4gICAgYXdhaXQgY29udGV4dC5jbG9zZSgpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NDaGF0TGluayhjb250ZXh0OiBCcm93c2VyQ29udGV4dCwgdXJsOiBzdHJpbmcpIHtcbiAgY29uc3QgaWQgPSB1cmwuc3BsaXQoJy8nKS5wb3AoKT8uc3BsaXQoJz8nKVswXSB8fCAndW5rbm93bl8nICsgRGF0ZS5ub3coKTtcbiAgY29uc3Qgb3V0RmlsZSA9IHBhdGguam9pbihPVVRfRElSLCBgY2hhdF8ke2lkfS5qc29uYCk7XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3Mob3V0RmlsZSk7XG4gICAgY29uc29sZS5sb2coYFNraXBwaW5nICR7aWR9IChhbHJlYWR5IGltcG9ydGVkKWApO1xuICAgIHJldHVybjtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIEZpbGUgZG9lc24ndCBleGlzdCwgcHJvY2VlZFxuICB9XG5cbiAgY29uc29sZS5sb2coYE9wZW5pbmcgJHtpZH0uLi5gKTtcbiAgY29uc3QgcGFnZSA9IGF3YWl0IGNvbnRleHQubmV3UGFnZSgpO1xuICB0cnkge1xuICAgIGF3YWl0IHBhZ2UuZ290byh1cmwsIHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcsIHRpbWVvdXQ6IDMwMDAwIH0pO1xuICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMzAwMCk7IC8vIExldCBjaGF0IGxvYWRcblxuICAgIC8vIEV4dHJhY3QgY29udGVudFxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgIC8vIFRyeSB0byBmaW5kIHVzZXIgcHJvbXB0cyBhbmQgbW9kZWwgcmVzcG9uc2VzXG4gICAgICAvLyBTZWxlY3RvcnMgYXJlIHRyaWNreSwgd2UnbGwgdHJ5IHRvIGdyYWIgYWxsIHRleHQgb3JnYW5pemVkIGJ5IHN0cnVjdHVyZVxuXG4gICAgICBjb25zdCBoaXN0b3J5OiB7IHJvbGU6IHN0cmluZzsgdGV4dDogc3RyaW5nIH1bXSA9IFtdO1xuICAgICAgY29uc3QgdHVybnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdtcy1jaGF0LXR1cm4nKTtcblxuICAgICAgaWYgKHR1cm5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdHVybnMuZm9yRWFjaCgodHVybikgPT4ge1xuICAgICAgICAgIGNvbnN0IHJvbGUgPSB0dXJuLmNsYXNzTGlzdC5jb250YWlucygndXNlcicpID8gJ3VzZXInIDogJ21vZGVsJztcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gdHVybi50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgICAgICBoaXN0b3J5LnB1c2goeyByb2xlLCB0ZXh0IH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrIGZvciBkaWZmZXJlbnQgVUkgdmVyc2lvblxuICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJykgfHwgZG9jdW1lbnQuYm9keTtcbiAgICAgICAgaGlzdG9yeS5wdXNoKHsgcm9sZTogJ3Vua25vd24nLCB0ZXh0OiBjb250YWluZXIuaW5uZXJUZXh0IH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhpc3Rvcnk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBjaGF0RGF0YSA9IHtcbiAgICAgIGlkLFxuICAgICAgdXJsLFxuICAgICAgaW1wb3J0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgdHVybnM6IGRhdGEsXG4gICAgfTtcblxuICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShvdXRGaWxlLCBKU09OLnN0cmluZ2lmeShjaGF0RGF0YSwgbnVsbCwgMikpO1xuICAgIGNvbnNvbGUubG9nKGDinIUgU2F2ZWQgJHtkYXRhLmxlbmd0aH0gdHVybnMgZnJvbSAke2lkfWApO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyAke3VybH06YCwgZSk7XG4gIH0gZmluYWxseSB7XG4gICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICB9XG59XG5cbm1haW4oKTtcbiJdfQ==

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
// Define paths
const LIBRARY_FILE = path.join(process.cwd(), '..', '..', 'ai_video_library.html');
const IMPORT_DIR = path.join(process.cwd(), 'data', 'library_import');
const OUT_FILE = path.join(process.cwd(), 'data', 'ProcessingStatusReport.md');
function analyze() {
  console.log('📊 Analyzing Processing Status...');
  // 1. Load the original library
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const videos = [];
  const rowRegex =
    /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
  let match;
  while ((match = rowRegex.exec(libContent)) !== null) {
    videos.push({
      index: parseInt(match[1]),
      url: match[2],
      title: match[3].trim(),
      isImported: false,
      hasVisualGaps: false,
      visualGapsCount: 0,
      status: 'Pending',
    });
  }
  console.log(`Library contains ${videos.length} total videos.`);
  // 2. Map Imported Chats to Videos
  // This is tricky because filenames are IDs, not video indices.
  // We need to look inside each JSON file to match the Title or URL.
  const files = fs.readdirSync(IMPORT_DIR).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} imported chat files.`);
  let matchCount = 0;
  for (const file of files) {
    const content = fs.readFileSync(path.join(IMPORT_DIR, file), 'utf-8');
    const json = JSON.parse(content);
    // We look at the first USER message or the first MODEL message title
    // Usually the model starts with "Analysis: [Video Title]" based on our prompt structure
    const text = JSON.stringify(json.turns);
    // Find matching video
    const video = videos.find((v) => {
      // Simple title match (case insensitive, partial)
      // This is heuristic but usually effective if titles agree
      // Or if the URL appeared in the prompt (rare)
      return (
        typeof (v === null || v === void 0 ? void 0 : v.title) === 'string' &&
        typeof text === 'string' &&
        text.toLowerCase().includes(v.title.toLowerCase().substring(0, 20))
      );
    });
    if (video) {
      video.isImported = true;
      matchCount++;
      // Check for Visual Gaps
      const gapMatches = text.match(/Need to see:/g);
      if (gapMatches) {
        video.hasVisualGaps = true;
        video.visualGapsCount = gapMatches.length;
        video.status = 'Needs Visual Review';
      } else {
        video.status = 'Complete';
      }
    }
  }
  console.log(`Matched ${matchCount} videos with imported analysis.`);
  // 3. Generate Report
  let md = `# 📊 Video Processing Status Report
*Generated: ${new Date().toLocaleString()}*

## 🟢 Summary

| Metric | Count | Percentage |
| :--- | :---: | :---: |
| **Total Videos** | **${videos.length}** | 100% |
| **Analyzed (Imported)** | **${matchCount}** | ${((matchCount / videos.length) * 100).toFixed(1)}% |
| **Pending (To Do)** | **${videos.length - matchCount}** | ${(((videos.length - matchCount) / videos.length) * 100).toFixed(1)}% |
| **Needs Visual Review** | **${videos.filter((v) => v.hasVisualGaps).length}** | - |

---

## 🟡 Action Items

1.  **Run TranscriptProcessorV2** for the **${videos.length - matchCount}** pending videos.
    *   *Command:* \`./scripts/run-v2.sh --start=633 --end=1\` (It will skip completed ones if we update the state file, but currently V2 state is fresh).
2.  **Run VisualAnalyst** for the **${videos.filter((v) => v.hasVisualGaps).length}** videos marked "Needs Visual Review".

---

## 📝 Detailed Status

| # | Title | Status | Visual Gaps |
| :--- | :--- | :--- | :---: |
`;
  // Sort: Pending first, then Visual Review, then Complete
  videos.sort((a, b) => {
    const score = (s) => (s === 'Pending' ? 0 : s === 'Needs Visual Review' ? 1 : 2);
    return score(a.status) - score(b.status);
  });
  for (const v of videos) {
    const icon = v.status === 'Complete' ? '✅' : v.status === 'Needs Visual Review' ? '⚠️' : '⚪';
    md += `| ${v.index} | ${v.title.substring(0, 60)}${v.title.length > 60 ? '...' : ''} | ${icon} ${v.status} | ${v.visualGapsCount || '-'} |\n`;
  }
  fs.writeFileSync(OUT_FILE, md);
  console.log(`Report generated at: ${OUT_FILE}`);
}
analyze();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VuZXJhdGVTdGF0dXNSZXBvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJHZW5lcmF0ZVN0YXR1c1JlcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsZUFBZTtBQUNmLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztBQUNuRixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUN0RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztBQWEvRSxTQUFTLE9BQU87SUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7SUFFakQsK0JBQStCO0lBQy9CLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzFELE1BQU0sTUFBTSxHQUFrQixFQUFFLENBQUM7SUFDakMsTUFBTSxRQUFRLEdBQ1osaUdBQWlHLENBQUM7SUFDcEcsSUFBSSxLQUFLLENBQUM7SUFFVixPQUFPLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ1YsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFD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S0FBSyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxNQUFNLENBQUMsQ0FBQyxlQUFlLElBQUksR0FBRyxNQUFNLENBQUM7SUFDaEosQ0FBQztJQUVELEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELE9BQU8sRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gRGVmaW5lIHBhdGhzXG5jb25zdCBMSUJSQVJZX0ZJTEUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy4uJywgJy4uJywgJ2FpX3ZpZGVvX2xpYnJhcnkuaHRtbCcpO1xuY29uc3QgSU1QT1JUX0RJUiA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnZGF0YScsICdsaWJyYXJ5X2ltcG9ydCcpO1xuY29uc3QgT1VUX0ZJTEUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2RhdGEnLCAnUHJvY2Vzc2luZ1N0YXR1c1JlcG9ydC5tZCcpO1xuXG4vLyBJbnRlcmZhY2VzXG5pbnRlcmZhY2UgVmlkZW9TdGF0dXMge1xuICBpbmRleDogbnVtYmVyO1xuICB0aXRsZTogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbiAgaXNJbXBvcnRlZDogYm9vbGVhbjtcbiAgaGFzVmlzdWFsR2FwczogYm9vbGVhbjtcbiAgdmlzdWFsR2Fwc0NvdW50OiBudW1iZXI7XG4gIHN0YXR1czogJ0NvbXBsZXRlJyB8ICdOZWVkcyBWaXN1YWwgUmV2aWV3JyB8ICdQZW5kaW5nJztcbn1cblxuZnVuY3Rpb24gYW5hbHl6ZSgpIHtcbiAgY29uc29sZS5sb2coJ/Cfk4ogQW5hbHl6aW5nIFByb2Nlc3NpbmcgU3RhdHVzLi4uJyk7XG5cbiAgLy8gMS4gTG9hZCB0aGUgb3JpZ2luYWwgbGlicmFyeVxuICBjb25zdCBsaWJDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKExJQlJBUllfRklMRSwgJ3V0Zi04Jyk7XG4gIGNvbnN0IHZpZGVvczogVmlkZW9TdGF0dXNbXSA9IFtdO1xuICBjb25zdCByb3dSZWdleCA9XG4gICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICBsZXQgbWF0Y2g7XG5cbiAgd2hpbGUgKChtYXRjaCA9IHJvd1JlZ2V4LmV4ZWMobGliQ29udGVudCkpICE9PSBudWxsKSB7XG4gICAgdmlkZW9zLnB1c2goe1xuICAgICAgaW5kZXg6IHBhcnNlSW50KG1hdGNoWzFdKSxcbiAgICAgIHVybDogbWF0Y2hbMl0sXG4gICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgaXNJbXBvcnRlZDogZmFsc2UsXG4gICAgICBoYXNWaXN1YWxHYXBzOiBmYWxzZSxcbiAgICAgIHZpc3VhbEdhcHNDb3VudDogMCxcbiAgICAgIHN0YXR1czogJ1BlbmRpbmcnLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc29sZS5sb2coYExpYnJhcnkgY29udGFpbnMgJHt2aWRlb3MubGVuZ3RofSB0b3RhbCB2aWRlb3MuYCk7XG5cbiAgLy8gMi4gTWFwIEltcG9ydGVkIENoYXRzIHRvIFZpZGVvc1xuICAvLyBUaGlzIGlzIHRyaWNreSBiZWNhdXNlIGZpbGVuYW1lcyBhcmUgSURzLCBub3QgdmlkZW8gaW5kaWNlcy5cbiAgLy8gV2UgbmVlZCB0byBsb29rIGluc2lkZSBlYWNoIEpTT04gZmlsZSB0byBtYXRjaCB0aGUgVGl0bGUgb3IgVVJMLlxuXG4gIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoSU1QT1JUX0RJUikuZmlsdGVyKChmKSA9PiBmLmVuZHNXaXRoKCcuanNvbicpKTtcbiAgY29uc29sZS5sb2coYEZvdW5kICR7ZmlsZXMubGVuZ3RofSBpbXBvcnRlZCBjaGF0IGZpbGVzLmApO1xuXG4gIGxldCBtYXRjaENvdW50ID0gMDtcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihJTVBPUlRfRElSLCBmaWxlKSwgJ3V0Zi04Jyk7XG4gICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoY29udGVudCk7XG5cbiAgICAvLyBXZSBsb29rIGF0IHRoZSBmaXJzdCBVU0VSIG1lc3NhZ2Ugb3IgdGhlIGZpcnN0IE1PREVMIG1lc3NhZ2UgdGl0bGVcbiAgICAvLyBVc3VhbGx5IHRoZSBtb2RlbCBzdGFydHMgd2l0aCBcIkFuYWx5c2lzOiBbVmlkZW8gVGl0bGVdXCIgYmFzZWQgb24gb3VyIHByb21wdCBzdHJ1Y3R1cmVcbiAgICBjb25zdCB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoanNvbi50dXJucyk7XG5cbiAgICAvLyBGaW5kIG1hdGNoaW5nIHZpZGVvXG4gICAgY29uc3QgdmlkZW8gPSB2aWRlb3MuZmluZCgodikgPT4ge1xuICAgICAgLy8gU2ltcGxlIHRpdGxlIG1hdGNoIChjYXNlIGluc2Vuc2l0aXZlLCBwYXJ0aWFsKVxuICAgICAgLy8gVGhpcyBpcyBoZXVyaXN0aWMgYnV0IHVzdWFsbHkgZWZmZWN0aXZlIGlmIHRpdGxlcyBhZ3JlZVxuICAgICAgLy8gT3IgaWYgdGhlIFVSTCBhcHBlYXJlZCBpbiB0aGUgcHJvbXB0IChyYXJlKVxuICAgICAgcmV0dXJuICh0eXBlb2Ygdj8udGl0bGUgPT09ICdzdHJpbmcnKSAmJiAodHlwZW9mIHRleHQgPT09ICdzdHJpbmcnKSAmJiB0ZXh0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModi50aXRsZS50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygwLCAyMCkpO1xuICAgIH0pO1xuXG4gICAgaWYgKHZpZGVvKSB7XG4gICAgICB2aWRlby5pc0ltcG9ydGVkID0gdHJ1ZTtcbiAgICAgIG1hdGNoQ291bnQrKztcblxuICAgICAgLy8gQ2hlY2sgZm9yIFZpc3VhbCBHYXBzXG4gICAgICBjb25zdCBnYXBNYXRjaGVzID0gdGV4dC5tYXRjaCgvTmVlZCB0byBzZWU6L2cpO1xuICAgICAgaWYgKGdhcE1hdGNoZXMpIHtcbiAgICAgICAgdmlkZW8uaGFzVmlzdWFsR2FwcyA9IHRydWU7XG4gICAgICAgIHZpZGVvLnZpc3VhbEdhcHNDb3VudCA9IGdhcE1hdGNoZXMubGVuZ3RoO1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAnTmVlZHMgVmlzdWFsIFJldmlldyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAnQ29tcGxldGUnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnNvbGUubG9nKGBNYXRjaGVkICR7bWF0Y2hDb3VudH0gdmlkZW9zIHdpdGggaW1wb3J0ZWQgYW5hbHlzaXMuYCk7XG5cbiAgLy8gMy4gR2VuZXJhdGUgUmVwb3J0XG4gIGxldCBtZCA9IGAjIPCfk4ogVmlkZW8gUHJvY2Vzc2luZyBTdGF0dXMgUmVwb3J0XG4qR2VuZXJhdGVkOiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKX0qXG5cbiMjIPCfn6IgU3VtbWFyeVxuXG58IE1ldHJpYyB8IENvdW50IHwgUGVyY2VudGFnZSB8XG58IDotLS0gfCA6LS0tOiB8IDotLS06IHxcbnwgKipUb3RhbCBWaWRlb3MqKiB8ICoqJHt2aWRlb3MubGVuZ3RofSoqIHwgMTAwJSB8XG58ICoqQW5hbHl6ZWQgKEltcG9ydGVkKSoqIHwgKioke21hdGNoQ291bnR9KiogfCAkeygobWF0Y2hDb3VudCAvIHZpZGVvcy5sZW5ndGgpICogMTAwKS50b0ZpeGVkKDEpfSUgfFxufCAqKlBlbmRpbmcgKFRvIERvKSoqIHwgKioke3ZpZGVvcy5sZW5ndGggLSBtYXRjaENvdW50fSoqIHwgJHsoKCh2aWRlb3MubGVuZ3RoIC0gbWF0Y2hDb3VudCkgLyB2aWRlb3MubGVuZ3RoKSAqIDEwMCkudG9GaXhlZCgxKX0lIHxcbnwgKipOZWVkcyBWaXN1YWwgUmV2aWV3KiogfCAqKiR7dmlkZW9zLmZpbHRlcigodikgPT4gdi5oYXNWaXN1YWxHYXBzKS5sZW5ndGh9KiogfCAtIHxcblxuLS0tXG5cbiMjIPCfn6EgQWN0aW9uIEl0ZW1zXG5cbjEuICAqKlJ1biBUcmFuc2NyaXB0UHJvY2Vzc29yVjIqKiBmb3IgdGhlICoqJHt2aWRlb3MubGVuZ3RoIC0gbWF0Y2hDb3VudH0qKiBwZW5kaW5nIHZpZGVvcy5cbiAgICAqICAgKkNvbW1hbmQ6KiBcXGAuL3NjcmlwdHMvcnVuLXYyLnNoIC0tc3RhcnQ9NjMzIC0tZW5kPTFcXGAgKEl0IHdpbGwgc2tpcCBjb21wbGV0ZWQgb25lcyBpZiB3ZSB1cGRhdGUgdGhlIHN0YXRlIGZpbGUsIGJ1dCBjdXJyZW50bHkgVjIgc3RhdGUgaXMgZnJlc2gpLlxuMi4gICoqUnVuIFZpc3VhbEFuYWx5c3QqKiBmb3IgdGhlICoqJHt2aWRlb3MuZmlsdGVyKCh2KSA9PiB2Lmhhc1Zpc3VhbEdhcHMpLmxlbmd0aH0qKiB2aWRlb3MgbWFya2VkIFwiTmVlZHMgVmlzdWFsIFJldmlld1wiLlxuXG4tLS1cblxuIyMg8J+TnSBEZXRhaWxlZCBTdGF0dXNcblxufCAjIHwgVGl0bGUgfCBTdGF0dXMgfCBWaXN1YWwgR2FwcyB8XG58IDotLS0gfCA6LS0tIHwgOi0tLSB8IDotLS06IHxcbmA7XG5cbiAgLy8gU29ydDogUGVuZGluZyBmaXJzdCwgdGhlbiBWaXN1YWwgUmV2aWV3LCB0aGVuIENvbXBsZXRlXG4gIHZpZGVvcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgY29uc3Qgc2NvcmUgPSAoczogc3RyaW5nKSA9PiAocyA9PT0gJ1BlbmRpbmcnID8gMCA6IHMgPT09ICdOZWVkcyBWaXN1YWwgUmV2aWV3JyA/IDEgOiAyKTtcbiAgICByZXR1cm4gc2NvcmUoYS5zdGF0dXMpIC0gc2NvcmUoYi5zdGF0dXMpO1xuICB9KTtcblxuICBmb3IgKGNvbnN0IHYgb2YgdmlkZW9zKSB7XG4gICAgY29uc3QgaWNvbiA9IHYuc3RhdHVzID09PSAnQ29tcGxldGUnID8gJ+KchScgOiB2LnN0YXR1cyA9PT0gJ05lZWRzIFZpc3VhbCBSZXZpZXcnID8gJ+KaoO+4jycgOiAn4pqqJztcbiAgICBtZCArPSBgfCAke3YuaW5kZXh9IHwgJHt2LnRpdGxlLnN1YnN0cmluZygwLCA2MCl9JHt2LnRpdGxlLmxlbmd0aCA+IDYwID8gJy4uLicgOiAnJ30gfCAke2ljb259ICR7di5zdGF0dXN9IHwgJHt2LnZpc3VhbEdhcHNDb3VudCB8fCAnLSd9IHxcXG5gO1xuICB9XG5cbiAgZnMud3JpdGVGaWxlU3luYyhPVVRfRklMRSwgbWQpO1xuICBjb25zb2xlLmxvZyhgUmVwb3J0IGdlbmVyYXRlZCBhdDogJHtPVVRfRklMRX1gKTtcbn1cblxuYW5hbHl6ZSgpO1xuIl19

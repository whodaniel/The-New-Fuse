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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VuZXJhdGVTdGF0dXNSZXBvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJHZW5lcmF0ZVN0YXR1c1JlcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsZUFBZTtBQUNmLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztBQUNuRixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUN0RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztBQWEvRSxTQUFTLE9BQU87SUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7SUFFakQsK0JBQStCO0lBQy9CLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzFELE1BQU0sTUFBTSxHQUFrQixFQUFFLENBQUM7SUFDakMsTUFBTSxRQUFRLEdBQ1osaUdBQWlHLENBQUM7SUFDcEcsSUFBSSxLQUFLLENBQUM7SUFFVixPQUFPLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ1YsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFD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QUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxNQUFNLENBQUMsQ0FBQyxlQUFlLElBQUksR0FBRyxNQUFNLENBQUM7SUFDaEosQ0FBQztJQUVELEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELE9BQU8sRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gRGVmaW5lIHBhdGhzXG5jb25zdCBMSUJSQVJZX0ZJTEUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy4uJywgJy4uJywgJ2FpX3ZpZGVvX2xpYnJhcnkuaHRtbCcpO1xuY29uc3QgSU1QT1JUX0RJUiA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnZGF0YScsICdsaWJyYXJ5X2ltcG9ydCcpO1xuY29uc3QgT1VUX0ZJTEUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2RhdGEnLCAnUHJvY2Vzc2luZ1N0YXR1c1JlcG9ydC5tZCcpO1xuXG4vLyBJbnRlcmZhY2VzXG5pbnRlcmZhY2UgVmlkZW9TdGF0dXMge1xuICBpbmRleDogbnVtYmVyO1xuICB0aXRsZTogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbiAgaXNJbXBvcnRlZDogYm9vbGVhbjtcbiAgaGFzVmlzdWFsR2FwczogYm9vbGVhbjtcbiAgdmlzdWFsR2Fwc0NvdW50OiBudW1iZXI7XG4gIHN0YXR1czogJ0NvbXBsZXRlJyB8ICdOZWVkcyBWaXN1YWwgUmV2aWV3JyB8ICdQZW5kaW5nJztcbn1cblxuZnVuY3Rpb24gYW5hbHl6ZSgpIHtcbiAgY29uc29sZS5sb2coJ/Cfk4ogQW5hbHl6aW5nIFByb2Nlc3NpbmcgU3RhdHVzLi4uJyk7XG5cbiAgLy8gMS4gTG9hZCB0aGUgb3JpZ2luYWwgbGlicmFyeVxuICBjb25zdCBsaWJDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKExJQlJBUllfRklMRSwgJ3V0Zi04Jyk7XG4gIGNvbnN0IHZpZGVvczogVmlkZW9TdGF0dXNbXSA9IFtdO1xuICBjb25zdCByb3dSZWdleCA9XG4gICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICBsZXQgbWF0Y2g7XG5cbiAgd2hpbGUgKChtYXRjaCA9IHJvd1JlZ2V4LmV4ZWMobGliQ29udGVudCkpICE9PSBudWxsKSB7XG4gICAgdmlkZW9zLnB1c2goe1xuICAgICAgaW5kZXg6IHBhcnNlSW50KG1hdGNoWzFdKSxcbiAgICAgIHVybDogbWF0Y2hbMl0sXG4gICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgaXNJbXBvcnRlZDogZmFsc2UsXG4gICAgICBoYXNWaXN1YWxHYXBzOiBmYWxzZSxcbiAgICAgIHZpc3VhbEdhcHNDb3VudDogMCxcbiAgICAgIHN0YXR1czogJ1BlbmRpbmcnLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc29sZS5sb2coYExpYnJhcnkgY29udGFpbnMgJHt2aWRlb3MubGVuZ3RofSB0b3RhbCB2aWRlb3MuYCk7XG5cbiAgLy8gMi4gTWFwIEltcG9ydGVkIENoYXRzIHRvIFZpZGVvc1xuICAvLyBUaGlzIGlzIHRyaWNreSBiZWNhdXNlIGZpbGVuYW1lcyBhcmUgSURzLCBub3QgdmlkZW8gaW5kaWNlcy5cbiAgLy8gV2UgbmVlZCB0byBsb29rIGluc2lkZSBlYWNoIEpTT04gZmlsZSB0byBtYXRjaCB0aGUgVGl0bGUgb3IgVVJMLlxuXG4gIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoSU1QT1JUX0RJUikuZmlsdGVyKChmKSA9PiBmLmVuZHNXaXRoKCcuanNvbicpKTtcbiAgY29uc29sZS5sb2coYEZvdW5kICR7ZmlsZXMubGVuZ3RofSBpbXBvcnRlZCBjaGF0IGZpbGVzLmApO1xuXG4gIGxldCBtYXRjaENvdW50ID0gMDtcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihJTVBPUlRfRElSLCBmaWxlKSwgJ3V0Zi04Jyk7XG4gICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoY29udGVudCk7XG5cbiAgICAvLyBXZSBsb29rIGF0IHRoZSBmaXJzdCBVU0VSIG1lc3NhZ2Ugb3IgdGhlIGZpcnN0IE1PREVMIG1lc3NhZ2UgdGl0bGVcbiAgICAvLyBVc3VhbGx5IHRoZSBtb2RlbCBzdGFydHMgd2l0aCBcIkFuYWx5c2lzOiBbVmlkZW8gVGl0bGVdXCIgYmFzZWQgb24gb3VyIHByb21wdCBzdHJ1Y3R1cmVcbiAgICBjb25zdCB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoanNvbi50dXJucyk7XG5cbiAgICAvLyBGaW5kIG1hdGNoaW5nIHZpZGVvXG4gICAgY29uc3QgdmlkZW8gPSB2aWRlb3MuZmluZCgodikgPT4ge1xuICAgICAgLy8gU2ltcGxlIHRpdGxlIG1hdGNoIChjYXNlIGluc2Vuc2l0aXZlLCBwYXJ0aWFsKVxuICAgICAgLy8gVGhpcyBpcyBoZXVyaXN0aWMgYnV0IHVzdWFsbHkgZWZmZWN0aXZlIGlmIHRpdGxlcyBhZ3JlZVxuICAgICAgLy8gT3IgaWYgdGhlIFVSTCBhcHBlYXJlZCBpbiB0aGUgcHJvbXB0IChyYXJlKVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgdHlwZW9mIHY/LnRpdGxlID09PSAnc3RyaW5nJyAmJlxuICAgICAgICB0eXBlb2YgdGV4dCA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgdGV4dC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHYudGl0bGUudG9Mb3dlckNhc2UoKS5zdWJzdHJpbmcoMCwgMjApKVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGlmICh2aWRlbykge1xuICAgICAgdmlkZW8uaXNJbXBvcnRlZCA9IHRydWU7XG4gICAgICBtYXRjaENvdW50Kys7XG5cbiAgICAgIC8vIENoZWNrIGZvciBWaXN1YWwgR2Fwc1xuICAgICAgY29uc3QgZ2FwTWF0Y2hlcyA9IHRleHQubWF0Y2goL05lZWQgdG8gc2VlOi9nKTtcbiAgICAgIGlmIChnYXBNYXRjaGVzKSB7XG4gICAgICAgIHZpZGVvLmhhc1Zpc3VhbEdhcHMgPSB0cnVlO1xuICAgICAgICB2aWRlby52aXN1YWxHYXBzQ291bnQgPSBnYXBNYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ05lZWRzIFZpc3VhbCBSZXZpZXcnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ0NvbXBsZXRlJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zb2xlLmxvZyhgTWF0Y2hlZCAke21hdGNoQ291bnR9IHZpZGVvcyB3aXRoIGltcG9ydGVkIGFuYWx5c2lzLmApO1xuXG4gIC8vIDMuIEdlbmVyYXRlIFJlcG9ydFxuICBsZXQgbWQgPSBgIyDwn5OKIFZpZGVvIFByb2Nlc3NpbmcgU3RhdHVzIFJlcG9ydFxuKkdlbmVyYXRlZDogJHtuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCl9KlxuXG4jIyDwn5+iIFN1bW1hcnlcblxufCBNZXRyaWMgfCBDb3VudCB8IFBlcmNlbnRhZ2UgfFxufCA6LS0tIHwgOi0tLTogfCA6LS0tOiB8XG58ICoqVG90YWwgVmlkZW9zKiogfCAqKiR7dmlkZW9zLmxlbmd0aH0qKiB8IDEwMCUgfFxufCAqKkFuYWx5emVkIChJbXBvcnRlZCkqKiB8ICoqJHttYXRjaENvdW50fSoqIHwgJHsoKG1hdGNoQ291bnQgLyB2aWRlb3MubGVuZ3RoKSAqIDEwMCkudG9GaXhlZCgxKX0lIHxcbnwgKipQZW5kaW5nIChUbyBEbykqKiB8ICoqJHt2aWRlb3MubGVuZ3RoIC0gbWF0Y2hDb3VudH0qKiB8ICR7KCgodmlkZW9zLmxlbmd0aCAtIG1hdGNoQ291bnQpIC8gdmlkZW9zLmxlbmd0aCkgKiAxMDApLnRvRml4ZWQoMSl9JSB8XG58ICoqTmVlZHMgVmlzdWFsIFJldmlldyoqIHwgKioke3ZpZGVvcy5maWx0ZXIoKHYpID0+IHYuaGFzVmlzdWFsR2FwcykubGVuZ3RofSoqIHwgLSB8XG5cbi0tLVxuXG4jIyDwn5+hIEFjdGlvbiBJdGVtc1xuXG4xLiAgKipSdW4gVHJhbnNjcmlwdFByb2Nlc3NvclYyKiogZm9yIHRoZSAqKiR7dmlkZW9zLmxlbmd0aCAtIG1hdGNoQ291bnR9KiogcGVuZGluZyB2aWRlb3MuXG4gICAgKiAgICpDb21tYW5kOiogXFxgLi9zY3JpcHRzL3J1bi12Mi5zaCAtLXN0YXJ0PTYzMyAtLWVuZD0xXFxgIChJdCB3aWxsIHNraXAgY29tcGxldGVkIG9uZXMgaWYgd2UgdXBkYXRlIHRoZSBzdGF0ZSBmaWxlLCBidXQgY3VycmVudGx5IFYyIHN0YXRlIGlzIGZyZXNoKS5cbjIuICAqKlJ1biBWaXN1YWxBbmFseXN0KiogZm9yIHRoZSAqKiR7dmlkZW9zLmZpbHRlcigodikgPT4gdi5oYXNWaXN1YWxHYXBzKS5sZW5ndGh9KiogdmlkZW9zIG1hcmtlZCBcIk5lZWRzIFZpc3VhbCBSZXZpZXdcIi5cblxuLS0tXG5cbiMjIPCfk50gRGV0YWlsZWQgU3RhdHVzXG5cbnwgIyB8IFRpdGxlIHwgU3RhdHVzIHwgVmlzdWFsIEdhcHMgfFxufCA6LS0tIHwgOi0tLSB8IDotLS0gfCA6LS0tOiB8XG5gO1xuXG4gIC8vIFNvcnQ6IFBlbmRpbmcgZmlyc3QsIHRoZW4gVmlzdWFsIFJldmlldywgdGhlbiBDb21wbGV0ZVxuICB2aWRlb3Muc29ydCgoYSwgYikgPT4ge1xuICAgIGNvbnN0IHNjb3JlID0gKHM6IHN0cmluZykgPT4gKHMgPT09ICdQZW5kaW5nJyA/IDAgOiBzID09PSAnTmVlZHMgVmlzdWFsIFJldmlldycgPyAxIDogMik7XG4gICAgcmV0dXJuIHNjb3JlKGEuc3RhdHVzKSAtIHNjb3JlKGIuc3RhdHVzKTtcbiAgfSk7XG5cbiAgZm9yIChjb25zdCB2IG9mIHZpZGVvcykge1xuICAgIGNvbnN0IGljb24gPSB2LnN0YXR1cyA9PT0gJ0NvbXBsZXRlJyA/ICfinIUnIDogdi5zdGF0dXMgPT09ICdOZWVkcyBWaXN1YWwgUmV2aWV3JyA/ICfimqDvuI8nIDogJ+Kaqic7XG4gICAgbWQgKz0gYHwgJHt2LmluZGV4fSB8ICR7di50aXRsZS5zdWJzdHJpbmcoMCwgNjApfSR7di50aXRsZS5sZW5ndGggPiA2MCA/ICcuLi4nIDogJyd9IHwgJHtpY29ufSAke3Yuc3RhdHVzfSB8ICR7di52aXN1YWxHYXBzQ291bnQgfHwgJy0nfSB8XFxuYDtcbiAgfVxuXG4gIGZzLndyaXRlRmlsZVN5bmMoT1VUX0ZJTEUsIG1kKTtcbiAgY29uc29sZS5sb2coYFJlcG9ydCBnZW5lcmF0ZWQgYXQ6ICR7T1VUX0ZJTEV9YCk7XG59XG5cbmFuYWx5emUoKTtcbiJdfQ==

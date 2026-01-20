import * as fs from 'fs';
import * as path from 'path';

// Define paths
const LIBRARY_FILE = path.join(process.cwd(), '..', '..', 'ai_video_library.html');
const IMPORT_DIR = path.join(process.cwd(), 'data', 'library_import');
const OUT_FILE = path.join(process.cwd(), 'data', 'ProcessingStatusReport.md');

// Interfaces
interface VideoStatus {
  index: number;
  title: string;
  url: string;
  isImported: boolean;
  hasVisualGaps: boolean;
  visualGapsCount: number;
  status: 'Complete' | 'Needs Visual Review' | 'Pending';
}

function analyze() {
  console.log('📊 Analyzing Processing Status...');

  // 1. Load the original library
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const videos: VideoStatus[] = [];
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
        typeof v?.title === 'string' &&
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
    const score = (s: string) => (s === 'Pending' ? 0 : s === 'Needs Visual Review' ? 1 : 2);
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

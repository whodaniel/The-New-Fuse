import * as fs from 'fs';
import * as path from 'path';

const REPORTS_DIR = process.env.TNF_VIDEO_ARCHIVE_DIR
  ? path.resolve(process.env.TNF_VIDEO_ARCHIVE_DIR)
  : path.join(process.env.HOME || '/tmp', 'Documents', 'Video-Intelligence-Archive');
const MASTER_INDEX_FILE = path.join(REPORTS_DIR, 'MASTER_CHRONOLOGICAL_INDEX.md');

interface VideoEntry {
  filename: string;
  index: number;
  videoId: string;
  url: string;
  title: string;
  keyPoints: string;
}

function main() {
  console.log('🔄 Rebuilding Chronological Index via strict numerical sequence...');
  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.startsWith('api_') && f.endsWith('.md'));
  
  const videos: VideoEntry[] = [];
  const uniqueIds = new Set<string>();

  for (const file of files) {
    // Parse index from filename: api_123_videoID.md
    const match = file.match(/^api_(\d+)_([^\.]+)\.md$/);
    if (!match) continue;
    
    const index = parseInt(match[1], 10);
    const videoId = match[2];

    // Deduplicate logic: keep the highest index if duplicates exist, or just skip
    if (uniqueIds.has(videoId)) continue;
    uniqueIds.add(videoId);

    const content = fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8');
    
    const urlMatch = content.match(/\*\*URL:\*\*\s*(https?:\/\/[^\s]+)/);
    const url = urlMatch ? urlMatch[1] : `https://www.youtube.com/watch?v=${videoId}`;
    
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';

    let keyPoints = '- No key points extracted yet.';
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const json = JSON.parse(jsonMatch[1]);
        if (json.keyPoints && Array.isArray(json.keyPoints)) {
          keyPoints = json.keyPoints.map((p: string) => `- ${p}`).join('\n');
        }
      } catch (e) {}
    } else {
       const manualMatch = content.match(/### Key Points\n([\s\S]*?)(?=\n###|\n---)/);
       if (manualMatch) {
           keyPoints = manualMatch[1].trim();
       }
    }

    videos.push({ filename: file, index, videoId, url, title, keyPoints });
  }

  // Sort strictly by the numerical index (1, 2, 3, 4 ... 647)
  videos.sort((a, b) => a.index - b.index);

  console.log(`📝 Writing ${videos.length} deduplicated, sequentially ordered entries...`);
  
  let newIndexContent = '# Master Chronological Video Intelligence Index\n\n_This document maps the continuous evolution of technology. Entries are strictly ordered by their numerical progression in the master library, ensuring accurate chronological alignment._\n\n';
  
  for (const v of videos) {
    newIndexContent += `## Video #${v.index}: ${v.title}\n`;
    newIndexContent += `- **URL**: ${v.url}\n`;
    newIndexContent += `- **Report**: [Link](./${v.filename})\n`;
    newIndexContent += `- **Summary Points**:\n${v.keyPoints}\n\n---\n\n`;
  }

  fs.writeFileSync(MASTER_INDEX_FILE, newIndexContent);
  console.log('✨ Master Chronological Index successfully rebuilt and perfectly sequenced.');
}

main();

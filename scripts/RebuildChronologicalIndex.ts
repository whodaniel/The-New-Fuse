import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const REPORTS_DIR = process.env.TNF_VIDEO_ARCHIVE_DIR
  ? path.resolve(process.env.TNF_VIDEO_ARCHIVE_DIR)
  : path.join(process.env.HOME || '/tmp', 'Documents', 'Video-Intelligence-Archive');
const MASTER_INDEX_FILE = path.join(REPORTS_DIR, 'MASTER_CHRONOLOGICAL_INDEX.md');

interface VideoEntry {
  filename: string;
  videoId: string;
  url: string;
  title: string;
  keyPoints: string;
  uploadDate: string; // YYYYMMDD
  timestamp: number;
}

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return '';
  }
}

async function main() {
  console.log('🔄 Starting Chronological Reconstruction...');
  const files = fs.readdirSync(REPORTS_DIR).filter(f => f.startsWith('api_') && f.endsWith('.md'));
  console.log(`📁 Found ${files.length} intelligence reports.`);

  const videos: VideoEntry[] = [];
  const uniqueUrls = new Set<string>();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8');
    
    // Parse metadata
    const urlMatch = content.match(/\*\*URL:\*\*\s*(https?:\/\/[^\s]+)/);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    
    // Skip true duplicates
    if (uniqueUrls.has(url)) {
      console.log(`   ⏭️ Skipping duplicate: ${url}`);
      continue;
    }
    uniqueUrls.add(url);

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';

    const videoIdMatch = content.match(/\*\*Video ID:\*\*\s*([^\s]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';

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
       // Look for manual key points
       const manualMatch = content.match(/### Key Points\n([\s\S]*?)(?=\n###|\n---)/);
       if (manualMatch) {
           keyPoints = manualMatch[1].trim();
       }
    }

    process.stdout.write(`   📅 Fetching date for ${videoId} (${i + 1}/${files.length})... `);
    // Fetch upload_date using yt-dlp
    let uploadDate = run(`yt-dlp --print "%(upload_date)s" "${url}"`);
    
    if (!uploadDate || uploadDate.length !== 8) {
      console.log('Failed. Using fallback date.');
      // Fallback to extraction date or 1970 if it completely fails
      const processedMatch = content.match(/\*\*Processed:\*\*\s*([^\s]+)/);
      uploadDate = processedMatch ? processedMatch[1].replace(/[-T:Z.]/g, '').substring(0, 8) : '19700101';
    } else {
      console.log(uploadDate);
    }

    const year = parseInt(uploadDate.substring(0, 4));
    const month = parseInt(uploadDate.substring(4, 6)) - 1;
    const day = parseInt(uploadDate.substring(6, 8));
    const timestamp = new Date(year, month, day).getTime();

    videos.push({
      filename: file,
      videoId,
      url,
      title,
      keyPoints,
      uploadDate,
      timestamp
    });
  }

  console.log('\n📊 Sorting videos chronologically...');
  videos.sort((a, b) => a.timestamp - b.timestamp);

  console.log(`📝 Writing ${videos.length} unique entries to Master Index...`);
  
  let newIndexContent = '# Master Chronological Video Intelligence Index\n\n_This document maps the evolution of technology from the oldest recorded concept to the newest, based on strict YouTube publication dates._\n\n';
  
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const formattedDate = `${v.uploadDate.substring(0, 4)}-${v.uploadDate.substring(4, 6)}-${v.uploadDate.substring(6, 8)}`;
    
    newIndexContent += `## Video #${i + 1}: ${v.title}\n`;
    newIndexContent += `- **Published**: ${formattedDate}\n`;
    newIndexContent += `- **URL**: ${v.url}\n`;
    newIndexContent += `- **Report**: [Link](./${v.filename})\n`;
    newIndexContent += `- **Summary Points**:\n${v.keyPoints}\n\n---\n\n`;
  }

  fs.writeFileSync(MASTER_INDEX_FILE, newIndexContent);
  console.log('✨ Master Chronological Index successfully rebuilt and purged of duplicates.');
}

main().catch(console.error);

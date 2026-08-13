import * as fs from 'node:fs';
import * as path from 'node:path';

export interface IntelligenceStats {
  library: number;
  artifacts: number;
  density: string;
  status: string;
}

export function getIntelligenceStats(repoRoot: string): IntelligenceStats {
  const kbPath = path.join(repoRoot, '../my-ai-knowledge-base/AI_Knowledge_Base.md');
  const libPath = path.join(repoRoot, '../my-ai-knowledge-base/video-library/ai_video_library.html');
  
  let artifactsCount = 0;
  let libraryCount = 0;

  if (fs.existsSync(kbPath)) {
    const kbContent = fs.readFileSync(kbPath, 'utf8');
    const matches = kbContent.match(/## #(\d+):/g);
    artifactsCount = matches ? matches.length : 0;
  }

  if (fs.existsSync(libPath)) {
    const libContent = fs.readFileSync(libPath, 'utf8');
    const libMatches = libContent.match(/<td class="index-col">(\d+)<\/td>/g);
    if (libMatches) {
      const indices = libMatches.map(m => {
        const match = m.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      });
      libraryCount = Math.max(...indices, 0);
    }
  }

  const densityVal = libraryCount > 0 ? (artifactsCount / libraryCount) * 100 : 0;

  return {
    library: libraryCount,
    artifacts: artifactsCount,
    density: densityVal.toFixed(1) + '%',
    status: "[STATUS:SYNCHRONIZED]"
  };
}

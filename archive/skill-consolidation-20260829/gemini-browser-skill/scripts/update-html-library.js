const fs = require('fs');
const path = require('path');

const PLAYLIST_DATA_PATH = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill/data/ai-4-playlist.json';
const HTML_FILE_PATH = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-library/ai_video_library.html';
const STATE_FILE_PATH = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/transcript-v2-state.json';

function update() {
  const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
  let html = fs.readFileSync(HTML_FILE_PATH, 'utf-8');

  // Find the new ones (>647)
  const newVideosInState = state.queue.filter(v => v.index > 647).sort((a, b) => a.index - b.index);
  
  if (newVideosInState.length === 0) {
      console.log("No new videos (>647) found in state.");
      return;
  }

  let newRows = '';
  for (const v of newVideosInState) {
    newRows += `
            <tr>
                <td class="index-col">${v.index}</td>
                <td class="title-col">
                    <a href="${v.url}" target="_blank">${v.title}</a>
                </td>
                <td class="duration-col">--:--</td>
            </tr>`;
  }

  // Insert before </tbody>
  html = html.replace('        </tbody>', newRows + '\n        </tbody>');

  // Update counter
  const newTotal = 647 + newVideosInState.length;
  html = html.replace(/Total entries: \d+/, `Total entries: ${newTotal}`);

  fs.writeFileSync(HTML_FILE_PATH, html);
  console.log(`Updated HTML with ${newVideosInState.length} new rows. Total entries: ${newTotal}`);
}

update();

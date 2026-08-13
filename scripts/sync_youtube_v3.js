const fs = require('fs');
const path = require('path');
const os = require('os');
const { google } = require('googleapis');

const TNF_ROOT = process.env.TNF_ROOT_DIR
    ? path.resolve(process.env.TNF_ROOT_DIR)
    : path.resolve(__dirname, '..');
const WORKSPACE_ROOT = process.env.TNF_WORKSPACE_DIR
    ? path.resolve(process.env.TNF_WORKSPACE_DIR)
    : path.dirname(TNF_ROOT);

// Paths
const CREDENTIALS_FILE = process.env.YT_CREDENTIALS_FILE || path.join(WORKSPACE_ROOT, 'mcp-googledocs-server', 'credentials.json');
const TOKEN_FILE = process.env.YT_TOKEN_FILE || path.join(
    os.homedir(),
    '.gemini',
    'antigravity',
    'scratch',
    'mcp-servers',
    'youtube-mcp-server',
    'dist',
    'tokens.json'
);
const LIBRARY_FILE = process.env.YT_LIBRARY_FILE || path.join(
    WORKSPACE_ROOT,
    'my-ai-knowledge-base',
    'video-library',
    'ai_video_library.html'
);

async function getYouTubeClient() {
    const credsData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
    const clientConfig = credsData.installed || credsData.web;
    
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    
    const oauth2Client = new google.auth.OAuth2(
        clientConfig.client_id,
        clientConfig.client_secret,
        clientConfig.redirect_uris ? clientConfig.redirect_uris[0] : "http://localhost"
    );

    oauth2Client.setCredentials(tokenData);
    
    return google.youtube({ version: 'v3', auth: oauth2Client });
}

async function main() {
    try {
        const youtube = await getYouTubeClient();
        
        console.log("Fetching Watch Later videos...");
        const res = await youtube.playlistItems.list({
            part: ["snippet", "contentDetails"],
            playlistId: "WL",
            maxResults: 50
        });

        const items = res.data.items || [];
        console.log(`Found ${items.length} videos in Watch Later.`);

        // Read current library to get latest index
        let libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
        const rowRegex = /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>/g;
        let match;
        let maxIndex = 0;
        while ((match = rowRegex.exec(libContent)) !== null) {
            maxIndex = Math.max(maxIndex, parseInt(match[1]));
        }
        console.log(`Current max index in library: ${maxIndex}`);

        // Check which videos are new
        const existingIds = new Set();
        const idRegex = /https:\/\/www\.youtube\.com\/watch\?v=([^"& ]+)/g;
        while ((match = idRegex.exec(libContent)) !== null) {
            existingIds.add(match[1]);
        }

        const newVideos = items.filter(item => !existingIds.has(item.contentDetails.videoId));
        console.log(`Found ${newVideos.length} new videos to add.`);

        if (newVideos.length > 0) {
            // Append new rows before the closing </tbody> or </table>
            let newRows = "";
            // Reverse so they are added in order if playlist is newest-first
            for (const item of newVideos.reverse()) {
                maxIndex++;
                const videoId = item.contentDetails.videoId;
                const title = item.snippet.title;
                const url = `https://www.youtube.com/watch?v=${videoId}`;
                const date = new Date().toLocaleDateString();
                
                newRows += `                <tr>
                    <td class="index-col">${maxIndex}</td>
                    <td class="title-col"><a href="${url}" target="_blank">${title}</a></td>
                    <td class="duration-col">PENDING</td>
                    <td class="status-col"><span class="status-badge status-pending">New</span></td>
                </tr>\n`;
            }

            // Insert before the last </tbody> or </table>
            if (libContent.includes('</tbody>')) {
                libContent = libContent.replace('</tbody>', `${newRows}            </tbody>`);
            } else {
                libContent = libContent.replace('</table>', `${newRows}        </table>`);
            }

            fs.writeFileSync(LIBRARY_FILE, libContent);
            console.log(`Updated ${LIBRARY_FILE} with ${newVideos.length} new videos.`);
        } else {
            console.log("No new videos to add.");
        }

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("API Response:", error.response.data);
        }
    }
}

main();

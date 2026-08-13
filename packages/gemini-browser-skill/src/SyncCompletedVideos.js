#!/usr/bin/env ts-node
"use strict";
/**
 * Sync Completed Videos from library_import to processing_state.json
 *
 * This script reads the library_import folder (videos already processed in AI Studio)
 * and marks them as completed in the CLI's processing_state.json so they won't be reprocessed.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LIBRARY_FILE = path.join(process.cwd(), '..', '..', 'ai_video_library.html');
const IMPORT_DIR = path.join(process.cwd(), 'data', 'library_import');
const STATE_FILE = path.join(process.cwd(), 'data', 'processing_state.json');
console.log('🔄 Syncing completed videos from library_import to processing_state.json...\n');
// 1. Load the original library to get all video data
const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
const libraryVideos = [];
const rowRegex = /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
let match;
while ((match = rowRegex.exec(libContent)) !== null) {
    const url = match[2];
    const videoId = ((_a = url.match(/v=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1]) || url.split('/').pop() || '';
    libraryVideos.push({
        index: parseInt(match[1]),
        videoId,
        url,
        title: match[3].trim(),
    });
}
console.log(`📚 Loaded ${libraryVideos.length} videos from library`);
// 2. Read all library_import files to find completed videos
const importFiles = fs.readdirSync(IMPORT_DIR).filter((f) => f.endsWith('.json'));
console.log(`📥 Found ${importFiles.length} imported chat files`);
const completedTitles = new Set();
let visualGapCount = 0;
for (const file of importFiles) {
    try {
        const content = fs.readFileSync(path.join(IMPORT_DIR, file), 'utf-8');
        const json = JSON.parse(content);
        const text = JSON.stringify(json.turns);
        // Find which video this matches
        for (const video of libraryVideos) {
            if (text.toLowerCase().includes(video.title.toLowerCase().substring(0, 20))) {
                completedTitles.add(video.title);
                // Check if it needs visual review
                const gapMatches = text.match(/Need to see:/g);
                if (gapMatches && gapMatches.length > 0) {
                    visualGapCount++;
                }
                break;
            }
        }
    }
    catch (e) {
        // Skip invalid files
    }
}
console.log(`✅ Matched ${completedTitles.size} completed videos`);
console.log(`👁️  ${visualGapCount} videos need visual review\n`);
// 3. Load or create processing_state.json
let state;
if (fs.existsSync(STATE_FILE)) {
    console.log('📂 Loading existing processing_state.json...');
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}
else {
    console.log('📝 Creating new processing_state.json...');
    state = {
        version: '2.0',
        videos: [],
        stats: {
            completed: 0,
            metadataComplete: 0,
            transcriptComplete: 0,
            analyzed: 0,
            errors: 0,
            skipped: 0,
        },
    };
}
// 4. Create video entries for all library videos if they don't exist
for (const libVideo of libraryVideos) {
    let videoEntry = state.videos.find((v) => v.index === libVideo.index);
    if (!videoEntry) {
        // Create new entry
        videoEntry = {
            index: libVideo.index,
            videoId: libVideo.videoId,
            url: libVideo.url,
            title: libVideo.title,
            status: 'pending',
            processingAttempts: 0,
        };
        state.videos.push(videoEntry);
    }
    // Mark as completed if in library_import
    if (completedTitles.has(libVideo.title) && videoEntry.status !== 'completed') {
        console.log(`✅ Marking #${libVideo.index} as completed: ${libVideo.title.substring(0, 50)}...`);
        videoEntry.status = 'completed';
        videoEntry.processingAttempts = 1;
        videoEntry.lastProcessed = new Date().toISOString();
        // Mark as having analysis (we don't have the actual data, but we know it exists)
        videoEntry.analysis = {
            imported: true,
            source: 'library_import',
        };
    }
}
// 5. Update stats
state.stats.completed = state.videos.filter((v) => v.status === 'completed').length;
state.stats.analyzed = state.stats.completed;
// 6. Sort videos by index
state.videos.sort((a, b) => a.index - b.index);
// 7. Save updated state
fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
console.log(`\n💾 Saved updated processing_state.json`);
console.log(`📊 Total videos: ${state.videos.length}`);
console.log(`✅ Completed: ${state.stats.completed}`);
console.log(`⏸️  Pending: ${state.videos.length - state.stats.completed}`);
console.log(`\n✨ Sync complete! CLI will now skip the ${state.stats.completed} completed videos.\n`);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY0NvbXBsZXRlZFZpZGVvcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlN5bmNDb21wbGV0ZWRWaWRlb3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7Ozs7R0FLRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUU3QixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixDQUFDLENBQUM7QUFDbkYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDdEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLHVCQUF1QixDQUFDLENBQUM7QUF1QjdFLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0VBQStFLENBQUMsQ0FBQztBQUU3RixxREFBcUQ7QUFDckQsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDMUQsTUFBTSxhQUFhLEdBQVUsRUFBRSxDQUFDO0FBQ2hDLE1BQU0sUUFBUSxHQUNaLGlHQUFpRyxDQUFDO0FBQ3BHLElBQUksS0FBSyxDQUFDO0FBQ1YsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7SUFDcEQsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLE1BQU0sT0FBTyxHQUFHLENBQUEsTUFBQSxHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQywwQ0FBRyxDQUFDLENBQUMsS0FB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TUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7QUFDM0UsT0FBTyxDQUFDLEdBQUcsQ0FDVCw0Q0FBNEMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLHNCQUFzQixDQUN4RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgdHMtbm9kZVxuXG4vKipcbiAqIFN5bmMgQ29tcGxldGVkIFZpZGVvcyBmcm9tIGxpYnJhcnlfaW1wb3J0IHRvIHByb2Nlc3Npbmdfc3RhdGUuanNvblxuICpcbiAqIFRoaXMgc2NyaXB0IHJlYWRzIHRoZSBsaWJyYXJ5X2ltcG9ydCBmb2xkZXIgKHZpZGVvcyBhbHJlYWR5IHByb2Nlc3NlZCBpbiBBSSBTdHVkaW8pXG4gKiBhbmQgbWFya3MgdGhlbSBhcyBjb21wbGV0ZWQgaW4gdGhlIENMSSdzIHByb2Nlc3Npbmdfc3RhdGUuanNvbiBzbyB0aGV5IHdvbid0IGJlIHJlcHJvY2Vzc2VkLlxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IExJQlJBUllfRklMRSA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnLi4nLCAnLi4nLCAnYWlfdmlkZW9fbGlicmFyeS5odG1sJyk7XG5jb25zdCBJTVBPUlRfRElSID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdkYXRhJywgJ2xpYnJhcnlfaW1wb3J0Jyk7XG5jb25zdCBTVEFURV9GSUxFID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdkYXRhJywgJ3Byb2Nlc3Npbmdfc3RhdGUuanNvbicpO1xuXG5pbnRlcmZhY2UgVmlkZW9FbnRyeSB7XG4gIGluZGV4OiBudW1iZXI7XG4gIHZpZGVvSWQ6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGR1cmF0aW9uPzogc3RyaW5nO1xuICBzdGF0dXM6IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG4gIG1ldGFkYXRhPzogYW55O1xuICB0cmFuc2NyaXB0PzogYW55O1xuICBhbmFseXNpcz86IGFueTtcbiAgcHJvY2Vzc2luZ0F0dGVtcHRzOiBudW1iZXI7XG4gIGxhc3RQcm9jZXNzZWQ/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBQcm9jZXNzaW5nU3RhdGUge1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIHZpZGVvczogVmlkZW9FbnRyeVtdO1xuICBzdGF0czogYW55O1xufVxuXG5jb25zb2xlLmxvZygn8J+UhCBTeW5jaW5nIGNvbXBsZXRlZCB2aWRlb3MgZnJvbSBsaWJyYXJ5X2ltcG9ydCB0byBwcm9jZXNzaW5nX3N0YXRlLmpzb24uLi5cXG4nKTtcblxuLy8gMS4gTG9hZCB0aGUgb3JpZ2luYWwgbGlicmFyeSB0byBnZXQgYWxsIHZpZGVvIGRhdGFcbmNvbnN0IGxpYkNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoTElCUkFSWV9GSUxFLCAndXRmLTgnKTtcbmNvbnN0IGxpYnJhcnlWaWRlb3M6IGFueVtdID0gW107XG5jb25zdCByb3dSZWdleCA9XG4gIC88dHI+XFxzKjx0ZFtePl0qPlxccyooXFxkKylcXHMqPFxcL3RkPlxccyo8dGRbXj5dKj5cXHMqPGFcXHMraHJlZj1cIihbXlwiXSspXCJbXj5dKj4oW148XSspPFxcL2E+XFxzKjxcXC90ZD4vZztcbmxldCBtYXRjaDtcbndoaWxlICgobWF0Y2ggPSByb3dSZWdleC5leGVjKGxpYkNvbnRlbnQpKSAhPT0gbnVsbCkge1xuICBjb25zdCB1cmwgPSBtYXRjaFsyXTtcbiAgY29uc3QgdmlkZW9JZCA9IHVybC5tYXRjaCgvdj0oW14mXSspLyk/LlsxXSB8fCB1cmwuc3BsaXQoJy8nKS5wb3AoKSB8fCAnJztcbiAgbGlicmFyeVZpZGVvcy5wdXNoKHtcbiAgICBpbmRleDogcGFyc2VJbnQobWF0Y2hbMV0pLFxuICAgIHZpZGVvSWQsXG4gICAgdXJsLFxuICAgIHRpdGxlOiBtYXRjaFszXS50cmltKCksXG4gIH0pO1xufVxuXG5jb25zb2xlLmxvZyhg8J+TmiBMb2FkZWQgJHtsaWJyYXJ5VmlkZW9zLmxlbmd0aH0gdmlkZW9zIGZyb20gbGlicmFyeWApO1xuXG4vLyAyLiBSZWFkIGFsbCBsaWJyYXJ5X2ltcG9ydCBmaWxlcyB0byBmaW5kIGNvbXBsZXRlZCB2aWRlb3NcbmNvbnN0IGltcG9ydEZpbGVzID0gZnMucmVhZGRpclN5bmMoSU1QT1JUX0RJUikuZmlsdGVyKChmKSA9PiBmLmVuZHNXaXRoKCcuanNvbicpKTtcbmNvbnNvbGUubG9nKGDwn5OlIEZvdW5kICR7aW1wb3J0RmlsZXMubGVuZ3RofSBpbXBvcnRlZCBjaGF0IGZpbGVzYCk7XG5cbmNvbnN0IGNvbXBsZXRlZFRpdGxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xubGV0IHZpc3VhbEdhcENvdW50ID0gMDtcblxuZm9yIChjb25zdCBmaWxlIG9mIGltcG9ydEZpbGVzKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oSU1QT1JUX0RJUiwgZmlsZSksICd1dGYtOCcpO1xuICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgIGNvbnN0IHRleHQgPSBKU09OLnN0cmluZ2lmeShqc29uLnR1cm5zKTtcblxuICAgIC8vIEZpbmQgd2hpY2ggdmlkZW8gdGhpcyBtYXRjaGVzXG4gICAgZm9yIChjb25zdCB2aWRlbyBvZiBsaWJyYXJ5VmlkZW9zKSB7XG4gICAgICBpZiAodGV4dC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHZpZGVvLnRpdGxlLnRvTG93ZXJDYXNlKCkuc3Vic3RyaW5nKDAsIDIwKSkpIHtcbiAgICAgICAgY29tcGxldGVkVGl0bGVzLmFkZCh2aWRlby50aXRsZSk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgaXQgbmVlZHMgdmlzdWFsIHJldmlld1xuICAgICAgICBjb25zdCBnYXBNYXRjaGVzID0gdGV4dC5tYXRjaCgvTmVlZCB0byBzZWU6L2cpO1xuICAgICAgICBpZiAoZ2FwTWF0Y2hlcyAmJiBnYXBNYXRjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2aXN1YWxHYXBDb3VudCsrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFNraXAgaW52YWxpZCBmaWxlc1xuICB9XG59XG5cbmNvbnNvbGUubG9nKGDinIUgTWF0Y2hlZCAke2NvbXBsZXRlZFRpdGxlcy5zaXplfSBjb21wbGV0ZWQgdmlkZW9zYCk7XG5jb25zb2xlLmxvZyhg8J+Rge+4jyAgJHt2aXN1YWxHYXBDb3VudH0gdmlkZW9zIG5lZWQgdmlzdWFsIHJldmlld1xcbmApO1xuXG4vLyAzLiBMb2FkIG9yIGNyZWF0ZSBwcm9jZXNzaW5nX3N0YXRlLmpzb25cbmxldCBzdGF0ZTogUHJvY2Vzc2luZ1N0YXRlO1xuXG5pZiAoZnMuZXhpc3RzU3luYyhTVEFURV9GSUxFKSkge1xuICBjb25zb2xlLmxvZygn8J+TgiBMb2FkaW5nIGV4aXN0aW5nIHByb2Nlc3Npbmdfc3RhdGUuanNvbi4uLicpO1xuICBzdGF0ZSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKFNUQVRFX0ZJTEUsICd1dGYtOCcpKTtcbn0gZWxzZSB7XG4gIGNvbnNvbGUubG9nKCfwn5OdIENyZWF0aW5nIG5ldyBwcm9jZXNzaW5nX3N0YXRlLmpzb24uLi4nKTtcbiAgc3RhdGUgPSB7XG4gICAgdmVyc2lvbjogJzIuMCcsXG4gICAgdmlkZW9zOiBbXSxcbiAgICBzdGF0czoge1xuICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgbWV0YWRhdGFDb21wbGV0ZTogMCxcbiAgICAgIHRyYW5zY3JpcHRDb21wbGV0ZTogMCxcbiAgICAgIGFuYWx5emVkOiAwLFxuICAgICAgZXJyb3JzOiAwLFxuICAgICAgc2tpcHBlZDogMCxcbiAgICB9LFxuICB9O1xufVxuXG4vLyA0LiBDcmVhdGUgdmlkZW8gZW50cmllcyBmb3IgYWxsIGxpYnJhcnkgdmlkZW9zIGlmIHRoZXkgZG9uJ3QgZXhpc3RcbmZvciAoY29uc3QgbGliVmlkZW8gb2YgbGlicmFyeVZpZGVvcykge1xuICBsZXQgdmlkZW9FbnRyeSA9IHN0YXRlLnZpZGVvcy5maW5kKCh2KSA9PiB2LmluZGV4ID09PSBsaWJWaWRlby5pbmRleCk7XG5cbiAgaWYgKCF2aWRlb0VudHJ5KSB7XG4gICAgLy8gQ3JlYXRlIG5ldyBlbnRyeVxuICAgIHZpZGVvRW50cnkgPSB7XG4gICAgICBpbmRleDogbGliVmlkZW8uaW5kZXgsXG4gICAgICB2aWRlb0lkOiBsaWJWaWRlby52aWRlb0lkLFxuICAgICAgdXJsOiBsaWJWaWRlby51cmwsXG4gICAgICB0aXRsZTogbGliVmlkZW8udGl0bGUsXG4gICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcbiAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogMCxcbiAgICB9O1xuICAgIHN0YXRlLnZpZGVvcy5wdXNoKHZpZGVvRW50cnkpO1xuICB9XG5cbiAgLy8gTWFyayBhcyBjb21wbGV0ZWQgaWYgaW4gbGlicmFyeV9pbXBvcnRcbiAgaWYgKGNvbXBsZXRlZFRpdGxlcy5oYXMobGliVmlkZW8udGl0bGUpICYmIHZpZGVvRW50cnkuc3RhdHVzICE9PSAnY29tcGxldGVkJykge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYOKchSBNYXJraW5nICMke2xpYlZpZGVvLmluZGV4fSBhcyBjb21wbGV0ZWQ6ICR7bGliVmlkZW8udGl0bGUuc3Vic3RyaW5nKDAsIDUwKX0uLi5gXG4gICAgKTtcbiAgICB2aWRlb0VudHJ5LnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgIHZpZGVvRW50cnkucHJvY2Vzc2luZ0F0dGVtcHRzID0gMTtcbiAgICB2aWRlb0VudHJ5Lmxhc3RQcm9jZXNzZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG5cbiAgICAvLyBNYXJrIGFzIGhhdmluZyBhbmFseXNpcyAod2UgZG9uJ3QgaGF2ZSB0aGUgYWN0dWFsIGRhdGEsIGJ1dCB3ZSBrbm93IGl0IGV4aXN0cylcbiAgICB2aWRlb0VudHJ5LmFuYWx5c2lzID0ge1xuICAgICAgaW1wb3J0ZWQ6IHRydWUsXG4gICAgICBzb3VyY2U6ICdsaWJyYXJ5X2ltcG9ydCcsXG4gICAgfTtcbiAgfVxufVxuXG4vLyA1LiBVcGRhdGUgc3RhdHNcbnN0YXRlLnN0YXRzLmNvbXBsZXRlZCA9IHN0YXRlLnZpZGVvcy5maWx0ZXIoKHYpID0+IHYuc3RhdHVzID09PSAnY29tcGxldGVkJykubGVuZ3RoO1xuc3RhdGUuc3RhdHMuYW5hbHl6ZWQgPSBzdGF0ZS5zdGF0cy5jb21wbGV0ZWQ7XG5cbi8vIDYuIFNvcnQgdmlkZW9zIGJ5IGluZGV4XG5zdGF0ZS52aWRlb3Muc29ydCgoYSwgYikgPT4gYS5pbmRleCAtIGIuaW5kZXgpO1xuXG4vLyA3LiBTYXZlIHVwZGF0ZWQgc3RhdGVcbmZzLndyaXRlRmlsZVN5bmMoU1RBVEVfRklMRSwgSlNPTi5zdHJpbmdpZnkoc3RhdGUsIG51bGwsIDIpLCAndXRmLTgnKTtcblxuY29uc29sZS5sb2coYFxcbvCfkr4gU2F2ZWQgdXBkYXRlZCBwcm9jZXNzaW5nX3N0YXRlLmpzb25gKTtcbmNvbnNvbGUubG9nKGDwn5OKIFRvdGFsIHZpZGVvczogJHtzdGF0ZS52aWRlb3MubGVuZ3RofWApO1xuY29uc29sZS5sb2coYOKchSBDb21wbGV0ZWQ6ICR7c3RhdGUuc3RhdHMuY29tcGxldGVkfWApO1xuY29uc29sZS5sb2coYOKPuO+4jyAgUGVuZGluZzogJHtzdGF0ZS52aWRlb3MubGVuZ3RoIC0gc3RhdGUuc3RhdHMuY29tcGxldGVkfWApO1xuY29uc29sZS5sb2coXG4gIGBcXG7inKggU3luYyBjb21wbGV0ZSEgQ0xJIHdpbGwgbm93IHNraXAgdGhlICR7c3RhdGUuc3RhdHMuY29tcGxldGVkfSBjb21wbGV0ZWQgdmlkZW9zLlxcbmBcbik7XG4iXX0=
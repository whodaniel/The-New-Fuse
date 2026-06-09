"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PLAYLIST_DATA_PATH = path.join(__dirname, '../data/ai-4-playlist.json');
const STATE_FILE_PATH = path.join(__dirname, '../../../data/transcript-v2-state.json');
function sync() {
    if (!fs.existsSync(PLAYLIST_DATA_PATH)) {
        console.error('Playlist data not found');
        return;
    }
    if (!fs.existsSync(STATE_FILE_PATH)) {
        console.error('State file not found');
        return;
    }
    const playlist = JSON.parse(fs.readFileSync(PLAYLIST_DATA_PATH, 'utf-8'));
    const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
    console.log(`Current state has ${state.queue.length} videos.`);
    console.log(`Playlist has ${playlist.length} videos.`);
    const existingIds = new Set(state.queue.map(v => v.videoId));
    let maxIndex = Math.max(...state.queue.map(v => v.index), 0);
    const newEntries = [];
    let updatedCount = 0;
    // Process in reverse to maintain playlist order (assuming playlist is newest first)
    for (const v of playlist) {
        if (!existingIds.has(v.videoId)) {
            maxIndex++;
            const newEntry = {
                index: maxIndex,
                url: v.url,
                title: v.title,
                videoId: v.videoId,
                status: 'pending',
                processingAttempts: 0
            };
            newEntries.push(newEntry);
            console.log(`Adding new video: ${v.title} (#${maxIndex})`);
        }
        else {
            // Prioritize existing ones from the playlist
            const existing = state.queue.find(ev => ev.videoId === v.videoId);
            if (existing && (existing.status === 'error' || existing.status === 'skipped' || existing.status === 'pending')) {
                existing.status = 'pending';
                existing.processingAttempts = 0; // Reset to ensure it runs
                updatedCount++;
            }
        }
    }
    // Add new entries to the START of the queue to prioritize them
    state.queue = [...newEntries, ...state.queue];
    state.stats.totalVideos = state.queue.length;
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
    console.log(`\nSync complete.`);
    console.log(`Added: ${newEntries.length}`);
    console.log(`Reset for priority: ${updatedCount}`);
    console.log(`New total: ${state.queue.length}`);
}
sync();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy1wbGF5bGlzdC10by1zdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN5bmMtcGxheWxpc3QtdG8tc3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztBQUM5RSxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDO0FBcUJ2RixTQUFTLElBQUk7SUFDWCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUM7UUFDdkMsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87SUFDVCxDQUFDO0lBQ0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztRQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDdEMsT0FBTztJQUNULENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNqRixNQUFNLEtBQUssR0FBb0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRXJGLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxVQUFVLENBQUMsQ0FBQztJQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixRQUFRLENBQUMsTUFBTSxVQUFVLENBQUMsQ0FB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cnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zdCBQTEFZTElTVF9EQVRBX1BBVEggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vZGF0YS9haS00LXBsYXlsaXN0Lmpzb24nKTtcbmNvbnN0IFNUQVRFX0ZJTEVfUEFUSCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9kYXRhL3RyYW5zY3JpcHQtdjItc3RhdGUuanNvbicpO1xuXG5pbnRlcmZhY2UgVmlkZW9FbnRyeSB7XG4gIGluZGV4OiBudW1iZXI7XG4gIHVybDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB2aWRlb0lkOiBzdHJpbmc7XG4gIHN0YXR1czogc3RyaW5nO1xuICBwcm9jZXNzaW5nQXR0ZW1wdHM6IG51bWJlcjtcbiAgW2tleTogc3RyaW5nXTogYW55O1xufVxuXG5pbnRlcmZhY2UgUHJvY2Vzc2luZ1N0YXRlIHtcbiAgdmVyc2lvbjogc3RyaW5nO1xuICBxdWV1ZTogVmlkZW9FbnRyeVtdO1xuICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgc3RhcnRlZEF0OiBzdHJpbmc7XG4gIGxhc3RVcGRhdGVkOiBzdHJpbmc7XG4gIHN0YXRzOiBhbnk7XG59XG5cbmZ1bmN0aW9uIHN5bmMoKSB7XG4gIGlmICghZnMuZXhpc3RzU3luYyhQTEFZTElTVF9EQVRBX1BBVEgpKSB7XG4gICAgY29uc29sZS5lcnJvcignUGxheWxpc3QgZGF0YSBub3QgZm91bmQnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFmcy5leGlzdHNTeW5jKFNUQVRFX0ZJTEVfUEFUSCkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdTdGF0ZSBmaWxlIG5vdCBmb3VuZCcpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHBsYXlsaXN0OiBhbnlbXSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKFBMQVlMSVNUX0RBVEFfUEFUSCwgJ3V0Zi04JykpO1xuICBjb25zdCBzdGF0ZTogUHJvY2Vzc2luZ1N0YXRlID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoU1RBVEVfRklMRV9QQVRILCAndXRmLTgnKSk7XG5cbiAgY29uc29sZS5sb2coYEN1cnJlbnQgc3RhdGUgaGFzICR7c3RhdGUucXVldWUubGVuZ3RofSB2aWRlb3MuYCk7XG4gIGNvbnNvbGUubG9nKGBQbGF5bGlzdCBoYXMgJHtwbGF5bGlzdC5sZW5ndGh9IHZpZGVvcy5gKTtcblxuICBjb25zdCBleGlzdGluZ0lkcyA9IG5ldyBTZXQoc3RhdGUucXVldWUubWFwKHYgPT4gdi52aWRlb0lkKSk7XG4gIGxldCBtYXhJbmRleCA9IE1hdGgubWF4KC4uLnN0YXRlLnF1ZXVlLm1hcCh2ID0+IHYuaW5kZXgpLCAwKTtcbiAgXG4gIGNvbnN0IG5ld0VudHJpZXM6IFZpZGVvRW50cnlbXSA9IFtdO1xuICBsZXQgdXBkYXRlZENvdW50ID0gMDtcblxuICAvLyBQcm9jZXNzIGluIHJldmVyc2UgdG8gbWFpbnRhaW4gcGxheWxpc3Qgb3JkZXIgKGFzc3VtaW5nIHBsYXlsaXN0IGlzIG5ld2VzdCBmaXJzdClcbiAgZm9yIChjb25zdCB2IG9mIHBsYXlsaXN0KSB7XG4gICAgaWYgKCFleGlzdGluZ0lkcy5oYXModi52aWRlb0lkKSkge1xuICAgICAgbWF4SW5kZXgrKztcbiAgICAgIGNvbnN0IG5ld0VudHJ5OiBWaWRlb0VudHJ5ID0ge1xuICAgICAgICBpbmRleDogbWF4SW5kZXgsXG4gICAgICAgIHVybDogdi51cmwsXG4gICAgICAgIHRpdGxlOiB2LnRpdGxlLFxuICAgICAgICB2aWRlb0lkOiB2LnZpZGVvSWQsXG4gICAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgICAgICBwcm9jZXNzaW5nQXR0ZW1wdHM6IDBcbiAgICAgIH07XG4gICAgICBuZXdFbnRyaWVzLnB1c2gobmV3RW50cnkpO1xuICAgICAgY29uc29sZS5sb2coYEFkZGluZyBuZXcgdmlkZW86ICR7di50aXRsZX0gKCMke21heEluZGV4fSlgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUHJpb3JpdGl6ZSBleGlzdGluZyBvbmVzIGZyb20gdGhlIHBsYXlsaXN0XG4gICAgICBjb25zdCBleGlzdGluZyA9IHN0YXRlLnF1ZXVlLmZpbmQoZXYgPT4gZXYudmlkZW9JZCA9PT0gdi52aWRlb0lkKTtcbiAgICAgIGlmIChleGlzdGluZyAmJiAoZXhpc3Rpbmcuc3RhdHVzID09PSAnZXJyb3InIHx8IGV4aXN0aW5nLnN0YXR1cyA9PT0gJ3NraXBwZWQnIHx8IGV4aXN0aW5nLnN0YXR1cyA9PT0gJ3BlbmRpbmcnKSkge1xuICAgICAgICBleGlzdGluZy5zdGF0dXMgPSAncGVuZGluZyc7XG4gICAgICAgIGV4aXN0aW5nLnByb2Nlc3NpbmdBdHRlbXB0cyA9IDA7IC8vIFJlc2V0IHRvIGVuc3VyZSBpdCBydW5zXG4gICAgICAgIHVwZGF0ZWRDb3VudCsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBuZXcgZW50cmllcyB0byB0aGUgU1RBUlQgb2YgdGhlIHF1ZXVlIHRvIHByaW9yaXRpemUgdGhlbVxuICBzdGF0ZS5xdWV1ZSA9IFsuLi5uZXdFbnRyaWVzLCAuLi5zdGF0ZS5xdWV1ZV07XG4gIHN0YXRlLnN0YXRzLnRvdGFsVmlkZW9zID0gc3RhdGUucXVldWUubGVuZ3RoO1xuICBzdGF0ZS5sYXN0VXBkYXRlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICBmcy53cml0ZUZpbGVTeW5jKFNUQVRFX0ZJTEVfUEFUSCwgSlNPTi5zdHJpbmdpZnkoc3RhdGUsIG51bGwsIDIpKTtcbiAgY29uc29sZS5sb2coYFxcblN5bmMgY29tcGxldGUuYCk7XG4gIGNvbnNvbGUubG9nKGBBZGRlZDogJHtuZXdFbnRyaWVzLmxlbmd0aH1gKTtcbiAgY29uc29sZS5sb2coYFJlc2V0IGZvciBwcmlvcml0eTogJHt1cGRhdGVkQ291bnR9YCk7XG4gIGNvbnNvbGUubG9nKGBOZXcgdG90YWw6ICR7c3RhdGUucXVldWUubGVuZ3RofWApO1xufVxuXG5zeW5jKCk7XG4iXX0=
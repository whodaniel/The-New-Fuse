"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeTranscriber = void 0;
import axios_1 from 'axios';
class YouTubeTranscriber {
    isValidYouTubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return youtubeRegex.test(url);
    }
    async transcribeVideo(videoUrl) {
        if (!this.isValidYouTubeUrl(videoUrl)) {
            throw new Error('Invalid YouTube URL provided');
        }
        try {
            const videoId = this.extractVideoId(videoUrl);
            const response = await axios_1.default.get(`https://api.youtubetranscript.com/?videoId=${videoId}`);
            return response.data;
        }
        catch (error) {
            console.error('Transcription failed:', error);
            throw new Error(`Failed to transcribe video: ${error.message}`);
        }
    }
    extractVideoId(url) {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop() || '';
    }
}
exports.YouTubeTranscriber = YouTubeTranscriber;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWW91VHViZVRyYW5zY3JpYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiWW91VHViZVRyYW5zY3JpYmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUEwQjtBQVExQixNQUFNLGtCQUFrQjtJQUNaLGlCQUFpQixDQUFDLEdBQVc7UUFDakMsTUFBTSxZQUFZLEdBQUcsc0RBQXNELENBQUM7UUFDNUUsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQWdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELElBQUksQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUMsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFLLENBQUMsR0FBRyxDQUFDLDhDQUE4QyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQztRQUN6QixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDOUMsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDcEUsQ0FBQztJQUNMLENBQUM7SUFFTyxjQUFjLENBQUMsR0FBVztRQUM5QixNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QixPQUFPLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNsRixDQUFDO0NBQ0o7QUFFUSxnREFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xuXG5pbnRlcmZhY2UgVHJhbnNjcmlwdGlvblJlc3VsdCB7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIHN0YXJ0OiBzdHJpbmc7XG4gICAgZHVyYXRpb246IHN0cmluZztcbn1cblxuY2xhc3MgWW91VHViZVRyYW5zY3JpYmVyIHtcbiAgICBwcml2YXRlIGlzVmFsaWRZb3VUdWJlVXJsKHVybDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IHlvdXR1YmVSZWdleCA9IC9eKGh0dHBzPzpcXC9cXC8pPyh3d3dcXC4pPyh5b3V0dWJlXFwuY29tfHlvdXR1XFwuYmUpXFwvLiskLztcbiAgICAgICAgcmV0dXJuIHlvdXR1YmVSZWdleC50ZXN0KHVybCk7XG4gICAgfVxuXG4gICAgYXN5bmMgdHJhbnNjcmliZVZpZGVvKHZpZGVvVXJsOiBzdHJpbmcpOiBQcm9taXNlPFRyYW5zY3JpcHRpb25SZXN1bHRbXT4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZFlvdVR1YmVVcmwodmlkZW9VcmwpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgWW91VHViZSBVUkwgcHJvdmlkZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB2aWRlb0lkID0gdGhpcy5leHRyYWN0VmlkZW9JZCh2aWRlb1VybCk7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgaHR0cHM6Ly9hcGkueW91dHViZXRyYW5zY3JpcHQuY29tLz92aWRlb0lkPSR7dmlkZW9JZH1gKTtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignVHJhbnNjcmlwdGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gdHJhbnNjcmliZSB2aWRlbzogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBleHRyYWN0VmlkZW9JZCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHVybE9iaiA9IG5ldyBVUkwodXJsKTtcbiAgICAgICAgcmV0dXJuIHVybE9iai5zZWFyY2hQYXJhbXMuZ2V0KCd2JykgfHwgdXJsT2JqLnBhdGhuYW1lLnNwbGl0KCcvJykucG9wKCkgfHwgJyc7XG4gICAgfVxufVxuXG5leHBvcnQgeyBZb3VUdWJlVHJhbnNjcmliZXIsIFRyYW5zY3JpcHRpb25SZXN1bHQgfTsiXX0=
export {};

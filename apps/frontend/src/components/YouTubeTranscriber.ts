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
            const response = await axios.get(`https://api.youtubetranscript.com/?videoId=${videoId}`);
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
export { YouTubeTranscriber };
//# sourceMappingURL=YouTubeTranscriber.js.map
interface TranscriptionResult {
    text: string;
    start: string;
    duration: string;
}
declare class YouTubeTranscriber {
    private isValidYouTubeUrl;
    transcribeVideo(videoUrl: string): Promise<TranscriptionResult[]>;
    private extractVideoId;
}
export { YouTubeTranscriber, TranscriptionResult };

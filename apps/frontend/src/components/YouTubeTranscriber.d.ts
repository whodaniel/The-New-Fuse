declare class YouTubeTranscriber {
    isValidYouTubeUrl(url: any): boolean;
    transcribeVideo(videoUrl: any): Promise<any>;
    extractVideoId(url: any): string;
}
export { YouTubeTranscriber };

interface VideoAnalysis {
    video_id: string;
    transcript: string;
    [key: string]: unknown;
}
interface AnalysisResult {
    analysis_path: string;
    video_id: string;
    transcript_summary: string;
}
declare class WizardSession {
    private projectPath;
    private visualizer;
    constructor(projectPath: string);
    analyzeAndVisualize(): void;
    analyzeVideo(videoId: string): AnalysisResult;
}
export { WizardSession, VideoAnalysis, AnalysisResult };

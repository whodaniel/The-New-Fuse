interface TranscriptEntry {
    text: string;
    start: number;
    duration: number;
}
interface TimestampEntry {
    text: string;
    start: number;
    duration: number;
}
declare class TranscriptProcessor {
    private timestamps;
    constructor();
    processTranscript(transcript: TranscriptEntry[]): string;
    getTimestamps(): TimestampEntry[];
}
export { TranscriptProcessor, TranscriptEntry, TimestampEntry };

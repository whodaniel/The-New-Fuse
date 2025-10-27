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

class TranscriptProcessor {
    private timestamps: TimestampEntry[];
    
    constructor() {
        this.timestamps = [];
    }

    public processTranscript(transcript: TranscriptEntry[]): string {
        const textParts: string[] = [];
        this.timestamps = []; // Reset timestamps for new transcript

        for (const entry of transcript) {
            this.timestamps.push({
                text: entry.text,
                start: entry.start,
                duration: entry.duration
            });
            textParts.push(entry.text);
        }
        return textParts.join(' ');
    }

    /**
     * Finds a transcript entry containing the given timestamp
     * @param timestamp The timestamp in seconds
     * @returns The matching TimestampEntry or null if not found
     */
    public findEntryByTimestamp(timestamp: number): TimestampEntry | null {
        for (const entry of this.timestamps) {
            const start = entry.start;
            if (timestamp >= start && timestamp <= start + entry.duration) {
                return entry;
            }
        }
        return null;
    }

    public getTimestamps(): TimestampEntry[] {
        return [...this.timestamps];
    }
}

export { TranscriptProcessor, TranscriptEntry, TimestampEntry };
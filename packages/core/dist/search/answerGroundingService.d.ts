import { z } from 'zod';
export declare const GroundedAnswerSchema: z.ZodObject<{
    answer: z.ZodString;
    citations: z.ZodArray<z.ZodObject<{
        chunkId: z.ZodString;
        sourceDocument: z.ZodString;
        sourceUri: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        relevanceScore: z.ZodNumber;
        sentenceIndices: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    }, z.core.$strip>>;
    confidence: z.ZodNumber;
    ungroundedClaims: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type GroundedAnswer = z.infer<typeof GroundedAnswerSchema>;
export interface RetrievedChunk {
    id: string;
    content: string;
    sourceDocument: string;
    sourceUri?: string;
    score: number;
}
export declare class AnswerGroundingService {
    groundAnswer(generatedAnswer: string, retrievedChunks: RetrievedChunk[]): GroundedAnswer;
    private splitSentences;
    private findBestChunk;
    private isFactualClaim;
}
//# sourceMappingURL=answerGroundingService.d.ts.map
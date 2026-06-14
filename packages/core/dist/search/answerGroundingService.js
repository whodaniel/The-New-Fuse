import { z } from 'zod';
export const GroundedAnswerSchema = z.object({
    answer: z.string(),
    citations: z.array(z.object({
        chunkId: z.string(),
        sourceDocument: z.string(),
        sourceUri: z.string().optional(),
        text: z.string(),
        relevanceScore: z.number().min(0).max(1),
        sentenceIndices: z.array(z.number()).default([]),
    })),
    confidence: z.number().min(0).max(1),
    ungroundedClaims: z.array(z.string()).default([]),
});
export class AnswerGroundingService {
    groundAnswer(generatedAnswer, retrievedChunks) {
        const sentences = this.splitSentences(generatedAnswer);
        const citations = [];
        const ungroundedClaims = [];
        for (const sentence of sentences) {
            const bestChunk = this.findBestChunk(sentence, retrievedChunks);
            if (bestChunk && bestChunk.score > 0.3) {
                const existingCitation = citations.find(c => c.chunkId === bestChunk.chunk.id);
                if (existingCitation) {
                    existingCitation.sentenceIndices.push(sentences.indexOf(sentence));
                }
                else {
                    citations.push({
                        chunkId: bestChunk.chunk.id,
                        sourceDocument: bestChunk.chunk.sourceDocument,
                        sourceUri: bestChunk.chunk.sourceUri,
                        text: bestChunk.chunk.content.slice(0, 200),
                        relevanceScore: bestChunk.score,
                        sentenceIndices: [sentences.indexOf(sentence)],
                    });
                }
            }
            else if (this.isFactualClaim(sentence)) {
                ungroundedClaims.push(sentence);
            }
        }
        const citedSentenceCount = new Set(citations.flatMap(c => c.sentenceIndices)).size;
        const confidence = sentences.length > 0 ? citedSentenceCount / sentences.length : 0;
        return {
            answer: generatedAnswer,
            citations,
            confidence: Math.min(confidence, 1),
            ungroundedClaims,
        };
    }
    splitSentences(text) {
        return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    }
    findBestChunk(sentence, chunks) {
        const sentenceTerms = sentence.toLowerCase().split(/\s+/).filter(t => t.length > 3);
        if (sentenceTerms.length === 0)
            return null;
        let bestScore = 0;
        let bestChunk = null;
        for (const chunk of chunks) {
            const chunkLower = chunk.content.toLowerCase();
            const overlap = sentenceTerms.filter(t => chunkLower.includes(t)).length;
            const score = overlap / sentenceTerms.length;
            if (score > bestScore) {
                bestScore = score;
                bestChunk = chunk;
            }
        }
        return bestChunk ? { chunk: bestChunk, score: bestScore } : null;
    }
    isFactualClaim(sentence) {
        const factualPatterns = [
            /\d{4}/,
            /\d+%/,
            /according to/i,
            /found that/i,
            /show(s|ed)/i,
            /reported/i,
            /studies/i,
            /data shows/i,
            /evidence/i,
            /research/i,
        ];
        return factualPatterns.some(p => p.test(sentence));
    }
}
//# sourceMappingURL=answerGroundingService.js.map
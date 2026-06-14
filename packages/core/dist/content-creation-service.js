import { z } from 'zod';
export const ContentCreationRequestSchema = z.object({
    title: z.string(),
    contentType: z.enum(['blog_post', 'documentation', 'code_comment', 'changelog', 'release_notes', 'agent_report']),
    sourceMaterial: z.string().describe('Raw content or context to transform'),
    targetAudience: z.enum(['developers', 'end_users', 'agents', 'stakeholders']).default('developers'),
    tone: z.enum(['technical', 'conversational', 'formal', 'concise']).default('technical'),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export class ContentCreationService {
    constructor() {
        this.drafts = new Map();
    }
    async createDraft(request) {
        const id = crypto.randomUUID();
        const content = this.formatContent(request);
        const result = {
            id,
            status: 'draft',
            content,
            createdAt: new Date().toISOString(),
        };
        this.drafts.set(id, result);
        return result;
    }
    async submitForReview(contentId) {
        const draft = this.drafts.get(contentId);
        if (!draft)
            throw new Error(`Content ${contentId} not found`);
        draft.status = 'pending_review';
        return draft;
    }
    async approve(contentId) {
        const draft = this.drafts.get(contentId);
        if (!draft)
            throw new Error(`Content ${contentId} not found`);
        if (draft.status !== 'pending_review')
            throw new Error('Content must be pending_review to approve');
        draft.status = 'approved';
        return draft;
    }
    async publish(contentId) {
        const draft = this.drafts.get(contentId);
        if (!draft)
            throw new Error(`Content ${contentId} not found`);
        if (draft.status !== 'approved')
            throw new Error('Content must be approved before publishing');
        draft.status = 'published';
        return draft;
    }
    async reject(contentId, notes) {
        const draft = this.drafts.get(contentId);
        if (!draft)
            throw new Error(`Content ${contentId} not found`);
        draft.status = 'rejected';
        draft.reviewNotes = notes;
        return draft;
    }
    getDraft(contentId) {
        return this.drafts.get(contentId);
    }
    formatContent(request) {
        const header = `# ${request.title}\n\n> Type: ${request.contentType} | Audience: ${request.targetAudience} | Tone: ${request.tone}\n\n`;
        return `${header}${request.sourceMaterial}`;
    }
}
//# sourceMappingURL=content-creation-service.js.map
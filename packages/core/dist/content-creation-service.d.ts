import { z } from 'zod';
export declare const ContentCreationRequestSchema: z.ZodObject<{
    title: z.ZodString;
    contentType: z.ZodEnum<{
        blog_post: "blog_post";
        documentation: "documentation";
        code_comment: "code_comment";
        changelog: "changelog";
        release_notes: "release_notes";
        agent_report: "agent_report";
    }>;
    sourceMaterial: z.ZodString;
    targetAudience: z.ZodDefault<z.ZodEnum<{
        developers: "developers";
        end_users: "end_users";
        agents: "agents";
        stakeholders: "stakeholders";
    }>>;
    tone: z.ZodDefault<z.ZodEnum<{
        technical: "technical";
        conversational: "conversational";
        formal: "formal";
        concise: "concise";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type ContentCreationRequest = z.infer<typeof ContentCreationRequestSchema>;
export interface ContentCreationResult {
    id: string;
    status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected';
    content: string;
    createdAt: string;
    reviewNotes?: string;
}
export declare class ContentCreationService {
    private drafts;
    createDraft(request: ContentCreationRequest): Promise<ContentCreationResult>;
    submitForReview(contentId: string): Promise<ContentCreationResult>;
    approve(contentId: string): Promise<ContentCreationResult>;
    publish(contentId: string): Promise<ContentCreationResult>;
    reject(contentId: string, notes: string): Promise<ContentCreationResult>;
    getDraft(contentId: string): ContentCreationResult | undefined;
    private formatContent;
}
//# sourceMappingURL=content-creation-service.d.ts.map
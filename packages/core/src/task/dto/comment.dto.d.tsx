export declare class CreateCommentDto {
    : string;
    parentCommentId?: string;
    metadata?: Record<string, unknown>;
}
export declare class UpdateCommentDto {
    content: string;
    metadata?: Record<string, unknown>;
}

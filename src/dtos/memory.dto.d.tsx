export declare class MemoryContentDto {
  content: string;
  metadata?: Record<string, any>;
  tags?: string[];
}
export declare class MemoryQueryDto {
  query: string;
  limit?: number;
  threshold?: number;
  tags?: string[];
}
export declare class MemoryResponseDto {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  tags: string[];
  createdAt: Date;
  relevanceScore?: number;
}

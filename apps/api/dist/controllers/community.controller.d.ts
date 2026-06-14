type VoteType = 'up' | 'down';
type CommunityPost = {
    id: string;
    title: string;
    content: string;
    author: {
        id: string;
        name: string;
        avatar: string;
        reputation: number;
        badges: string[];
    };
    category: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    votes: {
        upvotes: number;
        downvotes: number;
        userVote?: VoteType | null;
    };
    comments: number;
    views: number;
    bookmarks: number;
    isBookmarked: boolean;
    isLiked: boolean;
    isPinned: boolean;
    isFeatured: boolean;
};
export declare class CommunityController {
    listPosts(category?: string, sort?: string, search?: string): CommunityPost[];
    getStats(): {
        totalMembers: number;
        activeToday: number;
        totalPosts: number;
        totalComments: number;
    };
    voteOnPost(postId: string, body: {
        type?: VoteType;
    }): CommunityPost;
    toggleBookmark(postId: string): {
        success: boolean;
        isBookmarked: boolean;
        bookmarks: number;
    };
    toggleLike(postId: string): {
        success: boolean;
        isLiked: boolean;
    };
}
export {};
//# sourceMappingURL=community.controller.d.ts.map
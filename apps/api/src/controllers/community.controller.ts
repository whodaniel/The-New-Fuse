import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

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

const SEED_POSTS: CommunityPost[] = [
  {
    id: 'post-welcome-1',
    title: 'Welcome to The New Fuse Community',
    content:
      'Share your builds, ask for support, and exchange ideas with other creators in the network.',
    author: {
      id: 'tnf-core',
      name: 'TNF Core',
      avatar: 'https://thenewfuse.com/favicon.ico',
      reputation: 9800,
      badges: ['admin', 'founder'],
    },
    category: 'announcements',
    tags: ['welcome', 'community'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    votes: { upvotes: 42, downvotes: 1, userVote: null },
    comments: 12,
    views: 640,
    bookmarks: 20,
    isBookmarked: false,
    isLiked: false,
    isPinned: true,
    isFeatured: true,
  },
  {
    id: 'post-showcase-1',
    title: 'Built a workflow that triages PR checks automatically',
    content:
      'Using TNF agents and webhook automations, I reduced CI triage time by 70%. Happy to share setup details.',
    author: {
      id: 'user-amber',
      name: 'Amber',
      avatar: 'https://placehold.co/48x48?text=A',
      reputation: 1340,
      badges: ['builder'],
    },
    category: 'showcase',
    tags: ['workflow', 'automation', 'ci'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    votes: { upvotes: 27, downvotes: 0, userVote: null },
    comments: 8,
    views: 221,
    bookmarks: 14,
    isBookmarked: false,
    isLiked: false,
    isPinned: false,
    isFeatured: true,
  },
  {
    id: 'post-help-1',
    title: 'How are you handling staged deploy rollbacks?',
    content:
      'Looking for practical rollback patterns across CloudRuntime services with zero-downtime frontend fallbacks.',
    author: {
      id: 'user-delta',
      name: 'Delta',
      avatar: 'https://placehold.co/48x48?text=D',
      reputation: 720,
      badges: ['member'],
    },
    category: 'help',
    tags: ['deploy', 'cloud_runtime', 'rollback'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    votes: { upvotes: 11, downvotes: 0, userVote: null },
    comments: 4,
    views: 93,
    bookmarks: 6,
    isBookmarked: false,
    isLiked: false,
    isPinned: false,
    isFeatured: false,
  },
];

// In-memory store keeps the community UI operational when external data services are unavailable.
const postsStore: CommunityPost[] = SEED_POSTS.map((post) => ({ ...post }));

@ApiTags('community')
@Controller('community')
export class CommunityController {
  @Get('posts')
  @ApiOperation({ summary: 'List community posts with filters' })
  @ApiResponse({ status: 200, description: 'List of community posts' })
  listPosts(
    @Query('category') category?: string,
    @Query('sort') sort: string = 'recent',
    @Query('search') search?: string
  ) {
    const normalizedCategory = (category || 'all').toLowerCase();
    const normalizedSearch = (search || '').trim().toLowerCase();

    let items = [...postsStore];

    if (normalizedCategory !== 'all') {
      items = items.filter((post) => post.category.toLowerCase() === normalizedCategory);
    }

    if (normalizedSearch) {
      items = items.filter((post) => {
        const haystack = `${post.title} ${post.content} ${post.tags.join(' ')}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    if (sort === 'popular') {
      items.sort((a, b) => b.comments - a.comments);
    } else if (sort === 'top') {
      items.sort((a, b) => b.votes.upvotes - b.votes.downvotes - (a.votes.upvotes - a.votes.downvotes));
    } else if (sort === 'views') {
      items.sort((a, b) => b.views - a.views);
    } else {
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }

    return items;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Community overview metrics' })
  @ApiResponse({ status: 200, description: 'Community stats payload' })
  getStats() {
    const totalComments = postsStore.reduce((sum, post) => sum + post.comments, 0);
    return {
      totalMembers: 1230,
      activeToday: 94,
      totalPosts: postsStore.length,
      totalComments,
    };
  }

  @Post('posts/:postId/vote')
  @ApiOperation({ summary: 'Vote on a post' })
  voteOnPost(@Param('postId') postId: string, @Body() body: { type?: VoteType }) {
    const post = postsStore.find((entry) => entry.id === postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (body?.type === 'up') {
      post.votes.upvotes += 1;
      post.votes.userVote = 'up';
    } else if (body?.type === 'down') {
      post.votes.downvotes += 1;
      post.votes.userVote = 'down';
    }
    post.updatedAt = new Date().toISOString();

    return post;
  }

  @Post('posts/:postId/bookmark')
  @ApiOperation({ summary: 'Toggle bookmark on a post' })
  toggleBookmark(@Param('postId') postId: string) {
    const post = postsStore.find((entry) => entry.id === postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.isBookmarked = !post.isBookmarked;
    post.bookmarks += post.isBookmarked ? 1 : -1;
    if (post.bookmarks < 0) {
      post.bookmarks = 0;
    }
    post.updatedAt = new Date().toISOString();

    return { success: true, isBookmarked: post.isBookmarked, bookmarks: post.bookmarks };
  }

  @Post('posts/:postId/like')
  @ApiOperation({ summary: 'Toggle like on a post' })
  toggleLike(@Param('postId') postId: string) {
    const post = postsStore.find((entry) => entry.id === postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.isLiked = !post.isLiked;
    post.updatedAt = new Date().toISOString();

    return { success: true, isLiked: post.isLiked };
  }
}

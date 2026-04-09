import { GlassCard } from '@/components/ui/premium';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleOvalLeftIcon,
  ClockIcon,
  EyeIcon,
  FireIcon,
  FunnelIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShareIcon,
  StarIcon,
  TagIcon,
  TrophyIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkSolidIcon,
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';

interface CommunityPost {
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
    userVote?: 'up' | 'down' | null;
  };
  comments: number;
  views: number;
  bookmarks: number;
  isBookmarked: boolean;
  isLiked: boolean;
  isPinned: boolean;
  isFeatured: boolean;
}

interface CommunityStats {
  totalMembers: number;
  activeToday: number;
  totalPosts: number;
  totalComments: number;
}

const CommunityHub: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Posts', icon: UserGroupIcon },
    { id: 'general', name: 'General Discussion', icon: ChatBubbleLeftRightIcon },
    { id: 'help', name: 'Help & Support', icon: UserIcon },
    { id: 'showcase', name: 'Showcase', icon: StarIcon },
    { id: 'feedback', name: 'Feedback', icon: ChatBubbleOvalLeftIcon },
    { id: 'announcements', name: 'Announcements', icon: TrophyIcon },
  ];

  const sortOptions = [
    { id: 'recent', name: 'Most Recent', icon: ClockIcon },
    { id: 'popular', name: 'Most Popular', icon: FireIcon },
    { id: 'top', name: 'Top Rated', icon: TrophyIcon },
    { id: 'views', name: 'Most Viewed', icon: EyeIcon },
  ];

  useEffect(() => {
    fetchCommunityData();
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchCommunityData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [postsResponse, statsResponse] = await Promise.all([
        fetch(
          `/api/community/posts?category=${selectedCategory}&sort=${sortBy}&search=${searchQuery}`
        ),
        fetch('/api/community/stats'),
      ]);

      const isJson = (response: Response) => {
        const contentType = response.headers.get('content-type');
        return contentType && contentType.includes('application/json');
      };

      if (postsResponse.ok && statsResponse.ok && isJson(postsResponse) && isJson(statsResponse)) {
        const postsData = await postsResponse.json();
        const statsData = await statsResponse.json();
        const normalizedPosts: CommunityPost[] = Array.isArray(postsData)
          ? postsData.map((post: any) => ({
              ...post,
              tags: Array.isArray(post?.tags) ? post.tags : [],
              votes: {
                upvotes: Number(post?.votes?.upvotes || 0),
                downvotes: Number(post?.votes?.downvotes || 0),
                userVote: post?.votes?.userVote ?? null,
              },
              author: {
                ...(post?.author || {}),
                badges: Array.isArray(post?.author?.badges) ? post.author.badges : [],
              },
            }))
          : [];
        setPosts(normalizedPosts);
        setStats(statsData ?? null);
      } else {
        setPosts([]);
        setStats(null);
        setLoadError('Community endpoints are unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch community data:', error);
      setPosts([]);
      setStats(null);
      setLoadError('Community endpoints are unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voteType }),
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map((post) => (post.id === postId ? updatedPost : post)));
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/bookmark`, {
        method: 'POST',
      });

      if (response.ok) {
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isBookmarked: !post.isBookmarked,
                  bookmarks: post.isBookmarked ? post.bookmarks - 1 : post.bookmarks + 1,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        setPosts(
          posts.map((post) => (post.id === postId ? { ...post, isLiked: !post.isLiked } : post))
        );
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-3 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Hub</h1>
              <p className="text-muted-foreground dark:text-gray-300 mt-2">
                Connect, share, and learn with the AI community
              </p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <PlusIcon className="w-5 h-5" />
              <span>New Post</span>
            </button>
          </div>
          {loadError && (
            <GlassCard className="rounded-lg p-4 mb-6 border border-amber-500/40 bg-amber-500/10">
              <p className="text-sm text-amber-200">
                {loadError}. No synthetic community posts are shown.
              </p>
            </GlassCard>
          )}

          {/* Community Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <GlassCard className="rounded-md p-4 text-center border-white/10 bg-transparent/5">
                <UserGroupIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalMembers.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-300">Members</div>
              </GlassCard>
              <GlassCard className="rounded-md p-4 text-center border-white/10 bg-transparent/5">
                <FireIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeToday.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-300">Active Today</div>
              </GlassCard>
              <GlassCard className="rounded-md p-4 text-center border-white/10 bg-transparent/5">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPosts.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-300">Posts</div>
              </GlassCard>
              <GlassCard className="rounded-md p-4 text-center border-white/10 bg-transparent/5">
                <ChatBubbleOvalLeftIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalComments.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-300">Comments</div>
              </GlassCard>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-muted/20 dark:hover:bg-gray-700 transition-colors"
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    title="Select category"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    title="Sort posts by"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <GlassCard className="rounded-lg p-6 border-white/10 bg-white/5 text-sm text-gray-300">
              No live community posts available.
            </GlassCard>
          )}
          {posts.map((post) => (
            <div
              key={post.id}
              className={`bg-slate-900/60 backdrop-blur-md rounded-md shadow-none border border-white/10 p-4 hover:shadow-md transition-shadow ${
                post.isPinned ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center space-y-1 min-w-0">
                  <button
                    onClick={() => handleVote(post.id, 'up')}
                    className={`p-1 rounded hover:bg-muted/30 dark:hover:bg-gray-700 transition-colors ${
                      post.votes.userVote === 'up' ? 'text-green-600' : 'text-gray-400'
                    }`}
                    title="Upvote"
                  >
                    <ArrowUpIcon className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {post.votes.upvotes - post.votes.downvotes}
                  </span>
                  <button
                    onClick={() => handleVote(post.id, 'down')}
                    className={`p-1 rounded hover:bg-muted/30 dark:hover:bg-gray-700 transition-colors ${
                      post.votes.userVote === 'down' ? 'text-red-600' : 'text-gray-400'
                    }`}
                    title="Downvote"
                  >
                    <ArrowDownIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {post.isPinned && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          Pinned
                        </span>
                      )}
                      {post.isFeatured && (
                        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                          <StarSolidIcon className="w-3 h-3 mr-1" />
                          Featured
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                        {categories.find((c) => c.id === post.category)?.name || post.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    {post.title}
                  </h3>

                  <p className="text-muted-foreground dark:text-gray-300 mb-3 line-clamp-2">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {(post.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(post.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-foreground dark:text-gray-300 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <TagIcon className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Author and Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-muted-foreground dark:text-gray-300" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {post.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                              {post.author.reputation} rep
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {(post.author?.badges || []).map((badge) => (
                              <span
                                key={badge}
                                className="text-xs text-blue-600 dark:text-blue-400"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-muted-foreground dark:text-muted-foreground">
                        <EyeIcon className="w-4 h-4" />
                        <span className="text-sm">{post.views}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground dark:text-muted-foreground">
                        <ChatBubbleOvalLeftIcon className="w-4 h-4" />
                        <span className="text-sm">{post.comments}</span>
                      </div>
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 transition-colors ${
                          post.isLiked
                            ? 'text-red-600'
                            : 'text-muted-foreground dark:text-muted-foreground hover:text-red-600'
                        }`}
                        title="Like post"
                      >
                        {post.isLiked ? (
                          <HeartSolidIcon className="w-4 h-4" />
                        ) : (
                          <HeartIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={`flex items-center space-x-1 transition-colors ${
                          post.isBookmarked
                            ? 'text-yellow-600'
                            : 'text-muted-foreground dark:text-muted-foreground hover:text-yellow-600'
                        }`}
                        title="Bookmark post"
                      >
                        {post.isBookmarked ? (
                          <BookmarkSolidIcon className="w-4 h-4" />
                        ) : (
                          <BookmarkIcon className="w-4 h-4" />
                        )}
                        <span className="text-sm">{post.bookmarks}</span>
                      </button>
                      <button
                        className="text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-300 transition-colors"
                        title="Share post"
                      >
                        <ShareIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-foreground dark:text-gray-300 rounded-md hover:bg-muted/20 dark:hover:bg-gray-700 transition-colors">
            Load More Posts
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;

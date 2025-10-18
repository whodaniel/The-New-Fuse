import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  FireIcon,
  TrophyIcon,
  BookmarkIcon,
  UserIcon,
  TagIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleOvalLeftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

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
    { id: 'announcements', name: 'Announcements', icon: TrophyIcon }
  ];

  const sortOptions = [
    { id: 'recent', name: 'Most Recent', icon: ClockIcon },
    { id: 'popular', name: 'Most Popular', icon: FireIcon },
    { id: 'top', name: 'Top Rated', icon: TrophyIcon },
    { id: 'views', name: 'Most Viewed', icon: EyeIcon }
  ];

  useEffect(() => {
    fetchCommunityData();
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const [postsResponse, statsResponse] = await Promise.all([
        fetch(`/api/community/posts?category=${selectedCategory}&sort=${sortBy}&search=${searchQuery}`),
        fetch('/api/community/stats')
      ]);

      if (postsResponse.ok && statsResponse.ok) {
        const postsData = await postsResponse.json();
        const statsData = await statsResponse.json();
        setPosts(postsData);
        setStats(statsData);
      } else {
        // Mock data for development
        setPosts(mockPosts);
        setStats(mockStats);
      }
    } catch (error) {
      console.error('Failed to fetch community data:', error);
      setPosts(mockPosts);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voteType })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(post => post.id === postId ? updatedPost : post));
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/bookmark`, {
        method: 'POST'
      });

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, isBookmarked: !post.isBookmarked, bookmarks: post.isBookmarked ? post.bookmarks - 1 : post.bookmarks + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: !post.isLiked }
            : post
        ));
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

  const mockStats: CommunityStats = {
    totalMembers: 12543,
    activeToday: 1247,
    totalPosts: 8932,
    totalComments: 23456
  };

  const mockPosts: CommunityPost[] = [
    {
      id: '1',
      title: 'Best practices for AI agent deployment in production',
      content: 'I\'ve been working on deploying AI agents to production and wanted to share some insights and get feedback from the community...',
      author: {
        id: 'user1',
        name: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        reputation: 2847,
        badges: ['Expert', 'Contributor']
      },
      category: 'general',
      tags: ['deployment', 'production', 'best-practices'],
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      votes: { upvotes: 42, downvotes: 3, userVote: null },
      comments: 18,
      views: 234,
      bookmarks: 15,
      isBookmarked: false,
      isLiked: false,
      isPinned: true,
      isFeatured: true
    },
    {
      id: '2',
      title: 'Help: Agent not responding to custom prompts',
      content: 'I\'m having trouble getting my agent to respond properly to custom prompts. Has anyone encountered this issue?',
      author: {
        id: 'user2',
        name: 'Mike Johnson',
        avatar: '/avatars/mike.jpg',
        reputation: 156,
        badges: ['Newcomer']
      },
      category: 'help',
      tags: ['troubleshooting', 'prompts', 'help'],
      createdAt: '2024-01-15T08:15:00Z',
      updatedAt: '2024-01-15T08:15:00Z',
      votes: { upvotes: 8, downvotes: 0, userVote: null },
      comments: 12,
      views: 89,
      bookmarks: 3,
      isBookmarked: false,
      isLiked: false,
      isPinned: false,
      isFeatured: false
    },
    {
      id: '3',
      title: 'Showcase: My AI-powered customer service bot',
      content: 'Just finished building an AI customer service bot that handles 90% of inquiries automatically. Here\'s how I did it...',
      author: {
        id: 'user3',
        name: 'Alex Rodriguez',
        avatar: '/avatars/alex.jpg',
        reputation: 1923,
        badges: ['Innovator', 'Helper']
      },
      category: 'showcase',
      tags: ['showcase', 'customer-service', 'automation'],
      createdAt: '2024-01-14T16:45:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      votes: { upvotes: 67, downvotes: 2, userVote: 'up' },
      comments: 24,
      views: 456,
      bookmarks: 28,
      isBookmarked: true,
      isLiked: true,
      isPinned: false,
      isFeatured: true
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Community Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Connect, share, and learn with the AI community
              </p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="w-5 h-5" />
              <span>New Post</span>
            </button>
          </div>

          {/* Community Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <UserGroupIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalMembers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Members</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <FireIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeToday.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Active Today</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPosts.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Posts</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <ChatBubbleOvalLeftIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalComments.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Comments</div>
              </div>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
          {posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow ${
                post.isPinned ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center space-y-1 min-w-0">
                  <button
                    onClick={() => handleVote(post.id, 'up')}
                    className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
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
                    className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
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
                        {categories.find(c => c.id === post.category)?.name || post.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
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
                          <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {post.author.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {post.author.reputation} rep
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {post.author.badges.map((badge) => (
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
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <EyeIcon className="w-4 h-4" />
                        <span className="text-sm">{post.views}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <ChatBubbleOvalLeftIcon className="w-4 h-4" />
                        <span className="text-sm">{post.comments}</span>
                      </div>
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 transition-colors ${
                          post.isLiked ? 'text-red-600' : 'text-gray-500 dark:text-gray-400 hover:text-red-600'
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
                          post.isBookmarked ? 'text-yellow-600' : 'text-gray-500 dark:text-gray-400 hover:text-yellow-600'
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
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
          <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Load More Posts
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
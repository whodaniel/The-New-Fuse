import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { ArrowRight, Calendar, Newspaper, Rocket, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogPostCard = ({
  title,
  date,
  author,
  excerpt,
}: {
  title: string;
  date: string;
  author: string;
  excerpt: string;
}) => (
  <GlassCard className="p-4">
    <div className="flex items-center text-sm text-muted-foreground mb-2">
      <Calendar className="h-4 w-4 mr-2" />
      <span>{date}</span>
      <User className="h-4 w-4 ml-4 mr-2" />
      <span>{author}</span>
    </div>
    <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-400 text-sm mb-4">{excerpt}</p>
    <PremiumButton variant="outline" size="sm">
      Read More
    </PremiumButton>
  </GlassCard>
);

export const Blog = () => {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <main className="grow">
        <section className="py-20 lg:py-22 bg-linear-to-br from-indigo-600 via-purple-700 to-blue-800 text-white text-center">
          <div className="container mx-auto px-4">
            <Badge className="mb-6 bg-transparent/10 text-white border-white/20">
              <Newspaper className="w-4 h-4 mr-2" />
              Latest Insights
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">The New Fuse Blog</h1>
            <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto">
              News, updates, and insights about AI collaboration and workflow automation.
            </p>
            <Link to="/auth/register">
              <PremiumButton
                size="lg"
                className="bg-transparent text-blue-600 hover:bg-blue-50 px-8 py-2 text-lg font-semibold"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </PremiumButton>
            </Link>
          </div>
        </section>

        <section className="py-20 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Latest Posts</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Explore our latest articles and insights
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <BlogPostCard
                title="The Future of AI Collaboration"
                date="December 8, 2025"
                author="Daniel Goldberg"
                excerpt="Exploring how AI agents will transform team collaboration in the coming years."
              />
              <BlogPostCard
                title="Building Scalable Workflow Automation"
                date="November 28, 2025"
                author="Sarah Chen"
                excerpt="Best practices for creating workflows that scale with your business needs."
              />
              <BlogPostCard
                title="MCP Protocol Deep Dive"
                date="November 15, 2025"
                author="Michael Rodriguez"
                excerpt="Understanding the Model Context Protocol and its impact on AI communication."
              />
            </div>
          </div>
        </section>

        <section className="py-20 bg-transparent text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Stay Updated</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Subscribe to our newsletter for the latest AI collaboration news.
            </p>
            <Link to="/auth/register">
              <PremiumButton
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-lg font-semibold"
              >
                Get Started
              </PremiumButton>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Blog;

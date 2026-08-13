import { Badge } from '@/components/ui';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const BLOG_POSTS = [
  {
    slug: 'tnf-launch',
    title: 'The New Fuse Autonomous Agent Platform is Now Live',
    date: '2026-06-01',
    excerpt: 'After months of development, The New Fuse platform is officially launched. Deploy autonomous agents, orchestrate multi-model workflows, and scale infinitely — no code required.',
    category: 'Launch',
    readTime: '5 min',
  },
  {
    slug: 'relay-infrastructure',
    title: 'How TNF Relay Communication Works Across the Fleet',
    date: '2026-06-15',
    excerpt: 'A deep dive into the relay infrastructure that enables seamless communication between agents, supporting millions of messages per day with sub-100ms latency.',
    category: 'Architecture',
    readTime: '8 min',
  },
  {
    slug: 'multi-agent-orchestration',
    title: 'Introduction to Multi-Agent Orchestration',
    date: '2026-06-20',
    excerpt: 'Learn how to coordinate multiple AI agents to work together on complex tasks, from simple parallel execution to sophisticated hierarchical task decomposition.',
    category: 'Tutorial',
    readTime: '12 min',
  },
  {
    slug: 'federated-identity',
    title: 'Federated Identity Across Agent Fleets',
    date: '2026-06-25',
    excerpt: 'How TNF implements federated identity management, enabling agents to authenticate and authorize across different platforms and cloud providers.',
    category: 'Security',
    readTime: '6 min',
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
            The New Fuse Blog
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Insights &</span>
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Updates
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Deep dives into autonomous agent orchestration, fleet management,
            and the future of AI-driven workflows.
          </p>
        </div>

        <div className="space-y-8">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:border-purple-500/30 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      {post.category}
                    </Badge>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime} read</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <a
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-purple-400 font-semibold hover:text-purple-300 transition-colors"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-20 p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-gray-400 mb-6">
            Subscribe to get notified about new articles and platform updates.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors"
            >
              Go to Dashboard
            </a>
            <a
              href="/docs"
              className="px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              Read the Docs
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
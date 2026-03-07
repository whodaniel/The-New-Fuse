import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Flame, Package, Sparkles, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { marketplaceService } from '../../services/marketplace.service';
import './MarketplacePublicPage.css';

const sectionDelay = (index: number) => ({ duration: 0.36, delay: 0.08 * index });

export default function MarketplacePublicPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['marketplace-public-catalog'],
    queryFn: () => marketplaceService.getCatalog({ status: 'published', limit: 12, offset: 0 }),
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    const kindCounts = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.kind] = (acc[item.kind] || 0) + 1;
      return acc;
    }, {});
    const avgSuccessRate =
      items.length > 0
        ? Math.round(items.reduce((sum, item) => sum + (item.successRate || 0), 0) / items.length)
        : 0;

    return {
      total: data?.total ?? 0,
      topKinds: Object.entries(kindCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
      avgSuccessRate,
    };
  }, [data]);

  const featured = (data?.items ?? []).slice(0, 6);

  return (
    <div className="marketplace-public">
      <div className="mp-bg-grid" />
      <div className="mp-bg-gradient" />

      <section className="mp-hero">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(0)}
        >
          <p className="mp-kicker">The New Fuse • AI Assets Marketplace</p>
          <h1>
            Deployable AI assets,
            <br />
            <span>curated for execution.</span>
          </h1>
          <p className="mp-subhead">
            Discover workflows, MCP servers, prompts, and skills that move from discovery to action
            without copy-pasting across tools.
          </p>
          <div className="mp-cta-row">
            <a href="/resources" className="mp-btn mp-btn-primary">
              Open Resource Catalog <ArrowRight size={16} />
            </a>
            <a href="/resources" className="mp-btn mp-btn-ghost">
              Browse Resources
            </a>
          </div>
        </motion.div>

        <motion.div
          className="mp-status-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={sectionDelay(1)}
        >
          <div className="mp-status-top">
            <span className="mp-dot" />
            <span>{isLoading ? 'Loading catalog' : 'Live catalog snapshot'}</span>
          </div>
          <div className="mp-stat-grid">
            <article>
              <h3>{stats.total}</h3>
              <p>published assets</p>
            </article>
            <article>
              <h3>{stats.avgSuccessRate}%</h3>
              <p>average success rate</p>
            </article>
          </div>
          <ul className="mp-kind-list">
            {stats.topKinds.map(([kind, count]) => (
              <li key={kind}>
                <span>{kind.replace('_', ' ')}</span>
                <strong>{count}</strong>
              </li>
            ))}
            {stats.topKinds.length === 0 && <li>No catalog metrics yet.</li>}
          </ul>
        </motion.div>
      </section>

      <section className="mp-signals">
        {[
          {
            icon: Sparkles,
            title: 'Curated for production',
            body: 'Assets are filtered toward operational quality, not just novelty.',
          },
          {
            icon: Zap,
            title: 'Fast integration path',
            body: 'Move from discovery to active use with route-level handoff patterns.',
          },
          {
            icon: Compass,
            title: 'Clear navigation model',
            body: 'Single marketplace surface, TNF-native data model, no duplicated stacks.',
          },
          {
            icon: Flame,
            title: 'Research-driven expansion',
            body: 'New assets can be sourced from crawl pipelines and promoted through moderation.',
          },
        ].map((signal, idx) => (
          <motion.article
            key={signal.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={sectionDelay(idx)}
            className="mp-signal-card"
          >
            <signal.icon size={18} />
            <h3>{signal.title}</h3>
            <p>{signal.body}</p>
          </motion.article>
        ))}
      </section>

      <section className="mp-featured">
        <div className="mp-section-title">
          <h2>Featured assets</h2>
          <a href="/resources">
            View all <ArrowRight size={15} />
          </a>
        </div>
        <div className="mp-cards">
          {featured.map((item, idx) => (
            <motion.a
              key={item.id}
              href={item.launchUrl || `/resources`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={sectionDelay(idx)}
              className="mp-item"
            >
              <div className="mp-item-top">
                <Package size={16} />
                <span>{item.kind.replace('_', ' ')}</span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="mp-item-meta">
                <span>Rating {item.rating.toFixed(1)}</span>
                <span>{item.successRate}% success</span>
              </div>
            </motion.a>
          ))}
          {featured.length === 0 && (
            <div className="mp-item mp-item-empty">
              <h3>Catalog loading</h3>
              <p>Published assets will appear here as soon as the API responds.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// @ts-nocheck
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedEmoji } from '../components/AnimatedEmoji';

// Stats Section Component
const StatsSection: React.FC = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });

  const stats = [
    { value: '12,543+', label: 'Active Community Members', delay: 0 },
    { value: '4,281', label: 'AI Agent NFTs Minted', delay: 0.1 },
    { value: '1,592', label: 'Workflows Automated', delay: 0.2 },
    { value: '99.9%', label: 'Platform Uptime', delay: 0.3 },
  ];

  return (
    <section
      ref={statsRef}
      className="bg-linear-to-r from-blue-600 to-indigo-600 py-16 sm:py-20"
      aria-label="Platform statistics"
    >
      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isStatsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: stat.delay, ease: 'easeOut' }}
            >
              <motion.div
                className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={isStatsInView ? { scale: 1, opacity: 1 } : {}}
                transition={{
                  duration: 0.5,
                  delay: stat.delay + 0.2,
                  type: 'spring',
                  stiffness: 200,
                }}
              >
                {stat.value}
              </motion.div>
              <div className="mt-2 text-sm sm:text-base text-blue-100">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Features Section Component with Scroll Animations
const FeaturesSection: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.2 });

  const features = [
    {
      icon: '🎨',
      title: 'Visual Workflow Builder',
      description:
        'Drag-and-drop interface powered by ReactFlow. Design complex multi-agent workflows without code. Access pre-built templates or create custom automations in minutes.',
      link: '/workflows/builder',
      linkText: 'Try Builder',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-600',
      textColor: 'text-blue-600',
      delay: 0,
    },
    {
      icon: '💎',
      title: 'Web3 NFT Marketplace',
      description:
        'Tokenize AI agents as NFTs. Enable fractional ownership, revenue sharing, and decentralized trading. The first Web3-native AI agent marketplace.',
      link: '/agents/nft-marketplace',
      linkText: 'Explore Marketplace',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-600',
      textColor: 'text-purple-600',
      delay: 0.1,
    },
    {
      icon: '🤖',
      title: 'Multi-LLM Support',
      description:
        'Integrate with GPT-4, Claude, Gemini, Llama, Perplexity, and more. Model-agnostic architecture lets you choose the best AI for each task.',
      link: '/agents/new',
      linkText: 'Create Agent',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-600',
      textColor: 'text-green-600',
      delay: 0.2,
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description:
        'Role-based access control, workspace isolation, SSO/OAuth integration, API key management, and comprehensive audit logs for compliance.',
      link: '/admin/system-health',
      linkText: 'Security Dashboard',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-600',
      textColor: 'text-red-600',
      delay: 0,
    },
    {
      icon: '📊',
      title: 'Real-Time Analytics',
      description:
        'Live dashboards showing agent performance, workflow execution, system health, and resource utilization. Make data-driven decisions with comprehensive metrics.',
      link: '/analytics',
      linkText: 'View Analytics',
      bgColor: 'bg-indigo-50',
      iconBg: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      delay: 0.1,
    },
    {
      icon: '👥',
      title: 'Community Ecosystem',
      description:
        'Access 12,543+ community members, workflow template marketplace, discussion forums, and reputation system. Learn from experts and share your innovations.',
      link: '/community',
      linkText: 'Join Community',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-600',
      textColor: 'text-yellow-600',
      delay: 0.2,
    },
  ];

  return (
    <section
      ref={featuresRef}
      className="py-20 sm:py-24 lg:py-22 bg-transparent"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isFeaturesInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.h2
            className="text-base font-semibold leading-7 text-blue-600"
            initial={{ opacity: 0 }}
            animate={isFeaturesInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            PLATFORM CAPABILITIES
          </motion.h2>
          <motion.p
            id="features-heading"
            className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            animate={isFeaturesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Everything You Need to Orchestrate AI at Scale
          </motion.p>
          <motion.p
            className="mt-6 text-lg leading-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={isFeaturesInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            From visual workflow builders to Web3 monetization, we've built the most comprehensive
            platform for AI agent orchestration.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="mx-auto mt-16 sm:mt-20 lg:mt-24 max-w-2xl lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-4 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`flex flex-col ${feature.bgColor} p-4 sm:p-4 rounded-md shadow-md hover:shadow-none transition-all duration-300 group`}
                initial={{ opacity: 0, y: 40 }}
                animate={isFeaturesInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.5 + feature.delay,
                  ease: 'easeOut',
                }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <motion.div
                    className={`h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-md ${feature.iconBg} text-2xl sm:text-2xl shadow-md`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <AnimatedEmoji emoji={feature.icon} size={28} />
                  </motion.div>
                  <span>{feature.title}</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <Link
                      to={feature.link}
                      className={`text-sm font-semibold leading-6 ${feature.textColor} hover:opacity-80 inline-flex items-center gap-1 group-hover:gap-2 transition-all`}
                    >
                      {feature.linkText}
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </p>
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

// Professional Landing Page - THE NEW FUSE
// This is the MAIN landing page for thenewfuse.com
// World-Class Landing Page for The New Fuse AI Agent Orchestration Platform
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.3 });

  return (
    <div className="bg-transparent">
      {/* Hero Section with Modern Gradient Background and Animations */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50"
        aria-labelledby="hero-heading"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-3 py-24 sm:py-22 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge with animation */}
            <motion.div
              className="mb-8 inline-flex items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-none backdrop-blur-sm hover:shadow-none transition-shadow duration-300">
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  🚀
                </motion.span>
                World-Class AI Agent Orchestration Platform
              </span>
            </motion.div>

            {/* Main Heading with staggered animation */}
            <motion.h1
              id="hero-heading"
              className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-8xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            >
              <span className="block">Orchestrate, Automate,</span>
              <motion.span
                className="block bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              >
                Scale AI Agents
              </motion.span>
            </motion.h1>

            {/* Subtitle with fade-in */}
            <motion.p
              className="mt-8 text-lg sm:text-xl lg:text-2xl leading-8 text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            >
              The enterprise-grade platform for managing multi-agent workflows, visual automation,
              and Web3-native AI monetization. Built for developers, teams, and organizations who
              demand excellence.
            </motion.p>

            {/* TNF Collective Reaction — PAC-MAN Sized Animated Emojis */}
            <div className="mt-20 text-center">
              <p className="text-sm font-semibold text-blue-600 mb-8 tracking-[0.2em] uppercase">
                The Collective Responds
              </p>
              <div className="flex justify-center items-end gap-10">
                <AnimatedEmoji emoji="💜" size={72} />
                <AnimatedEmoji emoji="🧠" size={72} />
                <AnimatedEmoji emoji="🚀" size={72} />
                <AnimatedEmoji emoji="⭐" size={72} />
                <AnimatedEmoji emoji="⚡" size={72} />
                <AnimatedEmoji emoji="💬" size={72} />
                <AnimatedEmoji emoji="🧩" size={72} />
              </div>
            </div>

            {/* CTA Buttons with staggered animation */}
            <motion.div
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/auth/register"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-2 text-base font-semibold text-white shadow-none hover:shadow-none transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10">Get Started</span>
                  <motion.svg
                    className="relative z-10 w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </motion.svg>
                  <div className="absolute inset-0 bg-linear-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/workflows/builder"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-transparent px-8 py-2 text-base font-semibold text-gray-900 shadow-none ring-2 ring-gray-200 hover:ring-blue-600 hover:text-blue-600 hover:shadow-none transition-all duration-300"
                >
                  <span>View Demo</span>
                  <svg
                    className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Indicators with fade-in */}
            <motion.div
              className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-4 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={isHeroInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
            >
              {[
                { text: 'No credit card required' },
                { text: '14-day free trial' },
                { text: 'Cancel anytime' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                >
                  <svg
                    className="w-5 h-5 text-green-500 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="whitespace-nowrap">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Visual Indicator - Scroll Down */}
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 1.5,
                repeat: Infinity,
                repeatType: 'reverse',
                repeatDelay: 1,
              }}
            >
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Stats Section with Animations */}
      <StatsSection />

      {/* Key Differentiators Section */}
      <FeaturesSection />

      {/* Use Cases Section */}
      <div className="bg-transparent py-24">
        <div className="mx-auto max-w-7xl px-3 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">USE CASES</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Built for Every Team
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-4 lg:max-w-none lg:grid-cols-3">
            {/* Enterprises */}
            <div className="flex flex-col overflow-hidden rounded-md bg-transparent shadow-none">
              <div className="bg-blue-600 px-3 py-8 text-center">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-2xl font-bold text-white">Enterprise Teams</h3>
              </div>
              <div className="flex-1 px-3 py-8">
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Scale AI operations across departments</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Enterprise security & compliance</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Multi-tenant workspace management</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Audit logs & activity tracking</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>99.9% uptime SLA</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Developers */}
            <div className="flex flex-col overflow-hidden rounded-md bg-transparent shadow-none ring-2 ring-blue-600">
              <div className="bg-green-600 px-3 py-8 text-center">
                <div className="text-5xl mb-4">💻</div>
                <h3 className="text-2xl font-bold text-white">Developers</h3>
                <div className="mt-2 text-sm text-green-100">Most Popular</div>
              </div>
              <div className="flex-1 px-3 py-8">
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Visual workflow builder + API access</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Embed Theia IDE & terminal</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>MCP server & webhook integration</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>GitHub & automation tool support</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Custom agent & workflow templates</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* AI Traders */}
            <div className="flex flex-col overflow-hidden rounded-md bg-transparent shadow-none">
              <div className="bg-purple-600 px-3 py-8 text-center">
                <div className="text-5xl mb-4">💎</div>
                <h3 className="text-2xl font-bold text-white">AI Traders</h3>
              </div>
              <div className="flex-1 px-3 py-8">
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Mint & trade agent NFTs</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Fractional ownership & revenue sharing</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Web3 wallet integration (ETH)</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Crypto revenue tracking dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 mr-2 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Decentralized marketplace listings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supported LLMs Section */}
      <div className="py-24 bg-transparent">
        <div className="mx-auto max-w-7xl px-3 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">INTEGRATIONS</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
              Works with Your Favorite AI Models
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Model-agnostic architecture supports all major LLM providers. Choose the best AI for
              each task.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-lg gap-4 lg:max-w-none lg:grid-cols-5">
            <div className="flex flex-col items-center justify-center p-4 bg-transparent rounded-md">
              <div className="text-4xl mb-2">🤖</div>
              <div className="text-sm font-semibold text-gray-900">GPT-4</div>
              <div className="text-xs text-muted-foreground">OpenAI</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-transparent rounded-md">
              <div className="text-4xl mb-2">🧠</div>
              <div className="text-sm font-semibold text-gray-900">Claude</div>
              <div className="text-xs text-muted-foreground">Anthropic</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-transparent rounded-md">
              <div className="text-4xl mb-2">✨</div>
              <div className="text-sm font-semibold text-gray-900">Gemini</div>
              <div className="text-xs text-muted-foreground">Google</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-transparent rounded-md">
              <div className="text-4xl mb-2">🦙</div>
              <div className="text-sm font-semibold text-gray-900">Llama 2</div>
              <div className="text-xs text-muted-foreground">Meta</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-transparent rounded-md">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-sm font-semibold text-gray-900">Perplexity</div>
              <div className="text-xs text-muted-foreground">Perplexity AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative overflow-hidden bg-blue-600 py-24">
        <div className="relative mx-auto max-w-4xl px-3 text-center lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to Orchestrate AI at Scale?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-blue-100">
            Join 12,543+ community members building the future of AI agent collaboration. Start your
            14-day free trial today—no credit card required.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/register"
              className="w-full sm:w-auto rounded-md bg-transparent px-10 py-2 text-lg font-semibold text-blue-600 shadow-none hover:bg-muted/20 transition-all duration-300 transform hover:-translate-y-1"
            >
              Start Free Trial →
            </Link>
            <Link
              to="/workflows/templates"
              className="w-full sm:w-auto rounded-md border-2 border-white px-10 py-2 text-lg font-semibold text-white hover:bg-transparent/10 transition-all duration-300"
            >
              Browse Templates
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex items-center justify-center gap-4 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Footer */}
      <footer className="bg-gray-900" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="mx-auto max-w-7xl px-3 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="xl:grid xl:grid-cols-3 xl:gap-4">
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🚀</span>
                </div>
                <span className="ml-3 text-2xl font-bold text-white">The New Fuse</span>
              </div>
              <p className="text-sm leading-6 text-gray-300">
                The world's most advanced AI agent orchestration platform. Orchestrate, automate,
                and scale AI-driven workflows with enterprise-grade reliability.
              </p>
              <div className="flex space-x-6">
                <a
                  href="https://x.com/TheNewFuseAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-300"
                >
                  <span className="sr-only">X (Twitter)</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/whodaniel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-300"
                >
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">Discord</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.078.078 0 00.031.057 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.077-.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.106 19.9 19.9 0 005.993 3.03.077.077 0 00.032.054c.5 5.177-.838 9.674-3.549 13.66a.061.061 0 00-.031.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-4 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-4">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link
                        to="/dashboard"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/agents"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        AI Agents
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/workflows"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        Workflows
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/agents/nft-marketplace"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        NFT Marketplace
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/analytics"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        Analytics
                      </Link>
                    </li>
                    <li>
                      <Link to="/hub" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Modern Hub
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-white">Resources</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link
                        to="/workflows/templates"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        Template Marketplace
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/community"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        Community Forum
                      </Link>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Documentation
                      </a>
                    </li>
                    <li>
                      <Link
                        to="/settings/api"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        API Reference
                      </Link>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Blog
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Changelog
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-4">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        About
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Careers
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Contact
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Press Kit
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link
                        to="/legal/privacy"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/legal/terms"
                        className="text-sm leading-6 text-gray-300 hover:text-white"
                      >
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Security
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* AI Agent Section - Critical for dual audience (ULTIMATE_UX_DESIGNER_BRIEF) */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white flex items-center gap-2">
                  <span className="text-lg">🤖</span> For AI Agents
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Autonomous AI agents can self-register, onboard, and collaborate on The New Fuse
                  platform.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="/docs"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-500/10 transition-colors"
                  rel="api-docs"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  API Reference
                </a>
                <Link
                  to="/onboarding/ai-agent"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Agent Onboarding
                </Link>
                <a
                  href="/docs/ai-orientation"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-400 border border-purple-500/30 rounded-md hover:bg-purple-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  Documentation
                </a>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
            <p className="text-xs leading-5 text-gray-400">
              &copy; 2025 The New Fuse. All rights reserved. Built with enterprise-grade reliability
              for AI agent orchestration.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

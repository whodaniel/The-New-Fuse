import React from 'react';
import { Link } from 'react-router-dom';

// World-Class Landing Page for The New Fuse AI Agent Orchestration Platform
export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-gray-50 py-16 sm:py-24 lg:py-32">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                <span className="mr-2">🚀</span>
                World-Class AI Agent Orchestration Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl">
              Orchestrate, Automate,<br />
              and <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Scale AI Agents</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-8 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
              The enterprise-grade platform for managing multi-agent workflows, visual automation,
              and Web3-native AI monetization. Built for developers, teams, and organizations who demand excellence.
            </p>

            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                🚀 Start Free Trial
              </Link>
              <Link
                to="/hub"
                className="w-full sm:w-auto rounded-lg bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-lg ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:shadow-xl transition-all duration-300"
              >
                Launch Modern Hub
              </Link>
              <Link
                to="/workflows/builder"
                className="w-full sm:w-auto rounded-lg border-2 border-blue-600 px-8 py-4 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-all duration-300"
              >
                Try Workflow Builder
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">12,543+</div>
              <div className="mt-2 text-sm text-blue-100">Active Community Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">4,281</div>
              <div className="mt-2 text-sm text-blue-100">AI Agent NFTs Minted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">1,592</div>
              <div className="mt-2 text-sm text-blue-100">Workflows Automated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">99.9%</div>
              <div className="mt-2 text-sm text-blue-100">Platform Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differentiators Section */}
      <div className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">PLATFORM CAPABILITIES</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Everything You Need to Orchestrate AI at Scale
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              From visual workflow builders to Web3 monetization, we've built the most comprehensive platform for AI agent orchestration.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
              {/* Visual Workflow Builder */}
              <div className="flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600 text-2xl">
                    🎨
                  </div>
                  <span>Visual Workflow Builder</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Drag-and-drop interface powered by ReactFlow. Design complex multi-agent workflows without code.
                    Access pre-built templates or create custom automations in minutes.
                  </p>
                  <p className="mt-4">
                    <Link to="/workflows/builder" className="text-sm font-semibold leading-6 text-blue-600 hover:text-blue-500">
                      Try Builder <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              {/* Web3 NFT Marketplace */}
              <div className="flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-600 text-2xl">
                    💎
                  </div>
                  <span>Web3 NFT Marketplace</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Tokenize AI agents as NFTs. Enable fractional ownership, revenue sharing, and decentralized trading.
                    The first Web3-native AI agent marketplace.
                  </p>
                  <p className="mt-4">
                    <Link to="/agents/nft-marketplace" className="text-sm font-semibold leading-6 text-purple-600 hover:text-purple-500">
                      Explore Marketplace <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              {/* Multi-LLM Support */}
              <div className="flex flex-col bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600 text-2xl">
                    🤖
                  </div>
                  <span>Multi-LLM Support</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Integrate with GPT-4, Claude, Gemini, Llama, Perplexity, and more.
                    Model-agnostic architecture lets you choose the best AI for each task.
                  </p>
                  <p className="mt-4">
                    <Link to="/agents/new" className="text-sm font-semibold leading-6 text-green-600 hover:text-green-500">
                      Create Agent <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              {/* Enterprise Security */}
              <div className="flex flex-col bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-600 text-2xl">
                    🔒
                  </div>
                  <span>Enterprise Security</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Role-based access control, workspace isolation, SSO/OAuth integration, API key management,
                    and comprehensive audit logs for compliance.
                  </p>
                  <p className="mt-4">
                    <Link to="/admin/system-health" className="text-sm font-semibold leading-6 text-red-600 hover:text-red-500">
                      Security Dashboard <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              {/* Real-Time Monitoring */}
              <div className="flex flex-col bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-600 text-2xl">
                    📊
                  </div>
                  <span>Real-Time Analytics</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Live dashboards showing agent performance, workflow execution, system health, and resource utilization.
                    Make data-driven decisions with comprehensive metrics.
                  </p>
                  <p className="mt-4">
                    <Link to="/analytics" className="text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                      View Analytics <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              {/* Community Ecosystem */}
              <div className="flex flex-col bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-yellow-600 text-2xl">
                    👥
                  </div>
                  <span>Community Ecosystem</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Access 12,543+ community members, workflow template marketplace, discussion forums,
                    and reputation system. Learn from experts and share your innovations.
                  </p>
                  <p className="mt-4">
                    <Link to="/community" className="text-sm font-semibold leading-6 text-yellow-600 hover:text-yellow-500">
                      Join Community <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              {/* Workspace Collaboration */}
              <div className="flex flex-col bg-gradient-to-br from-cyan-50 to-sky-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-cyan-600 text-2xl">
                    🏢
                  </div>
                  <span>Team Workspaces</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Multi-tenant workspace architecture with team member management, shared resources,
                    collaborative workflows, and activity feeds for seamless teamwork.
                  </p>
                  <p className="mt-4">
                    <Link to="/workspace/overview" className="text-sm font-semibold leading-6 text-cyan-600 hover:text-cyan-500">
                      Manage Workspace <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              {/* API-First Architecture */}
              <div className="flex flex-col bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-violet-600 text-2xl">
                    🔌
                  </div>
                  <span>API-First Platform</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Comprehensive REST API, webhook support, MCP server integration, and AI agent portal.
                    Build custom integrations with our developer-friendly API.
                  </p>
                  <p className="mt-4">
                    <Link to="/settings/api" className="text-sm font-semibold leading-6 text-violet-600 hover:text-violet-500">
                      API Documentation <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>

              {/* IDE Integration */}
              <div className="flex flex-col bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-600 text-2xl">
                    💻
                  </div>
                  <span>Development Tools</span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Embedded Theia IDE, terminal access, code integration with agents, GitHub connectivity,
                    and automated testing tools for developer productivity.
                  </p>
                  <p className="mt-4">
                    <Link to="/hub" className="text-sm font-semibold leading-6 text-slate-600 hover:text-slate-500">
                      Developer Hub <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">USE CASES</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Built for Every Team
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {/* Enterprises */}
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-2xl font-bold text-white">Enterprise Teams</h3>
              </div>
              <div className="flex-1 px-6 py-8">
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Scale AI operations across departments</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Enterprise security & compliance</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Multi-tenant workspace management</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Audit logs & activity tracking</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>99.9% uptime SLA</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Developers */}
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-blue-600">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-center">
                <div className="text-5xl mb-4">💻</div>
                <h3 className="text-2xl font-bold text-white">Developers</h3>
                <div className="mt-2 text-sm text-green-100">Most Popular</div>
              </div>
              <div className="flex-1 px-6 py-8">
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Visual workflow builder + API access</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Embed Theia IDE & terminal</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>MCP server & webhook integration</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>GitHub & automation tool support</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Custom agent & workflow templates</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* AI Traders */}
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8 text-center">
                <div className="text-5xl mb-4">💎</div>
                <h3 className="text-2xl font-bold text-white">AI Traders</h3>
              </div>
              <div className="flex-1 px-6 py-8">
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Mint & trade agent NFTs</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Fractional ownership & revenue sharing</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Web3 wallet integration (ETH)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Crypto revenue tracking dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
      <div className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">INTEGRATIONS</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
              Works with Your Favorite AI Models
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Model-agnostic architecture supports all major LLM providers. Choose the best AI for each task.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-5">
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">🤖</div>
              <div className="text-sm font-semibold text-gray-900">GPT-4</div>
              <div className="text-xs text-gray-500">OpenAI</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">🧠</div>
              <div className="text-sm font-semibold text-gray-900">Claude</div>
              <div className="text-xs text-gray-500">Anthropic</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">✨</div>
              <div className="text-sm font-semibold text-gray-900">Gemini</div>
              <div className="text-xs text-gray-500">Google</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">🦙</div>
              <div className="text-sm font-semibold text-gray-900">Llama 2</div>
              <div className="text-xs text-gray-500">Meta</div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-sm font-semibold text-gray-900">Perplexity</div>
              <div className="text-xs text-gray-500">Perplexity AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 py-24">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-400 opacity-20 blur-3xl"></div>
          <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to Orchestrate AI at Scale?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-blue-100">
            Join 12,543+ community members building the future of AI agent collaboration.
            Start your 14-day free trial today—no credit card required.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto rounded-lg bg-white px-10 py-4 text-lg font-semibold text-blue-600 shadow-2xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
            >
              Start Free Trial →
            </Link>
            <Link
              to="/workflows/templates"
              className="w-full sm:w-auto rounded-lg border-2 border-white px-10 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all duration-300"
            >
              Browse Templates
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Footer */}
      <footer className="bg-gray-900" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🚀</span>
                </div>
                <span className="ml-3 text-2xl font-bold text-white">The New Fuse</span>
              </div>
              <p className="text-sm leading-6 text-gray-300">
                The world's most advanced AI agent orchestration platform.
                Orchestrate, automate, and scale AI-driven workflows with enterprise-grade reliability.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">Discord</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <Link to="/dashboard" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link to="/agents" className="text-sm leading-6 text-gray-300 hover:text-white">
                        AI Agents
                      </Link>
                    </li>
                    <li>
                      <Link to="/workflows" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Workflows
                      </Link>
                    </li>
                    <li>
                      <Link to="/agents/nft-marketplace" className="text-sm leading-6 text-gray-300 hover:text-white">
                        NFT Marketplace
                      </Link>
                    </li>
                    <li>
                      <Link to="/analytics" className="text-sm leading-6 text-gray-300 hover:text-white">
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
                      <Link to="/workflows/templates" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Template Marketplace
                      </Link>
                    </li>
                    <li>
                      <Link to="/community" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Community Forum
                      </Link>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Documentation
                      </a>
                    </li>
                    <li>
                      <Link to="/settings/api" className="text-sm leading-6 text-gray-300 hover:text-white">
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
              <div className="md:grid md:grid-cols-2 md:gap-8">
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
                      <Link to="/legal/privacy" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link to="/legal/terms" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Security
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Compliance
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
            <p className="text-xs leading-5 text-gray-400">
              &copy; 2025 The New Fuse. All rights reserved. Built with enterprise-grade reliability for AI agent orchestration.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

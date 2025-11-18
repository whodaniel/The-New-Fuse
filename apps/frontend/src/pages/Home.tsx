import React from 'react';
import { Link } from 'react-router-dom';

// Professional Landing Page - THE NEW FUSE
// This is the MAIN landing page for thenewfuse.com
export default function ProfessionalLandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            {/* Badge */}
            <div className="mb-8">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                🚀 AI-POWERED COLLABORATION PLATFORM
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Unify, Orchestrate, and Scale<br />
              <span className="text-blue-600">AI Agents & Workflows</span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Seamlessly connect and coordinate multiple AI agents for complex, multi-step workflows. 
              Built for scale, reliability, and compliance—trusted by leading organizations.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/hub"
                className="rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-500 hover:to-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-300"
              >
                🚀 Launch Modern Hub
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need for AI Collaboration
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Powerful features designed to streamline AI agent orchestration and workflow management
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {/* Agent Collaboration */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-5 w-5 flex-none text-blue-600 text-xl">🤖</div>
                  Agent Collaboration
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Seamlessly connect and coordinate multiple AI agents for complex, multi-step workflows with intelligent task distribution.
                  </p>
                </dd>
              </div>
              
              {/* Secure Integrations */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-5 w-5 flex-none text-blue-600 text-xl">🔒</div>
                  Secure Integrations
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Integrate with APIs, databases, and cloud services using robust security controls and enterprise-grade permissions.
                  </p>
                </dd>
              </div>
              
              {/* Extensible Platform */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-5 w-5 flex-none text-blue-600 text-xl">🔧</div>
                  Extensible Platform
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Plug in new agents, tools, and modules with a modular architecture designed for rapid innovation and customization.
                  </p>
                </dd>
              </div>
              
              {/* Real-Time Monitoring */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-5 w-5 flex-none text-blue-600 text-xl">📊</div>
                  Real-Time Monitoring
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Visualize agent activity, workflow status, and system health with advanced dashboards and intelligent alerts.
                  </p>
                </dd>
              </div>
              
              {/* AI-Powered Automation */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-5 w-5 flex-none text-blue-600 text-xl">⚡</div>
                  AI-Powered Automation
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Leverage advanced AI to automate complex processes, optimize workflows, and make intelligent decisions at scale.
                  </p>
                </dd>
              </div>
              
              {/* Enterprise-Ready */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-5 w-5 flex-none text-blue-600 text-xl">🏢</div>
                  Enterprise-Ready
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Built for scale, reliability, and compliance. Trusted by leading organizations for mission-critical AI operations.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your AI Workflows?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join thousands of organizations already using The New Fuse to orchestrate their AI operations.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start Your Free Trial
              </Link>
              <Link
                to="/login"
                className="rounded-md border border-white px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🚀</span>
                </div>
                <span className="ml-2 text-xl font-bold text-white">The New Fuse</span>
              </div>
              <p className="text-sm leading-6 text-gray-300">
                Orchestrate, automate, and scale AI-driven workflows with world-class agent collaboration.
              </p>
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
                      <Link to="/analytics" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Analytics
                      </Link>
                    </li>
                    <li>
                      <Link to="/settings" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Settings
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
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
                        Blog
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">
                        Documentation
                      </a>
                    </li>
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
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24">
            <p className="text-xs leading-5 text-gray-400">
              &copy; 2024 The New Fuse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

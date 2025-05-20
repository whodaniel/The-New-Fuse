```jsx
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">The New Fuse</h1>
          <nav className="space-x-4 hidden md:flex">
            <a href="#features" className="text-gray-600 hover:text-indigo-600 transition">Features</a>
            <a href="#about" className="text-gray-600 hover:text-indigo-600 transition">About</a>
            <a href="#contact" className="text-gray-600 hover:text-indigo-600 transition">Contact</a>
          </nav>
          <div className="flex space-x-3">
            <a
              href="/login"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
            >
              Login
            </a>
            <a
              href="/register"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Welcome to The New Fuse
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            The intelligent agent communication platform that brings your AI solutions together.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/register"
              className="px-8 py-3 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 transition"
            >
              Get Started Free
            </a>
            <a
              href="#features"
              className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Powerful Analytics',
                description: 'Get detailed insights into your operations with real-time analytics.',
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                ),
              },
              {
                title: 'Modular Architecture',
                description:
                  'Build and scale with flexible components that adapt to your evolving needs.',
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                ),
              },
              {
                title: 'Real-time Updates',
                description:
                  'Stay synchronized with live data feeds for up-to-the-minute information.',
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ),
              },
              {
                title: 'Enterprise Security',
                description:
                  'Bank-grade security protocols ensure your data is always safe and protected.',
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-10 items-center">
          <div className="md:w-1/2">
            <img
              src="https://placehold.co/600x400"
              alt="Platform Overview"
              className="rounded-lg shadow-lg w-full"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-4">What Is The New Fuse?</h2>
            <p className="text-lg text-gray-600 mb-6">
              The New Fuse is an intelligent agent communication platform designed to unify your AI
              systems into a seamless ecosystem. Whether you're building chatbots, automation tools, or
              enterprise workflows, our platform provides the infrastructure and tools to make it
              happen.
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✔</span>
                <span>Unified communication layer for all your AI agents.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✔</span>
                <span>Scalable architecture for growing teams and projects.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✔</span>
                <span>Advanced monitoring and analytics dashboard.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Revolutionize Your AI Workflow?
          </h2>
          <p className="text-lg mb-8">
            Join thousands of developers and businesses already using The New Fuse to power their AI
            ecosystems.
          </p>
          <a
            href="/register"
            className="inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-md shadow-md hover:bg-gray-100 transition"
          >
            Start Your Free Trial
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-indigo-600 font-bold text-xl mb-4 md:mb-0">
              The New Fuse
            </div>
            <nav className="flex space-x-6 mb-4 md:mb-0">
              <a href="#features" className="text-gray-600 hover:text-indigo-600">
                Features
              </a>
              <a href="#about" className="text-gray-600 hover:text-indigo-600">
                About
              </a>
              <a href="#contact" className="text-gray-600 hover:text-indigo-600">
                Contact
              </a>
            </nav>
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} The New Fuse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
```
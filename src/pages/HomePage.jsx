import React from 'react';
import { FeatureCard } from '../components/FeatureCard';
import { homePageFeatures } from '../constants/routes';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 The New Fuse
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Multi-Agent Chat & Frontend Application - Live React Experience
          </p>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg inline-block">
            ✅ React Development Server is Running on http://localhost:3001
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {homePageFeatures.map(feature => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">🎉 Live React Application Features</h2>
          <ul className="text-left max-w-2xl mx-auto space-y-2">
            <li>✅ Vite development server with hot reload</li>
            <li>✅ React Router for navigation</li>
            <li>✅ Tailwind CSS for styling</li>
            <li>✅ Multi-agent chat with Firebase integration</li>
            <li>✅ Real-time component rendering</li>
            <li>✅ Interactive UI elements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
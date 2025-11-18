import React from 'react';
import { Link } from 'react-router-dom';
import { FeatureShowcase, HeroStats, InteractiveDemo } from '../components/landing';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block">Welcome to</span>
              <span className="block text-blue-600 dark:text-blue-400">The New Fuse</span>
            </h1>
            <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300">
              Collaborative AI platform for next-generation problem solving and seamless team interaction
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
              <Link
                to="#core-features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <HeroStats />

      {/* Interactive Demo */}
      <InteractiveDemo />

      {/* Feature Showcase */}
      <FeatureShowcase />
    </div>
  );
};
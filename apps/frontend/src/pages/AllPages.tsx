import {
  EXPERIENCE_DOMAIN_LABELS,
  EXPERIENCE_SURFACES,
  type ExperienceSurface,
} from '@/config/experienceArchitecture';
import { ALL_PAGE_CATEGORIES, ALL_PAGES_CATALOG } from '@/config/routeCatalog';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const AllPages: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredCategories = useMemo(
    () =>
      ALL_PAGE_CATEGORIES.map((category) => ({
        ...category,
        pages: category.pages.filter(
          (page) =>
            (selectedCategory === 'All' || category.name === selectedCategory) &&
            (page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              page.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (page.description &&
                page.description.toLowerCase().includes(searchTerm.toLowerCase())))
        ),
      })).filter((category) => category.pages.length > 0),
    [searchTerm, selectedCategory]
  );

  const totalPages = ALL_PAGES_CATALOG.length;
  const architectureMap = useMemo(() => {
    const map = new Map<string, ExperienceSurface>();

    for (const surface of EXPERIENCE_SURFACES) {
      map.set(surface.path, surface);
      surface.aliases?.forEach((alias) => map.set(alias, surface));
    }

    return map;
  }, []);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const surface of EXPERIENCE_SURFACES) {
      counts[surface.domain] = (counts[surface.domain] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 The New Fuse - All Pages
          </h1>
          <p className="text-lg text-foreground dark:text-gray-300 mb-4">
            Complete directory of {totalPages} cataloged pages in The New Fuse application
          </p>
          <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-md inline-block">
            Catalog-driven route inventory
          </div>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search pages by name, path, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {ALL_PAGE_CATEGORIES.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.pages.length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCategories.map((category) => (
          <div key={category.name} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm mr-3">
                {category.pages.length}
              </span>
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.pages.map((page) => (
                <div
                  key={`${category.name}:${page.path}`}
                  className="p-4 border rounded-md bg-transparent dark:bg-transparent shadow-none hover:shadow-md transition-all duration-200 hover:scale-105"
                >
                  {(() => {
                    const architecture = architectureMap.get(page.path);
                    if (!architecture) return null;

                    return (
                      <div className="flex gap-2 mb-3">
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300/50">
                          {EXPERIENCE_DOMAIN_LABELS[architecture.domain]}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 uppercase">
                          {architecture.lifecycle}
                        </span>
                      </div>
                    );
                  })()}
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    {page.name}
                  </h3>
                  {page.description && (
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                      {page.description}
                    </p>
                  )}
                  <div className="mb-4">
                    <code className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                      {page.path}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={page.path}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-block text-sm font-medium"
                    >
                      Visit Page
                    </Link>
                    <button
                      onClick={() => {
                        const fullUrl = `${window.location.origin}${page.path}`;
                        navigator.clipboard.writeText(fullUrl);
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-foreground dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                      title="Copy URL to clipboard"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground dark:text-muted-foreground text-lg">
              No pages found matching your search criteria.
            </p>
          </div>
        )}

        <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">
            📊 Application Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Total Pages:</strong>
              <br />
              {totalPages} routes
            </div>
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Categories:</strong>
              <br />
              {ALL_PAGE_CATEGORIES.length} sections
            </div>
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Server:</strong>
              <br />
              {window.location.host}
            </div>
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Catalog:</strong>
              <br />
              Active ✅
            </div>
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Domains:</strong>
              <br />
              {Object.keys(domainCounts).length} mapped
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(domainCounts).map(([domain, count]) => (
              <span
                key={domain}
                className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-300/40 text-blue-700 dark:text-blue-300"
              >
                {EXPERIENCE_DOMAIN_LABELS[domain as keyof typeof EXPERIENCE_DOMAIN_LABELS]}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllPages;

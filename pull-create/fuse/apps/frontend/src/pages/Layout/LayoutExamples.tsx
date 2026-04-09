// @ts-nocheck
import {
  ChartBarIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  CogIcon,
  DocumentTextIcon,
  ListBulletIcon,
  PhotoIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface LayoutExample {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  code: string;
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  responsive: boolean;
  darkMode: boolean;
}

const LayoutExamples: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLayout, setSelectedLayout] = useState<LayoutExample | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const categories = [
    { id: 'all', name: 'All Layouts', icon: Squares2X2Icon },
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'forms', name: 'Forms', icon: DocumentTextIcon },
    { id: 'navigation', name: 'Navigation', icon: ListBulletIcon },
    { id: 'content', name: 'Content', icon: PhotoIcon },
    { id: 'data', name: 'Data Display', icon: TableCellsIcon },
    { id: 'admin', name: 'Admin', icon: CogIcon },
  ];

  const layouts: LayoutExample[] = [
    {
      id: 'dashboard-grid',
      name: 'Dashboard Grid Layout',
      description: 'A responsive grid layout perfect for dashboards with cards and widgets',
      category: 'dashboard',
      preview: '/previews/dashboard-grid.png',
      code: `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
    <h3 className="text-lg font-semibold mb-4">Widget 1</h3>
    <p className="text-gray-600 dark:text-gray-300">Content goes here</p>
  </div>
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
    <h3 className="text-lg font-semibold mb-4">Widget 2</h3>
    <p className="text-gray-600 dark:text-gray-300">Content goes here</p>
  </div>
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
    <h3 className="text-lg font-semibold mb-4">Widget 3</h3>
    <p className="text-gray-600 dark:text-gray-300">Content goes here</p>
  </div>
</div>`,
      tags: ['grid', 'responsive', 'cards'],
      complexity: 'beginner',
      responsive: true,
      darkMode: true,
    },
    {
      id: 'sidebar-layout',
      name: 'Sidebar Navigation Layout',
      description: 'Classic sidebar navigation with collapsible menu and main content area',
      category: 'navigation',
      preview: '/previews/sidebar-layout.png',
      code: `<div className="flex h-screen bg-gray-100 dark:bg-gray-900">
  <div className="w-64 bg-white dark:bg-gray-800 shadow-sm">
    <div className="p-4">
      <h2 className="text-xl font-bold">Navigation</h2>
    </div>
    <nav className="mt-4">
      <a href="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
        Dashboard
      </a>
      <a href="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
        Settings
      </a>
    </nav>
  </div>
  <div className="flex-1 p-8">
    <h1 className="text-2xl font-bold mb-4">Main Content</h1>
    <p>Your main content goes here</p>
  </div>
</div>`,
      tags: ['sidebar', 'navigation', 'responsive'],
      complexity: 'intermediate',
      responsive: true,
      darkMode: true,
    },
    {
      id: 'form-layout',
      name: 'Multi-Step Form Layout',
      description: 'A clean form layout with steps indicator and validation states',
      category: 'forms',
      preview: '/previews/form-layout.png',
      code: `<div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
  <div className="mb-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          1
        </div>
        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Personal Info</span>
      </div>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
          2
        </div>
        <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Contact</span>
      </div>
    </div>
  </div>
  <form className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Full Name
      </label>
      <input
        type="text"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
      />
    </div>
  </form>
</div>`,
      tags: ['form', 'steps', 'validation'],
      complexity: 'intermediate',
      responsive: true,
      darkMode: true,
    },
    {
      id: 'data-table',
      name: 'Advanced Data Table',
      description: 'Feature-rich data table with sorting, filtering, and pagination',
      category: 'data',
      preview: '/previews/data-table.png',
      code: `<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Table</h3>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
        />
        <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
          Filter
        </button>
      </div>
    </div>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <tr>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            John Doe
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button className="text-blue-600 hover:text-blue-900">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,
      tags: ['table', 'data', 'sorting', 'pagination'],
      complexity: 'advanced',
      responsive: true,
      darkMode: true,
    },
    {
      id: 'card-grid',
      name: 'Responsive Card Grid',
      description: 'Flexible card grid that adapts to different screen sizes',
      category: 'content',
      preview: '/previews/card-grid.png',
      code: `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
    <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Card Title
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
        Card description goes here
      </p>
      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Action
      </button>
    </div>
  </div>
</div>`,
      tags: ['cards', 'grid', 'responsive'],
      complexity: 'beginner',
      responsive: true,
      darkMode: true,
    },
    {
      id: 'admin-panel',
      name: 'Admin Panel Layout',
      description: 'Complete admin panel with header, sidebar, and content sections',
      category: 'admin',
      preview: '/previews/admin-panel.png',
      code: `<div className="min-h-screen bg-gray-100 dark:bg-gray-900">
  <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
  <div className="flex">
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="block px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              Dashboard
            </a>
          </li>
          <li>
            <a href="#" className="block px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              Users
            </a>
          </li>
        </ul>
      </nav>
    </aside>
    <main className="flex-1 p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Main Content
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your admin content goes here
        </p>
      </div>
    </main>
  </div>
</div>`,
      tags: ['admin', 'header', 'sidebar', 'layout'],
      complexity: 'advanced',
      responsive: true,
      darkMode: true,
    },
  ];

  const filteredLayouts =
    selectedCategory === 'all'
      ? layouts
      : layouts.filter((layout) => layout.category === selectedCategory);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Layout Examples</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Explore different layout patterns and components for your applications
          </p>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title="Grid view"
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title="List view"
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Categories
              </h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <category.icon className="w-5 h-5" />
                    <span>{category.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLayouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedLayout(layout)}
                  >
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <PhotoIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {layout.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getComplexityColor(layout.complexity)}`}
                        >
                          {layout.complexity}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {layout.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {layout.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {layout.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                            +{layout.tags.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {layout.responsive && (
                            <span className="text-green-600 dark:text-green-400" title="Responsive">
                              <ViewColumnsIcon className="w-4 h-4" />
                            </span>
                          )}
                          {layout.darkMode && (
                            <span
                              className="text-purple-600 dark:text-purple-400"
                              title="Dark mode support"
                            >
                              <RectangleStackIcon className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLayout(layout);
                            setShowCode(true);
                          }}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          <CodeBracketIcon className="w-4 h-4" />
                          <span>View Code</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLayouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedLayout(layout)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PhotoIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {layout.name}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getComplexityColor(layout.complexity)}`}
                          >
                            {layout.complexity}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {layout.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {layout.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {layout.responsive && (
                                <span
                                  className="text-green-600 dark:text-green-400"
                                  title="Responsive"
                                >
                                  <ViewColumnsIcon className="w-4 h-4" />
                                </span>
                              )}
                              {layout.darkMode && (
                                <span
                                  className="text-purple-600 dark:text-purple-400"
                                  title="Dark mode support"
                                >
                                  <RectangleStackIcon className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLayout(layout);
                                setShowCode(true);
                              }}
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                            >
                              <CodeBracketIcon className="w-4 h-4" />
                              <span>View Code</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Code Modal */}
        {selectedLayout && showCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedLayout.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedLayout.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(selectedLayout.code)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCode(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title="Close"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
                <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
                    {selectedLayout.code}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutExamples;

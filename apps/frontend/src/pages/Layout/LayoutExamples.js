import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Squares2X2Icon, ViewColumnsIcon, RectangleStackIcon, TableCellsIcon, ListBulletIcon, PhotoIcon, ChartBarIcon, DocumentTextIcon, CogIcon, CodeBracketIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
var LayoutExamples = function () {
    var _a = useState('all'), selectedCategory = _a[0], setSelectedCategory = _a[1];
    var _b = useState(null), selectedLayout = _b[0], setSelectedLayout = _b[1];
    var _c = useState('grid'), viewMode = _c[0], setViewMode = _c[1];
    var _d = useState(false), showCode = _d[0], setShowCode = _d[1];
    var _e = useState(false), copiedCode = _e[0], setCopiedCode = _e[1];
    var categories = [
        { id: 'all', name: 'All Layouts', icon: Squares2X2Icon },
        { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
        { id: 'forms', name: 'Forms', icon: DocumentTextIcon },
        { id: 'navigation', name: 'Navigation', icon: ListBulletIcon },
        { id: 'content', name: 'Content', icon: PhotoIcon },
        { id: 'data', name: 'Data Display', icon: TableCellsIcon },
        { id: 'admin', name: 'Admin', icon: CogIcon }
    ];
    var layouts = [
        {
            id: 'dashboard-grid',
            name: 'Dashboard Grid Layout',
            description: 'A responsive grid layout perfect for dashboards with cards and widgets',
            category: 'dashboard',
            preview: '/previews/dashboard-grid.png',
            code: "<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">\n  <div className=\"bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm\">\n    <h3 className=\"text-lg font-semibold mb-4\">Widget 1</h3>\n    <p className=\"text-gray-600 dark:text-gray-300\">Content goes here</p>\n  </div>\n  <div className=\"bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm\">\n    <h3 className=\"text-lg font-semibold mb-4\">Widget 2</h3>\n    <p className=\"text-gray-600 dark:text-gray-300\">Content goes here</p>\n  </div>\n  <div className=\"bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm\">\n    <h3 className=\"text-lg font-semibold mb-4\">Widget 3</h3>\n    <p className=\"text-gray-600 dark:text-gray-300\">Content goes here</p>\n  </div>\n</div>",
            tags: ['grid', 'responsive', 'cards'],
            complexity: 'beginner',
            responsive: true,
            darkMode: true
        },
        {
            id: 'sidebar-layout',
            name: 'Sidebar Navigation Layout',
            description: 'Classic sidebar navigation with collapsible menu and main content area',
            category: 'navigation',
            preview: '/previews/sidebar-layout.png',
            code: "<div className=\"flex h-screen bg-gray-100 dark:bg-gray-900\">\n  <div className=\"w-64 bg-white dark:bg-gray-800 shadow-sm\">\n    <div className=\"p-4\">\n      <h2 className=\"text-xl font-bold\">Navigation</h2>\n    </div>\n    <nav className=\"mt-4\">\n      <a href=\"#\" className=\"block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700\">\n        Dashboard\n      </a>\n      <a href=\"#\" className=\"block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700\">\n        Settings\n      </a>\n    </nav>\n  </div>\n  <div className=\"flex-1 p-8\">\n    <h1 className=\"text-2xl font-bold mb-4\">Main Content</h1>\n    <p>Your main content goes here</p>\n  </div>\n</div>",
            tags: ['sidebar', 'navigation', 'responsive'],
            complexity: 'intermediate',
            responsive: true,
            darkMode: true
        },
        {
            id: 'form-layout',
            name: 'Multi-Step Form Layout',
            description: 'A clean form layout with steps indicator and validation states',
            category: 'forms',
            preview: '/previews/form-layout.png',
            code: "<div className=\"max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8\">\n  <div className=\"mb-8\">\n    <div className=\"flex items-center justify-between\">\n      <div className=\"flex items-center\">\n        <div className=\"w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium\">\n          1\n        </div>\n        <span className=\"ml-2 text-sm font-medium text-gray-900 dark:text-white\">Personal Info</span>\n      </div>\n      <div className=\"flex items-center\">\n        <div className=\"w-8 h-8 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-medium\">\n          2\n        </div>\n        <span className=\"ml-2 text-sm font-medium text-gray-500 dark:text-gray-400\">Contact</span>\n      </div>\n    </div>\n  </div>\n  <form className=\"space-y-6\">\n    <div>\n      <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2\">\n        Full Name\n      </label>\n      <input\n        type=\"text\"\n        className=\"w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white\"\n      />\n    </div>\n  </form>\n</div>",
            tags: ['form', 'steps', 'validation'],
            complexity: 'intermediate',
            responsive: true,
            darkMode: true
        },
        {
            id: 'data-table',
            name: 'Advanced Data Table',
            description: 'Feature-rich data table with sorting, filtering, and pagination',
            category: 'data',
            preview: '/previews/data-table.png',
            code: "<div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden\">\n  <div className=\"px-6 py-4 border-b border-gray-200 dark:border-gray-700\">\n    <div className=\"flex items-center justify-between\">\n      <h3 className=\"text-lg font-semibold text-gray-900 dark:text-white\">Data Table</h3>\n      <div className=\"flex items-center space-x-2\">\n        <input\n          type=\"text\"\n          placeholder=\"Search...\"\n          className=\"px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm\"\n        />\n        <button className=\"px-3 py-1 bg-blue-600 text-white rounded-md text-sm\">\n          Filter\n        </button>\n      </div>\n    </div>\n  </div>\n  <div className=\"overflow-x-auto\">\n    <table className=\"w-full\">\n      <thead className=\"bg-gray-50 dark:bg-gray-700\">\n        <tr>\n          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider\">\n            Name\n          </th>\n          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider\">\n            Status\n          </th>\n          <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider\">\n            Actions\n          </th>\n        </tr>\n      </thead>\n      <tbody className=\"bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700\">\n        <tr>\n          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white\">\n            John Doe\n          </td>\n          <td className=\"px-6 py-4 whitespace-nowrap\">\n            <span className=\"px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full\">\n              Active\n            </span>\n          </td>\n          <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium\">\n            <button className=\"text-blue-600 hover:text-blue-900\">Edit</button>\n          </td>\n        </tr>\n      </tbody>\n    </table>\n  </div>\n</div>",
            tags: ['table', 'data', 'sorting', 'pagination'],
            complexity: 'advanced',
            responsive: true,
            darkMode: true
        },
        {
            id: 'card-grid',
            name: 'Responsive Card Grid',
            description: 'Flexible card grid that adapts to different screen sizes',
            category: 'content',
            preview: '/previews/card-grid.png',
            code: "<div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6\">\n  <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow\">\n    <div className=\"h-48 bg-gray-200 dark:bg-gray-700\"></div>\n    <div className=\"p-4\">\n      <h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">\n        Card Title\n      </h3>\n      <p className=\"text-gray-600 dark:text-gray-300 text-sm mb-4\">\n        Card description goes here\n      </p>\n      <button className=\"w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors\">\n        Action\n      </button>\n    </div>\n  </div>\n</div>",
            tags: ['cards', 'grid', 'responsive'],
            complexity: 'beginner',
            responsive: true,
            darkMode: true
        },
        {
            id: 'admin-panel',
            name: 'Admin Panel Layout',
            description: 'Complete admin panel with header, sidebar, and content sections',
            category: 'admin',
            preview: '/previews/admin-panel.png',
            code: "<div className=\"min-h-screen bg-gray-100 dark:bg-gray-900\">\n  <header className=\"bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700\">\n    <div className=\"px-6 py-4\">\n      <div className=\"flex items-center justify-between\">\n        <h1 className=\"text-xl font-semibold text-gray-900 dark:text-white\">\n          Admin Panel\n        </h1>\n        <div className=\"flex items-center space-x-4\">\n          <button className=\"p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300\">\n            <svg className=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\">\n              <path d=\"M10 12a2 2 0 100-4 2 2 0 000 4z\"/>\n            </svg>\n          </button>\n        </div>\n      </div>\n    </div>\n  </header>\n  <div className=\"flex\">\n    <aside className=\"w-64 bg-white dark:bg-gray-800 shadow-sm min-h-screen\">\n      <nav className=\"p-4\">\n        <ul className=\"space-y-2\">\n          <li>\n            <a href=\"#\" className=\"block px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700\">\n              Dashboard\n            </a>\n          </li>\n          <li>\n            <a href=\"#\" className=\"block px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700\">\n              Users\n            </a>\n          </li>\n        </ul>\n      </nav>\n    </aside>\n    <main className=\"flex-1 p-8\">\n      <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6\">\n        <h2 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">\n          Main Content\n        </h2>\n        <p className=\"text-gray-600 dark:text-gray-300\">\n          Your admin content goes here\n        </p>\n      </div>\n    </main>\n  </div>\n</div>",
            tags: ['admin', 'header', 'sidebar', 'layout'],
            complexity: 'advanced',
            responsive: true,
            darkMode: true
        }
    ];
    var filteredLayouts = selectedCategory === 'all'
        ? layouts
        : layouts.filter(function (layout) { return layout.category === selectedCategory; });
    var copyToClipboard = function (code) {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(function () { return setCopiedCode(false); }, 2000);
    };
    var getComplexityColor = function (complexity) {
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
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-4", children: "Layout Examples" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-6", children: "Explore different layout patterns and components for your applications" }), _jsx("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: _jsx("div", { className: "flex items-center space-x-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: function () { return setViewMode('grid'); }, className: "p-2 rounded-lg transition-colors ".concat(viewMode === 'grid'
                                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'), title: "Grid view", children: _jsx(Squares2X2Icon, { className: "w-5 h-5" }) }), _jsx("button", { onClick: function () { return setViewMode('list'); }, className: "p-2 rounded-lg transition-colors ".concat(viewMode === 'list'
                                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'), title: "List view", children: _jsx(ListBulletIcon, { className: "w-5 h-5" }) })] }) }) })] }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-8", children: [_jsx("div", { className: "lg:w-64 flex-shrink-0", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Categories" }), _jsx("nav", { className: "space-y-2", children: categories.map(function (category) { return (_jsxs("button", { onClick: function () { return setSelectedCategory(category.id); }, className: "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ".concat(selectedCategory === category.id
                                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'), children: [_jsx(category.icon, { className: "w-5 h-5" }), _jsx("span", { children: category.name })] }, category.id)); }) })] }) }), _jsx("div", { className: "flex-1", children: viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6", children: filteredLayouts.map(function (layout) { return (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer", onClick: function () { return setSelectedLayout(layout); }, children: [_jsx("div", { className: "h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center", children: _jsx(PhotoIcon, { className: "w-12 h-12 text-gray-400" }) }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: layout.name }), _jsx("span", { className: "px-2 py-1 text-xs font-medium rounded-full ".concat(getComplexityColor(layout.complexity)), children: layout.complexity })] }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 text-sm mb-3", children: layout.description }), _jsxs("div", { className: "flex flex-wrap gap-1 mb-3", children: [layout.tags.slice(0, 3).map(function (tag) { return (_jsx("span", { className: "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full", children: tag }, tag)); }), layout.tags.length > 3 && (_jsxs("span", { className: "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full", children: ["+", layout.tags.length - 3] }))] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [layout.responsive && (_jsx("span", { className: "text-green-600 dark:text-green-400", title: "Responsive", children: _jsx(ViewColumnsIcon, { className: "w-4 h-4" }) })), layout.darkMode && (_jsx("span", { className: "text-purple-600 dark:text-purple-400", title: "Dark mode support", children: _jsx(RectangleStackIcon, { className: "w-4 h-4" }) }))] }), _jsxs("button", { onClick: function (e) {
                                                                e.stopPropagation();
                                                                setSelectedLayout(layout);
                                                                setShowCode(true);
                                                            }, className: "flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm", children: [_jsx(CodeBracketIcon, { className: "w-4 h-4" }), _jsx("span", { children: "View Code" })] })] })] })] }, layout.id)); }) })) : (_jsx("div", { className: "space-y-4", children: filteredLayouts.map(function (layout) { return (_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer", onClick: function () { return setSelectedLayout(layout); }, children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(PhotoIcon, { className: "w-6 h-6 text-gray-400" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: layout.name }), _jsx("span", { className: "px-2 py-1 text-xs font-medium rounded-full ".concat(getComplexityColor(layout.complexity)), children: layout.complexity })] }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-3", children: layout.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex flex-wrap gap-1", children: layout.tags.map(function (tag) { return (_jsx("span", { className: "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full", children: tag }, tag)); }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [layout.responsive && (_jsx("span", { className: "text-green-600 dark:text-green-400", title: "Responsive", children: _jsx(ViewColumnsIcon, { className: "w-4 h-4" }) })), layout.darkMode && (_jsx("span", { className: "text-purple-600 dark:text-purple-400", title: "Dark mode support", children: _jsx(RectangleStackIcon, { className: "w-4 h-4" }) }))] }), _jsxs("button", { onClick: function (e) {
                                                                            e.stopPropagation();
                                                                            setSelectedLayout(layout);
                                                                            setShowCode(true);
                                                                        }, className: "flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm", children: [_jsx(CodeBracketIcon, { className: "w-4 h-4" }), _jsx("span", { children: "View Code" })] })] })] })] })] }) }, layout.id)); }) })) })] }), selectedLayout && showCode && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: selectedLayout.name }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 text-sm", children: selectedLayout.description })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: function () { return copyToClipboard(selectedLayout.code); }, className: "flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: copiedCode ? (_jsxs(_Fragment, { children: [_jsx(CheckIcon, { className: "w-4 h-4" }), _jsx("span", { children: "Copied!" })] })) : (_jsxs(_Fragment, { children: [_jsx(ClipboardDocumentIcon, { className: "w-4 h-4" }), _jsx("span", { children: "Copy" })] })) }), _jsx("button", { onClick: function () { return setShowCode(false); }, className: "p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300", title: "Close", children: _jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })] })] }), _jsx("div", { className: "p-6 overflow-auto max-h-[calc(90vh-120px)]", children: _jsx("pre", { className: "bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto", children: _jsx("code", { className: "text-sm text-gray-800 dark:text-gray-200", children: selectedLayout.code }) }) })] }) }))] }) }));
};
export default LayoutExamples;

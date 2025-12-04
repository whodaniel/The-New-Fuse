var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Settings, Save, Edit, Eye, EyeOff, AlertTriangle, CheckCircle, Search, Plus, Trash2, Download, Upload, } from 'lucide-react';
export default function ConfigurationManagement() {
    var _a = useState([
        {
            key: 'DATABASE_URL',
            value: 'postgresql://localhost:5432/mydb',
            category: 'Database',
            description: 'Primary database connection string',
            sensitive: true,
            updatedAt: new Date('2024-01-15'),
            updatedBy: 'admin@example.com',
        },
        {
            key: 'REDIS_URL',
            value: 'redis://localhost:6379',
            category: 'Cache',
            description: 'Redis cache connection string',
            sensitive: true,
            updatedAt: new Date('2024-02-10'),
            updatedBy: 'admin@example.com',
        },
        {
            key: 'MAX_UPLOAD_SIZE',
            value: '10485760',
            category: 'Application',
            description: 'Maximum file upload size in bytes',
            sensitive: false,
            updatedAt: new Date('2024-03-05'),
            updatedBy: 'john@example.com',
        },
        {
            key: 'SESSION_TIMEOUT',
            value: '3600',
            category: 'Security',
            description: 'Session timeout in seconds',
            sensitive: false,
            updatedAt: new Date('2024-01-20'),
            updatedBy: 'admin@example.com',
        },
        {
            key: 'API_RATE_LIMIT',
            value: '1000',
            category: 'API',
            description: 'API rate limit per hour',
            sensitive: false,
            updatedAt: new Date('2024-02-28'),
            updatedBy: 'admin@example.com',
        },
    ]), configs = _a[0], setConfigs = _a[1];
    var _b = useState(''), searchTerm = _b[0], setSearchTerm = _b[1];
    var _c = useState('all'), selectedCategory = _c[0], setSelectedCategory = _c[1];
    var _d = useState(new Set()), showSensitive = _d[0], setShowSensitive = _d[1];
    var _e = useState(null), editingKey = _e[0], setEditingKey = _e[1];
    var _f = useState(''), editValue = _f[0], setEditValue = _f[1];
    var _g = useState(false), hasChanges = _g[0], setHasChanges = _g[1];
    var categories = __spreadArray(['all'], new Set(configs.map(function (c) { return c.category; })), true);
    var filteredConfigs = configs.filter(function (config) {
        var matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            config.description.toLowerCase().includes(searchTerm.toLowerCase());
        var matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    var toggleSensitiveVisibility = function (key) {
        var newSet = new Set(showSensitive);
        if (newSet.has(key)) {
            newSet.delete(key);
        }
        else {
            newSet.add(key);
        }
        setShowSensitive(newSet);
    };
    var handleEdit = function (config) {
        setEditingKey(config.key);
        setEditValue(config.value);
    };
    var handleSave = function (key) {
        setConfigs(configs.map(function (c) {
            return c.key === key
                ? __assign(__assign({}, c), { value: editValue, updatedAt: new Date(), updatedBy: 'current@example.com' }) : c;
        }));
        setEditingKey(null);
        setHasChanges(true);
    };
    var handleCancel = function () {
        setEditingKey(null);
        setEditValue('');
    };
    var saveAllChanges = function () {
        console.log('Saving all configuration changes...');
        setHasChanges(false);
        // API call to save changes
    };
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(Settings, { className: "h-8 w-8 mr-3 text-blue-600" }), "Configuration Management"] }), _jsx("p", { className: "text-gray-600", children: "Manage system configuration and environment variables" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export"] }), _jsxs("button", { className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Import"] }), hasChanges && (_jsxs("button", { onClick: saveAllChanges, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center", children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save All Changes"] }))] })] }) }), _jsx("div", { className: "bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8", children: _jsxs("div", { className: "flex items-start", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-400 mr-3 mt-0.5" }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-yellow-800", children: "Configuration Warning" }), _jsx("p", { className: "mt-1 text-sm text-yellow-700", children: "Changes to system configuration may require application restart. Always test changes in a staging environment first." })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Total Configurations" }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: configs.length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Categories" }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: categories.length - 1 })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Sensitive Values" }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: configs.filter(function (c) { return c.sensitive; }).length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Pending Changes" }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: hasChanges ? 1 : 0 })] })] }), _jsx("div", { className: "bg-white rounded-lg shadow p-6 mb-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx("div", { className: "md:col-span-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search configurations...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }) }), _jsx("div", { children: _jsx("select", { value: selectedCategory, onChange: function (e) { return setSelectedCategory(e.target.value); }, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: categories.map(function (cat) { return (_jsx("option", { value: cat, children: cat === 'all' ? 'All Categories' : cat }, cat)); }) }) })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Key" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Value" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Category" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Description" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Last Updated" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredConfigs.map(function (config) { return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-sm font-medium text-gray-900 font-mono", children: config.key }), config.sensitive && (_jsx("span", { className: "ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded", children: "Sensitive" }))] }) }), _jsx("td", { className: "px-6 py-4", children: editingKey === config.key ? (_jsx("input", { type: "text", value: editValue, onChange: function (e) { return setEditValue(e.target.value); }, className: "w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm" })) : (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-sm text-gray-900 font-mono", children: config.sensitive && !showSensitive.has(config.key)
                                                            ? '••••••••••••'
                                                            : config.value }), config.sensitive && (_jsx("button", { onClick: function () { return toggleSensitiveVisibility(config.key); }, className: "ml-2 text-gray-400 hover:text-gray-600", children: showSensitive.has(config.key) ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) }))] })) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800", children: config.category }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("div", { className: "text-sm text-gray-600", children: config.description }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm text-gray-900", children: config.updatedAt.toLocaleDateString() }), _jsx("div", { className: "text-xs text-gray-500", children: config.updatedBy })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: editingKey === config.key ? (_jsxs("div", { className: "flex items-center justify-end space-x-2", children: [_jsx("button", { onClick: function () { return handleSave(config.key); }, className: "text-green-600 hover:text-green-900", children: _jsx(CheckCircle, { className: "h-5 w-5" }) }), _jsx("button", { onClick: handleCancel, className: "text-red-600 hover:text-red-900", children: _jsx(Trash2, { className: "h-5 w-5" }) })] })) : (_jsx("button", { onClick: function () { return handleEdit(config); }, className: "text-blue-600 hover:text-blue-900", children: _jsx(Edit, { className: "h-5 w-5" }) })) })] }, config.key)); }) })] }) }) }), _jsx("div", { className: "mt-6", children: _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Configuration"] }) })] }));
}

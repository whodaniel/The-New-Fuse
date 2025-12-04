var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Database, Play, Download, Upload, Table, AlertCircle, CheckCircle, Clock, } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export default function DatabaseAdminPanel() {
    var _this = this;
    var _a = useState('SELECT * FROM users LIMIT 10;'), query = _a[0], setQuery = _a[1];
    var _b = useState(null), queryResult = _b[0], setQueryResult = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState('users'), selectedTable = _e[0], setSelectedTable = _e[1];
    var tables = [
        { name: 'users', rows: 1247, size: '12.4 MB' },
        { name: 'agents', rows: 234, size: '3.2 MB' },
        { name: 'workspaces', rows: 156, size: '2.1 MB' },
        { name: 'messages', rows: 45123, size: '234.5 MB' },
        { name: 'sessions', rows: 8542, size: '8.9 MB' },
        { name: 'audit_logs', rows: 125634, size: '89.2 MB' },
    ];
    var dbStats = [
        { metric: 'Total Size', value: '1.2 GB' },
        { metric: 'Tables', value: '24' },
        { metric: 'Connections', value: '45/100' },
        { metric: 'Cache Hit Rate', value: '94.2%' },
    ];
    var queryHistory = [
        { query: 'SELECT * FROM users WHERE role = "admin"', time: '2m ago', rows: 12, duration: 45 },
        { query: 'UPDATE agents SET status = "active" WHERE id = 123', time: '15m ago', rows: 1, duration: 23 },
        { query: 'SELECT COUNT(*) FROM messages GROUP BY workspace_id', time: '1h ago', rows: 156, duration: 234 },
    ];
    var performanceData = [
        { hour: '00:00', queries: 120, avgTime: 45 },
        { hour: '04:00', queries: 80, avgTime: 38 },
        { hour: '08:00', queries: 450, avgTime: 67 },
        { hour: '12:00', queries: 680, avgTime: 89 },
        { hour: '16:00', queries: 520, avgTime: 72 },
        { hour: '20:00', queries: 320, avgTime: 54 },
    ];
    var executeQuery = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    _a.sent();
                    // Mock result
                    setQueryResult({
                        columns: ['id', 'email', 'name', 'role', 'created_at'],
                        rows: [
                            [1, 'admin@example.com', 'Admin User', 'admin', '2024-01-15'],
                            [2, 'john@example.com', 'John Doe', 'user', '2024-03-20'],
                            [3, 'jane@example.com', 'Jane Smith', 'moderator', '2024-02-10'],
                        ],
                        rowCount: 3,
                        executionTime: 42,
                    });
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError('Query execution failed');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(Database, { className: "h-8 w-8 mr-3 text-blue-600" }), "Database Admin Panel"] }), _jsx("p", { className: "text-gray-600", children: "Query and manage database directly" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export"] }), _jsxs("button", { className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Import"] })] })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: dbStats.map(function (stat, index) { return (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("div", { className: "text-sm text-gray-600", children: stat.metric }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: stat.value })] }, index)); }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Table, { className: "h-5 w-5 mr-2" }), "Tables"] }), _jsx("div", { className: "space-y-2", children: tables.map(function (table) { return (_jsx("button", { onClick: function () { return setSelectedTable(table.name); }, className: "w-full text-left p-3 rounded-lg transition-colors ".concat(selectedTable === table.name
                                        ? 'bg-blue-50 border-2 border-blue-500'
                                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: table.name }), _jsxs("div", { className: "text-xs text-gray-500", children: [table.rows.toLocaleString(), " rows"] })] }), _jsx("div", { className: "text-xs text-gray-500", children: table.size })] }) }, table.name)); }) })] }), _jsxs("div", { className: "lg:col-span-2 bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Query Editor" }), _jsx("div", { className: "mb-4", children: _jsx("textarea", { value: query, onChange: function (e) { return setQuery(e.target.value); }, className: "w-full h-32 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500", placeholder: "Enter SQL query..." }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: executeQuery, disabled: loading, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50", children: [_jsx(Play, { className: "h-4 w-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), loading ? 'Executing...' : 'Execute Query'] }), _jsx("button", { className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Clear" })] }), error && (_jsxs("div", { className: "mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-red-500 mr-2 mt-0.5" }), _jsx("div", { className: "text-sm text-red-700", children: error })] })), queryResult && (_jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-500 mr-1" }), queryResult.rowCount, " rows returned"] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "h-4 w-4 text-blue-500 mr-1" }), queryResult.executionTime, "ms"] })] }), _jsxs("button", { className: "text-blue-600 hover:text-blue-700 text-sm", children: [_jsx(Download, { className: "h-4 w-4 inline mr-1" }), "Export Results"] })] }), _jsx("div", { className: "overflow-x-auto border border-gray-200 rounded-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsx("tr", { children: queryResult.columns.map(function (col, i) { return (_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: col }, i)); }) }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: queryResult.rows.map(function (row, i) { return (_jsx("tr", { className: "hover:bg-gray-50", children: row.map(function (cell, j) { return (_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: cell }, j)); }) }, i)); }) })] }) })] }))] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Query History" }), _jsx("div", { className: "space-y-3", children: queryHistory.map(function (item, index) { return (_jsxs("div", { className: "p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer", children: [_jsx("div", { className: "text-sm font-mono text-gray-900 mb-1", children: item.query }), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsx("span", { children: item.time }), _jsxs("span", { children: [item.rows, " rows \u2022 ", item.duration, "ms"] })] })] }, index)); }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Query Performance" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: performanceData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "hour" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "queries", fill: "#3b82f6", name: "Queries" }), _jsx(Bar, { dataKey: "avgTime", fill: "#10b981", name: "Avg Time (ms)" })] }) })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Database Health" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Connection Pool" }), _jsx("span", { className: "text-sm font-bold", children: "45%" })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: '45%' } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Cache Hit Rate" }), _jsx("span", { className: "text-sm font-bold", children: "94.2%" })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: '94.2%' } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Replication Lag" }), _jsx("span", { className: "text-sm font-bold", children: "12ms" })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: '88%' } }) })] })] })] })] }));
}

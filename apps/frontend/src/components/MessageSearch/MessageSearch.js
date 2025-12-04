"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import { Search } from 'lucide-react';
import use_debounce_1 from 'use-debounce';
import axios_1 from 'axios';
import ui_1 from '../../shared/components/ui';
import ui_2 from '../../shared/components/ui';
var MessageSearch = function () {
    var _a = (0, react_1.useState)(''), searchTerm = _a[0], setSearchTerm = _a[1];
    var _b = (0, react_1.useState)([]), searchResults = _b[0], setSearchResults = _b[1];
    var _c = (0, react_1.useState)(false), isLoading = _c[0], setIsLoading = _c[1];
    var debouncedSearchTerm = (0, use_debounce_1.useDebounce)(searchTerm, 500)[0];
    (0, react_1.useEffect)(function () {
        var fetchSearchResults = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!debouncedSearchTerm) return [3 /*break*/, 6];
                        setIsLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, axios_1.default.get("/api/chat/search?q=".concat(debouncedSearchTerm))];
                    case 2:
                        response = _a.sent();
                        setSearchResults(response.data.data);
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error fetching search results:', error_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        setSearchResults([]);
                        _a.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        fetchSearchResults();
    }, [debouncedSearchTerm]);
    var handleSearchTermChange = function (event) {
        setSearchTerm(event.target.value);
    };
    return (_jsxs(ui_1.Card, { variant: "default", className: "w-full max-w-2xl mx-auto", children: [_jsxs(ui_1.CardHeader, { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Search, { className: "text-gray-400" }), _jsx(ui_2.Label, { children: "Search Messages" })] }), _jsx("div", { className: "mt-2", children: _jsx("input", { type: "text", placeholder: "Search messages...", value: searchTerm, onChange: handleSearchTermChange, className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" }) })] }), _jsx(ui_1.CardContent, { children: isLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) })) : searchResults.length > 0 ? (_jsx("div", { className: "space-y-4", children: searchResults.map(function (message) { return (_jsx("div", { className: "p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors", children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center", children: _jsx("span", { className: "text-blue-600 font-medium", children: message.sender.charAt(0).toUpperCase() }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: message.sender }), _jsx("p", { className: "text-sm text-gray-500", children: new Date(message.timestamp).toLocaleDateString() })] }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: message.content })] })] }) }, message.id)); }) })) : searchTerm ? (_jsx("p", { className: "text-center text-gray-500 py-8", children: "No messages found" })) : (_jsx("p", { className: "text-center text-gray-500 py-8", children: "Start typing to search messages" })) })] }));
};
exports.default = MessageSearch;

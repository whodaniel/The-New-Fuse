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
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MCPMarketplaceService } from '../services/MCPMarketplaceService';
import { useMcpServers } from '../hooks/useMcp';
import { StarRating } from '@/components/ui/star-rating';
import { Icons } from '@/components/ui/icons';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';
/**
 * MCP Marketplace component for browsing and installing MCP servers
 */
export function MCPMarketplace() {
    var _this = this;
    var _a = useState([]), servers = _a[0], setServers = _a[1];
    var _b = useState([]), filteredServers = _b[0], setFilteredServers = _b[1];
    var _c = useState([]), categories = _c[0], setCategories = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState(''), searchQuery = _e[0], setSearchQuery = _e[1];
    var _f = useState('all'), selectedCategory = _f[0], setSelectedCategory = _f[1];
    var _g = useState('browse'), activeTab = _g[0], setActiveTab = _g[1];
    var _h = useState(null), selectedServer = _h[0], setSelectedServer = _h[1];
    var _j = useState(false), dialogOpen = _j[0], setDialogOpen = _j[1];
    var _k = useState(false), installDialogOpen = _k[0], setInstallDialogOpen = _k[1];
    var marketplaceService = new MCPMarketplaceService();
    var _l = useMcpServers(), createServer = _l.createServer, installedServers = _l.servers;
    // Load servers on mount
    useEffect(function () {
        fetchServers();
    }, []);
    // Filter servers when search query or category changes
    useEffect(function () {
        if (!servers.length)
            return;
        var filtered = __spreadArray([], servers, true);
        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(function (server) { return server.category === selectedCategory; });
        }
        // Apply search filter
        if (searchQuery) {
            var query_1 = searchQuery.toLowerCase();
            filtered = filtered.filter(function (server) {
                return server.name.toLowerCase().includes(query_1) ||
                    server.description.toLowerCase().includes(query_1) ||
                    server.publisher.toLowerCase().includes(query_1) ||
                    server.capabilities.some(function (cap) { return cap.toLowerCase().includes(query_1); });
            });
        }
        setFilteredServers(filtered);
    }, [servers, searchQuery, selectedCategory]);
    /**
     * Fetch all servers from the marketplace
     */
    var fetchServers = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, uniqueCategories, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, marketplaceService.getServers()];
                case 2:
                    data = _a.sent();
                    setServers(data);
                    setFilteredServers(data);
                    uniqueCategories = Array.from(new Set(data.map(function (server) { return server.category; })));
                    setCategories(uniqueCategories);
                    setLoading(false);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching MCP marketplace servers:', error_1);
                    setLoading(false);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Handle search input change
     */
    var handleSearchChange = function (e) {
        setSearchQuery(e.target.value);
    };
    /**
     * Handle category selection change
     */
    var handleCategoryChange = function (value) {
        setSelectedCategory(value);
    };
    /**
     * Show server details dialog
     */
    var showServerDetails = function (server) {
        setSelectedServer(server);
        setDialogOpen(true);
    };
    /**
     * Show installation dialog
     */
    var showInstallDialog = function (server) {
        setSelectedServer(server);
        setInstallDialogOpen(true);
    };
    /**
     * Check if server is already installed
     */
    var isServerInstalled = function (serverId) {
        return installedServers.some(function (server) { return server.id === serverId; });
    };
    return (_jsxs("div", { className: "container mx-auto py-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "MCP Server Marketplace" }), _jsxs(Button, { variant: "outline", onClick: fetchServers, disabled: loading, children: [loading ? _jsx(Icons.spinner, { className: "mr-2 h-4 w-4 animate-spin" }) : _jsx(Icons.refresh, { className: "mr-2 h-4 w-4" }), "Refresh"] })] }), _jsxs(Tabs, { defaultValue: "browse", value: activeTab, onValueChange: setActiveTab, className: "mb-6", children: [_jsxs(TabsList, { className: "mb-4", children: [_jsx(TabsTrigger, { value: "browse", children: "Browse" }), _jsx(TabsTrigger, { value: "popular", children: "Popular" }), _jsx(TabsTrigger, { value: "recent", children: "Recently Added" })] }), _jsxs("div", { className: "flex gap-4 mb-6", children: [_jsx("div", { className: "flex-1", children: _jsx(Input, { type: "search", placeholder: "Search servers...", value: searchQuery, onChange: handleSearchChange, className: "w-full" }) }), _jsxs(Select, { value: selectedCategory, onValueChange: handleCategoryChange, children: [_jsx(SelectTrigger, { className: "w-[200px]", children: _jsx(SelectValue, { placeholder: "Category" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Categories" }), categories.map(function (category) { return (_jsx(SelectItem, { value: category, children: category }, category)); })] })] })] }), _jsx(TabsContent, { value: "browse", className: "mt-0", children: loading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Icons.spinner, { className: "h-8 w-8 animate-spin" }) })) : filteredServers.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "No servers found matching your criteria" }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredServers.map(function (server) { return (_jsx(ServerCard, { server: server, onViewDetails: function () { return showServerDetails(server); }, onInstall: function () { return showInstallDialog(server); }, isInstalled: isServerInstalled(server.id) }, server.id)); }) })) }), _jsx(TabsContent, { value: "popular", className: "mt-0", children: loading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Icons.spinner, { className: "h-8 w-8 animate-spin" }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredServers
                                .sort(function (a, b) { return b.downloads - a.downloads; })
                                .slice(0, 6)
                                .map(function (server) { return (_jsx(ServerCard, { server: server, onViewDetails: function () { return showServerDetails(server); }, onInstall: function () { return showInstallDialog(server); }, isInstalled: isServerInstalled(server.id) }, server.id)); }) })) }), _jsx(TabsContent, { value: "recent", className: "mt-0", children: loading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Icons.spinner, { className: "h-8 w-8 animate-spin" }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredServers
                                .sort(function (a, b) { return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(); })
                                .slice(0, 6)
                                .map(function (server) { return (_jsx(ServerCard, { server: server, onViewDetails: function () { return showServerDetails(server); }, onInstall: function () { return showInstallDialog(server); }, isInstalled: isServerInstalled(server.id) }, server.id)); }) })) })] }), selectedServer && (_jsx(ServerDetailsDialog, { server: selectedServer, open: dialogOpen, onClose: function () { return setDialogOpen(false); }, onInstall: function () {
                    setDialogOpen(false);
                    showInstallDialog(selectedServer);
                }, isInstalled: isServerInstalled(selectedServer.id) })), selectedServer && (_jsx(ServerInstallDialog, { server: selectedServer, open: installDialogOpen, onClose: function () { return setInstallDialogOpen(false); }, onInstall: function (config) { return handleInstallServer(selectedServer, config); } }))] }));
    /**
     * Handle server installation
     */
    function handleInstallServer(server, config) {
        return __awaiter(this, void 0, void 0, function () {
            var success, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, marketplaceService.installServer(server.id, config)];
                    case 1:
                        success = _a.sent();
                        if (!success) return [3 /*break*/, 3];
                        // Add server to the list of installed servers
                        return [4 /*yield*/, createServer({
                                name: server.name,
                                description: server.description,
                                command: server.installCommand,
                                args: server.args,
                                env: config || {}
                            })];
                    case 2:
                        // Add server to the list of installed servers
                        _a.sent();
                        toast({
                            title: "Server Installed",
                            description: "".concat(server.name, " has been installed successfully"),
                            variant: "default",
                        });
                        setInstallDialogOpen(false);
                        return [3 /*break*/, 4];
                    case 3:
                        toast({
                            title: "Installation Failed",
                            description: "There was an error installing the server",
                            variant: "destructive",
                        });
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        toast({
                            title: "Installation Failed",
                            description: error_2.message || "There was an error installing the server",
                            variant: "destructive",
                        });
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
}
/**
 * Server card component
 */
function ServerCard(_a) {
    var server = _a.server, onViewDetails = _a.onViewDetails, onInstall = _a.onInstall, isInstalled = _a.isInstalled;
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { className: "text-xl", children: server.name }), _jsx(Badge, { variant: "outline", children: server.category })] }), _jsxs(CardDescription, { className: "flex items-center gap-2", children: [_jsx("span", { children: server.publisher }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["v", server.version] })] })] }), _jsxs(CardContent, { children: [_jsx("p", { className: "line-clamp-3 text-sm text-muted-foreground mb-3", children: server.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(StarRating, { rating: server.rating }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [server.downloads.toLocaleString(), " downloads"] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [server.capabilities.slice(0, 3).map(function (capability) { return (_jsx(Badge, { variant: "secondary", className: "text-xs", children: capability }, capability)); }), server.capabilities.length > 3 && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: ["+", server.capabilities.length - 3, " more"] }))] })] }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: onViewDetails, children: "View Details" }), _jsx(Button, { variant: isInstalled ? "secondary" : "default", size: "sm", onClick: onInstall, disabled: isInstalled, children: isInstalled ? "Installed" : "Install" })] })] }));
}
/**
 * Server details dialog component
 */
function ServerDetailsDialog(_a) {
    var server = _a.server, open = _a.open, onClose = _a.onClose, onInstall = _a.onInstall, isInstalled = _a.isInstalled;
    return (_jsx(Dialog, { open: open, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-3xl", children: [_jsxs(DialogHeader, { children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx(DialogTitle, { className: "text-2xl", children: server.name }), _jsx(Badge, { variant: "outline", children: server.category })] }), _jsxs(DialogDescription, { className: "flex items-center gap-2", children: [_jsxs("span", { children: ["By ", server.publisher] }), " \u2022", _jsxs("span", { children: ["Version ", server.version] }), " \u2022", _jsxs("span", { children: ["Updated ", new Date(server.lastUpdated).toLocaleDateString()] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Description" }), _jsx("p", { className: "text-muted-foreground mb-4", children: server.description }), _jsx("h3", { className: "text-lg font-semibold mb-2", children: "Capabilities" }), _jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: server.capabilities.map(function (capability) { return (_jsx(Badge, { variant: "secondary", children: capability }, capability)); }) }), server.requiresConfiguration && (_jsxs("div", { className: "bg-muted p-3 rounded-md mt-4", children: [_jsxs("h4", { className: "font-medium flex items-center gap-2", children: [_jsx(Icons.warning, { className: "h-4 w-4" }), "Configuration Required"] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "This server requires additional configuration during installation." })] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-muted p-4 rounded-md", children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("h4", { className: "font-medium", children: "Rating" }), _jsxs("span", { children: [server.rating.toFixed(1), "/5.0"] })] }), _jsx(StarRating, { rating: server.rating }), _jsxs("div", { className: "flex justify-between items-center mt-4 mb-2", children: [_jsx("h4", { className: "font-medium", children: "Downloads" }), _jsx("span", { children: server.downloads.toLocaleString() })] }), _jsx("div", { className: "flex justify-between items-center mt-4", children: _jsx("h4", { className: "font-medium", children: "Install Command" }) }), _jsxs("code", { className: "block bg-background p-2 rounded mt-1 text-xs overflow-x-auto", children: [server.installCommand, " ", server.args.join(' ')] })] }), _jsx(Button, { className: "w-full", onClick: onInstall, disabled: isInstalled, children: isInstalled ? "Already Installed" : "Install Server" })] })] })] }) }));
}
/**
 * Server installation dialog component
 */
function ServerInstallDialog(_a) {
    var server = _a.server, open = _a.open, onClose = _a.onClose, onInstall = _a.onInstall;
    // Create form schema based on server configuration requirements
    var createFormSchema = function () {
        if (!server.requiresConfiguration || !server.configurationSchema) {
            return z.object({});
        }
        var schemaFields = {};
        // Add fields based on the configuration schema
        Object.entries(server.configurationSchema.properties).forEach(function (_a) {
            var _b, _c;
            var key = _a[0], prop = _a[1];
            var isRequired = ((_c = (_b = server.configurationSchema) === null || _b === void 0 ? void 0 : _b.required) === null || _c === void 0 ? void 0 : _c.includes(key)) || false;
            if (prop.type === 'string') {
                schemaFields[key] = isRequired ? z.string().min(1, { message: "".concat(key, " is required") }) : z.string().optional();
            }
            else if (prop.type === 'number') {
                schemaFields[key] = isRequired ? z.number({ required_error: "".concat(key, " is required") }) : z.number().optional();
            }
            else if (prop.type === 'boolean') {
                schemaFields[key] = z.boolean().optional();
            }
        });
        return z.object(schemaFields);
    };
    var formSchema = createFormSchema();
    // Create the form
    var form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {}
    });
    // Handle form submission
    var onSubmit = function (values) {
        onInstall(values);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onClose, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Install MCP Server" }), _jsx(DialogDescription, { children: server.requiresConfiguration
                                ? "Configure the server before installation"
                                : "Ready to install this MCP server" })] }), _jsx(Form, __assign({}, form, { children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [server.requiresConfiguration && server.configurationSchema ? (_jsx("div", { className: "space-y-4", children: Object.entries(server.configurationSchema.properties).map(function (_a) {
                                    var _b, _c;
                                    var key = _a[0], prop = _a[1];
                                    var isRequired = ((_c = (_b = server.configurationSchema) === null || _b === void 0 ? void 0 : _b.required) === null || _c === void 0 ? void 0 : _c.includes(key)) || false;
                                    if (prop.type === 'boolean') {
                                        return (_jsx(FormField, { control: form.control, name: key, render: function (_a) {
                                                var field = _a.field;
                                                return (_jsxs(FormItem, { className: "flex flex-row items-start space-x-3 space-y-0 rounded-md p-4", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsxs("div", { className: "space-y-1 leading-none", children: [_jsxs(FormLabel, { children: [key, isRequired && _jsx("span", { className: "text-destructive", children: " *" })] }), prop.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: prop.description }))] })] }));
                                            } }, key));
                                    }
                                    return (_jsx(FormField, { control: form.control, name: key, render: function (_a) {
                                            var field = _a.field;
                                            return (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: [key, isRequired && _jsx("span", { className: "text-destructive", children: " *" })] }), _jsx(FormControl, { children: _jsx(Input, __assign({}, field, { type: prop.type === 'number' ? 'number' : 'text', placeholder: prop.description })) }), prop.description && (_jsx("p", { className: "text-xs text-muted-foreground", children: prop.description })), _jsx(FormMessage, {})] }));
                                        } }, key));
                                }) })) : (_jsxs("div", { className: "py-4 text-center", children: [_jsx("p", { children: "No additional configuration required." }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Click install to add this server to your configuration." })] })), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", type: "button", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", children: "Install" })] })] }) }))] }) }));
}

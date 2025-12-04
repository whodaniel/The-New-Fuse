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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AgentNFTCard } from './AgentNFTCard';
import { Search, Filter, SortAsc, TrendingUp, Users, Coins, RefreshCw, Plus } from 'lucide-react';
import { formatEther } from 'ethers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
export var AgentNFTMarketplace = function (_a) {
    var userAddress = _a.userAddress, onMintNFT = _a.onMintNFT, onFractionalize = _a.onFractionalize, onBuyShares = _a.onBuyShares, onMakeOffer = _a.onMakeOffer, onListShares = _a.onListShares;
    var _b = useState([]), agentNFTs = _b[0], setAgentNFTs = _b[1];
    var _c = useState([]), marketplaceListings = _c[0], setMarketplaceListings = _c[1];
    var _d = useState([]), userShares = _d[0], setUserShares = _d[1];
    var _e = useState(''), searchTerm = _e[0], setSearchTerm = _e[1];
    var _f = useState('created'), sortBy = _f[0], setSortBy = _f[1];
    var _g = useState('all'), filterBy = _g[0], setFilterBy = _g[1];
    var _h = useState(false), isLoading = _h[0], setIsLoading = _h[1];
    var _j = useState('marketplace'), activeTab = _j[0], setActiveTab = _j[1];
    useEffect(function () {
        loadMarketplaceData();
        if (userAddress) {
            loadUserShares();
        }
    }, [userAddress]);
    var loadMarketplaceData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var nftsResponse, nftsData, listingsResponse, listingsData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch('/api/agents/nft/marketplace')];
                case 2:
                    nftsResponse = _a.sent();
                    return [4 /*yield*/, nftsResponse.json()];
                case 3:
                    nftsData = _a.sent();
                    setAgentNFTs(nftsData);
                    return [4 /*yield*/, fetch('/api/agents/nft/marketplace/listings')];
                case 4:
                    listingsResponse = _a.sent();
                    return [4 /*yield*/, listingsResponse.json()];
                case 5:
                    listingsData = _a.sent();
                    setMarketplaceListings(listingsData);
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    console.error('Failed to load marketplace data:', error_1);
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var loadUserShares = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, sharesData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userAddress)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/agents/nft/shares?ownerAddress=".concat(userAddress))];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    sharesData = _a.sent();
                    setUserShares(sharesData);
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error('Failed to load user shares:', error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var filteredAndSortedNFTs = React.useMemo(function () {
        return agentNFTs
            .map(function (nft) {
            var listing = marketplaceListings.find(function (l) { return l.agentNFT.id === nft.id; });
            var price = listing ? parseFloat(formatEther(listing.pricePerShare || '0')) : 0;
            var revenue = nft.revenueStreams.reduce(function (sum, stream) { return sum + parseFloat(formatEther(stream.totalRevenue || '0')); }, 0);
            return __assign(__assign({}, nft), { price: price, revenue: revenue });
        })
            .filter(function (nft) {
            var _a;
            if (searchTerm) {
                var searchLower = searchTerm.toLowerCase();
                if (!nft.agent.name.toLowerCase().includes(searchLower) &&
                    !((_a = nft.agent.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchLower))) {
                    return false;
                }
            }
            if (filterBy === 'fractionalized' && !nft.isFractionalized)
                return false;
            if (filterBy === 'available' && !marketplaceListings.some(function (l) { return l.agentNFT.id === nft.id; }))
                return false;
            return true;
        })
            .sort(function (a, b) {
            switch (sortBy) {
                case 'name':
                    return a.agent.name.localeCompare(b.agent.name);
                case 'price':
                    return b.price - a.price;
                case 'revenue':
                    return b.revenue - a.revenue;
                case 'created':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    }, [agentNFTs, marketplaceListings, searchTerm, filterBy, sortBy]);
    var MarketplaceStats = function () { return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Coins, { className: "w-5 h-5 text-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total NFTs" }), _jsx("p", { className: "text-2xl font-bold", children: agentNFTs.length })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5 text-green-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Fractionalized" }), _jsx("p", { className: "text-2xl font-bold", children: agentNFTs.filter(function (nft) { return nft.isFractionalized; }).length })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-purple-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Active Listings" }), _jsx("p", { className: "text-2xl font-bold", children: marketplaceListings.length })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Coins, { className: "w-5 h-5 text-orange-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Your Holdings" }), _jsx("p", { className: "text-2xl font-bold", children: userShares.length })] })] }) }) })] })); };
    var SearchAndFilters = function () { return (_jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-6", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" }), _jsx(Input, { placeholder: "Search agent NFTs...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "pl-10" })] }), _jsxs(Select, { value: sortBy, onValueChange: function (value) { return setSortBy(value); }, children: [_jsxs(SelectTrigger, { className: "w-[180px]", children: [_jsx(SortAsc, { className: "w-4 h-4 mr-2" }), _jsx(SelectValue, { placeholder: "Sort by" })] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "created", children: "Recently Created" }), _jsx(SelectItem, { value: "name", children: "Name A-Z" }), _jsx(SelectItem, { value: "price", children: "Price High-Low" }), _jsx(SelectItem, { value: "revenue", children: "Revenue High-Low" })] })] }), _jsxs(Select, { value: filterBy, onValueChange: function (value) { return setFilterBy(value); }, children: [_jsxs(SelectTrigger, { className: "w-[180px]", children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), _jsx(SelectValue, { placeholder: "Filter" })] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All NFTs" }), _jsx(SelectItem, { value: "fractionalized", children: "Fractionalized" }), _jsx(SelectItem, { value: "available", children: "Available for Sale" })] })] }), _jsxs(Button, { variant: "outline", onClick: loadMarketplaceData, disabled: isLoading, children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2 ".concat(isLoading ? 'animate-spin' : '') }), "Refresh"] })] })); };
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Agent NFT Marketplace" }), _jsx("p", { className: "text-muted-foreground", children: "Discover, trade, and invest in AI Agent NFTs" })] }), _jsxs(Button, { onClick: function () { return window.location.href = '/agents/new'; }, children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Agent"] })] }), _jsx(MarketplaceStats, {}), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "marketplace", children: "Marketplace" }), _jsx(TabsTrigger, { value: "portfolio", children: "My Portfolio" }), _jsx(TabsTrigger, { value: "listings", children: "Active Listings" })] }), _jsxs(TabsContent, { value: "marketplace", className: "space-y-6", children: [_jsx(SearchAndFilters, {}), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: filteredAndSortedNFTs.map(function (agentNft) { return (_jsx(AgentNFTCard, { agentNft: agentNft, userAddress: userAddress, onMintNFT: onMintNFT, onFractionalize: onFractionalize, onBuyShares: onBuyShares, onViewDetails: function (nft) { return console.log('View details:', nft); } }, agentNft.id)); }) }), filteredAndSortedNFTs.length === 0 && !isLoading && (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "No agent NFTs found matching your criteria." }) }))] }), _jsxs(TabsContent, { value: "portfolio", className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: userShares.map(function (agentNft) { return (_jsx(AgentNFTCard, { agentNft: agentNft, userAddress: userAddress, onViewDetails: function (nft) { return console.log('View details:', nft); }, onManageRevenue: function (nftId) { return console.log('Manage revenue:', nftId); } }, agentNft.id)); }) }), userShares.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-muted-foreground", children: "You don't own any agent NFT shares yet. Start by exploring the marketplace!" }), _jsx(Button, { className: "mt-4", onClick: function () { return setActiveTab('marketplace'); }, children: "Browse Marketplace" })] }))] }), _jsxs(TabsContent, { value: "listings", className: "space-y-6", children: [_jsx("div", { className: "grid gap-4", children: marketplaceListings.map(function (listing) { return (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: listing.agentNFT.agent.name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [listing.shareAmount.toLocaleString(), " shares \u2022", (listing.shareAmount / listing.agentNFT.totalShares * 100).toFixed(2), "% ownership"] })] }), _jsxs(Badge, { variant: "outline", children: ["#", listing.agentNFT.tokenId] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-lg font-bold", children: [formatEther(listing.pricePerShare), " ETH per share"] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [formatEther(listing.totalPrice), " ETH total"] })] }), _jsxs("div", { className: "flex gap-2", children: [listing.offers.length > 0 && (_jsxs(Badge, { variant: "secondary", children: [listing.offers.length, " offer(s)"] })), _jsx(Button, { onClick: function () { return onBuyShares === null || onBuyShares === void 0 ? void 0 : onBuyShares(listing.id); }, size: "sm", children: "Buy Now" })] })] }) }) }, listing.id)); }) }), marketplaceListings.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "No active listings available." }) }))] })] })] }));
};

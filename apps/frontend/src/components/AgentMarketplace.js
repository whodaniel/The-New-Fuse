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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
var BidDialog = function (_a) {
    var listing = _a.listing, onBid = _a.onBid, onClose = _a.onClose;
    var _b = useState(listing.currentBid ? listing.currentBid + 1 : listing.price), amount = _b[0], setAmount = _b[1];
    var toast = useToast().toast;
    var handleSubmit = function (e) {
        e.preventDefault();
        if (amount <= (listing.currentBid || 0)) {
            toast({
                title: 'Invalid bid amount',
                description: 'Bid must be higher than the current bid',
                variant: 'destructive',
            });
            return;
        }
        onBid(amount);
        onClose();
    };
    return (_jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Place a Bid" }) }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "amount", children: "Bid Amount" }), _jsx(Input, { id: "amount", type: "number", value: amount, onChange: function (e) { return setAmount(Number(e.target.value)); }, min: listing.currentBid ? listing.currentBid + 1 : listing.price, step: 1 })] }), _jsx(Button, { type: "submit", children: "Place Bid" })] })] }));
};
export var AgentMarketplace = function () {
    var _a = useState([]), listings = _a[0], setListings = _a[1];
    var _b = useState(null), selectedListing = _b[0], setSelectedListing = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    var toast = useToast().toast;
    var handleBid = function (amount) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!selectedListing)
                return [2 /*return*/];
            try {
                setIsLoading(true);
                toast({
                    title: 'Bid placed successfully',
                    description: "You placed a bid of ".concat(amount, " on ").concat(selectedListing.name),
                });
                setListings(listings.map(function (listing) { return listing.id === selectedListing.id
                    ? Object.assign(Object.assign({}, listing), { currentBid: amount }) : listing; }));
            }
            catch (error) {
                toast({
                    title: 'Failed to place bid',
                    description: 'An error occurred while placing your bid',
                    variant: 'destructive',
                });
            }
            finally {
                setIsLoading(false);
            }
            return [2 /*return*/];
        });
    }); };
    var handlePurchase = function (listing) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                setIsLoading(true);
                toast({
                    title: 'Purchase successful',
                    description: "You purchased ".concat(listing.name),
                });
            }
            catch (error) {
                toast({
                    title: 'Failed to purchase',
                    description: 'An error occurred while processing your purchase',
                    variant: 'destructive',
                });
            }
            finally {
                setIsLoading(false);
            }
            return [2 /*return*/];
        });
    }); };
    if (isLoading) {
        return (_jsx("div", { className: "flex h-[400px] items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin" }) }));
    }
    return (_jsxs("div", { className: "container mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Agent Marketplace" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: listings.map(function (listing) { return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { children: listing.name }), _jsx(Badge, { variant: listing.isAuction ? 'secondary' : 'default', children: listing.isAuction ? 'Auction' : 'Fixed Price' })] }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-sm text-muted-foreground mb-4", children: listing.description }), _jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: listing.capabilities.map(function (capability) { return (_jsx(Badge, { variant: "outline", children: capability }, capability)); }) }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: listing.isAuction
                                                        ? "Current Bid: ".concat(listing.currentBid || listing.price)
                                                        : "Price: ".concat(listing.price) }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Seller: ", listing.seller.name] })] }), listing.isAuction ? (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { onClick: function () { return setSelectedListing(listing); }, disabled: isLoading, children: "Place Bid" }) }), selectedListing && (_jsx(BidDialog, { listing: selectedListing, onBid: handleBid, onClose: function () { return setSelectedListing(null); } }))] })) : (_jsx(Button, { onClick: function () { return handlePurchase(listing); }, disabled: isLoading, children: "Purchase" }))] })] })] }, listing.id)); }) })] }));
};

import { JsonValue, DataMap } from './common-types.js';
export declare enum ListingType {
    SALE = "sale",
    AUCTION = "auction",
    LEASE = "lease"
}
export declare enum ListingStatus {
    ACTIVE = "active",
    SOLD = "sold",
    CANCELLED = "cancelled",
    EXPIRED = "expired"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum PaymentMethod {
    ETH = "ethereum",
    SOL = "solana",
    USDC = "usdc",
    CUSTOM_TOKEN = "custom_token"
}
export interface MarketplaceListing {
    id: string;
    agentId: string;
    sellerId: string;
    listingType: ListingType;
    price: number;
    paymentMethod: PaymentMethod;
    duration?: number;
    startTime: string;
    endTime?: string;
    minBid?: number;
    currentBid?: number;
    currentBidder?: string;
    status: ListingStatus;
    nftMetadata?: Record<string, JsonValue>;
    termsConditions?: string;
}
export interface Transaction {
    id: string;
    listingId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: TransactionStatus;
    timestamp: string;
    blockchainTxId?: string;
    escrowId?: string;
}
export interface Bid {
    id: string;
    listingId: string;
    bidderId: string;
    amount: number;
    timestamp: string;
    status: string;
}
export interface LeaseContract {
    id: string;
    listingId: string;
    lesseeId: string;
    lessorId: string;
    startDate: string;
    endDate: string;
    price: number;
    paymentSchedule: string;
    termsConditions: string;
    status: string;
}
export interface CreateListingRequest {
    agentId: string;
    listingType: ListingType;
    price: number;
    paymentMethod: PaymentMethod;
    duration?: number;
    endTime?: string;
    minBid?: number;
    termsConditions?: string;
    nftMetadata?: Record<string, JsonValue>;
}
export interface PlaceBidRequest {
    bidderId: string;
    amount: number;
}
export interface CreateLeaseRequest {
    lesseeId: string;
    startDate: string;
    endDate: string;
    paymentSchedule: string;
    termsConditions: string;
}
export interface MarketplaceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface MarketplaceStats {
    totalListings: number;
    activeSales: number;
    activeAuctions: number;
    activeLeases: number;
    totalVolume: number;
    averagePrice: number;
    popularPaymentMethods: Array<{
        method: PaymentMethod;
        count: number;
    }>;
    recentTransactions: Transaction[];
}
export interface MarketplaceItem {
    metadata: DataMap;
    config: Record<string, JsonValue>;
}
//# sourceMappingURL=marketplace.d.ts.map
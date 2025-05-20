export declare const enum ListingType {
    PRODUCT = "PRODUCT",
    SERVICE = "SERVICE",
    DIGITAL = "DIGITAL",
    SUBSCRIPTION = "SUBSCRIPTION"
}
export declare const enum ListingStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    EXPIRED = "EXPIRED",
    DELETED = "DELETED"
}
export declare const enum TransactionStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
    CANCELLED = "CANCELLED"
}
export declare const enum PaymentMethod {
    CREDIT_CARD = "CREDIT_CARD",
    DEBIT_CARD = "DEBIT_CARD",
    BANK_TRANSFER = "BANK_TRANSFER",
    DIGITAL_WALLET = "DIGITAL_WALLET",
    CRYPTO = "CRYPTO"
}
export interface Listing {
    id: string;
    title: string;
    description: string;
    type: ListingType;
    status: ListingStatus;
    price: number;
    currency: string;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}
export interface Transaction {
    id: string;
    listingId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    currency: string;
    status: TransactionStatus;
    paymentMethod: PaymentMethod;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}
export interface MarketplaceError {
    code: string;
    message: string;
    details?: Record<string, any>;
}

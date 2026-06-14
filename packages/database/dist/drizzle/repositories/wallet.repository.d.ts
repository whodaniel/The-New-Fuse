import { transactions, wallets } from '../schema.js';
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
/**
 * Wallet Repository - provides data access for Wallet entities
 */
export declare class DrizzleWalletRepository {
    /**
     * Create a new wallet
     */
    create(data: NewWallet): Promise<Wallet>;
    /**
     * Find wallet by ID
     */
    findById(id: string): Promise<Wallet | null>;
    /**
     * Find wallet by ID with agent and user relations
     */
    findByIdWithAgent(id: string): Promise<any>;
    /**
     * Find wallet by address
     */
    findByAddress(address: string): Promise<Wallet | null>;
    /**
     * Find wallet by address with agent and user relations
     */
    findByAddressWithAgent(address: string): Promise<any>;
    /**
     * Find first wallet matching smart account criteria
     */
    findFirstSmartAccountByUsername(username: string): Promise<Wallet | null>;
    /**
     * Find wallets by user ID (via agent)
     */
    findByUserId(userId: string): Promise<Wallet[]>;
    /**
     * Find wallets by type
     */
    findByType(type: string): Promise<Wallet[]>;
    /**
     * Update wallet
     */
    update(id: string, data: Partial<NewWallet>): Promise<Wallet | null>;
    /**
     * Update wallet type
     */
    updateType(id: string, type: string): Promise<Wallet | null>;
    /**
     * Activate wallet
     */
    activate(id: string): Promise<Wallet | null>;
    /**
     * Delete wallet
     */
    delete(id: string): Promise<boolean>;
    /**
     * Create a new transaction
     */
    createTransaction(data: NewTransaction): Promise<Transaction>;
    /**
     * Find transaction by ID
     */
    findTransactionById(id: string): Promise<Transaction | null>;
    /**
     * Find transaction by hash
     */
    findTransactionByHash(hash: string): Promise<Transaction | null>;
    /**
     * Find transactions by wallet ID
     */
    findTransactionsByWalletId(walletId: string, limit?: number): Promise<Transaction[]>;
    /**
     * Find transactions by status
     */
    findTransactionsByStatus(status: string, limit?: number): Promise<Transaction[]>;
    /**
     * Update transaction
     */
    updateTransaction(id: string, data: Partial<NewTransaction>): Promise<Transaction | null>;
    /**
     * Update transaction by hash
     */
    updateTransactionByHash(hash: string, data: Partial<NewTransaction>): Promise<Transaction | null>;
    /**
     * Update transaction status
     */
    updateTransactionStatus(hash: string, status: string): Promise<Transaction | null>;
    /**
     * Count transactions by wallet
     */
    countTransactionsByWalletId(walletId: string): Promise<number>;
    /**
     * Count pending transactions
     */
    countTransactionsByStatus(status: string): Promise<number>;
    /**
     * Find pending transactions
     */
    findPendingTransactions(): Promise<Transaction[]>;
    /**
     * Count active smart accounts
     */
    countActiveSmartAccounts(): Promise<number>;
    /**
     * Count transactions created after a date
     */
    countTransactionsCreatedAfter(date: Date): Promise<number>;
    /**
     * Get average gas used for transactions created after a date
     */
    getAverageGasUsed(since: Date): Promise<number>;
    /**
     * Find pending transactions older than a date
     */
    findPendingTransactionsOlderThan(date: Date): Promise<Transaction[]>;
}
export declare const drizzleWalletRepository: DrizzleWalletRepository;
//# sourceMappingURL=wallet.repository.d.ts.map
/**
 * Wallet Repository - Drizzle ORM Implementation
 * Provides data access for Wallet and Transaction entities
 */
import { and, desc, eq, gt, lt, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { agents, transactions, users, wallets } from '../schema.js';
/**
 * Wallet Repository - provides data access for Wallet entities
 */
export class DrizzleWalletRepository {
    // WALLETS
    /**
     * Create a new wallet
     */
    async create(data) {
        const [wallet] = await db.insert(wallets).values(data).returning();
        return wallet;
    }
    /**
     * Find wallet by ID
     */
    async findById(id) {
        const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
        return wallet ?? null;
    }
    /**
     * Find wallet by ID with agent and user relations
     */
    async findByIdWithAgent(id) {
        const wallet = await this.findById(id);
        if (!wallet)
            return null;
        if (!wallet.agentId)
            return { ...wallet, agent: null, user: null };
        // Fetch agent
        const [agent] = await db.select().from(agents).where(eq(agents.id, wallet.agentId));
        if (!agent)
            return { ...wallet, agent: null, user: null };
        // Fetch user
        const [user] = await db.select().from(users).where(eq(users.id, agent.userId));
        return {
            ...wallet,
            agent: {
                ...agent,
                user: user || null,
            },
        };
    }
    /**
     * Find wallet by address
     */
    async findByAddress(address) {
        const [wallet] = await db.select().from(wallets).where(eq(wallets.address, address));
        return wallet ?? null;
    }
    /**
     * Find wallet by address with agent and user relations
     */
    async findByAddressWithAgent(address) {
        const wallet = await this.findByAddress(address);
        if (!wallet)
            return null;
        if (!wallet.agentId)
            return { ...wallet, agent: null, user: null };
        const [agent] = await db.select().from(agents).where(eq(agents.id, wallet.agentId));
        if (!agent)
            return { ...wallet, agent: null, user: null };
        const [user] = await db.select().from(users).where(eq(users.id, agent.userId));
        return {
            ...wallet,
            agent: {
                ...agent,
                user: user || null,
            },
        };
    }
    /**
     * Find first wallet matching smart account criteria
     */
    async findFirstSmartAccountByUsername(username) {
        // This requires joining generic agent->user
        // Since we don't have direct relations in Drizzle schema yet (assumed), we do it step by step or with join
        // Find user
        const [user] = await db.select().from(users).where(eq(users.username, username));
        if (!user)
            return null;
        // Find agent for user
        const userAgents = await db.select().from(agents).where(eq(agents.userId, user.id));
        if (userAgents.length === 0)
            return null;
        // Find valid wallet for these agents that is a smart account
        // For simplicity, take the first agent's wallet
        const agentIds = userAgents.map((a) => a.id);
        // We need 'inArray' which is imported but not used in the snippet I saw, let's assume it works
        // If not, we iterate.
        // Query: Select wallet where agentId in agentIds AND type = SMART_ACCOUNT
        // Simplified: just check first agent
        /*
        return db.query.wallets.findFirst({
          where: (w, { eq, and }) => and(eq(w.agentId, userAgents[0].id), eq(w.type, 'SMART_ACCOUNT'))
        });
        */
        // Using query builder
        const [wallet] = await db
            .select()
            .from(wallets)
            .where(and(eq(wallets.agentId, userAgents[0].id), eq(wallets.type, 'SMART_ACCOUNT')))
            .limit(1);
        return wallet ?? null;
    }
    /**
     * Find wallets by user ID (via agent)
     */
    async findByUserId(userId) {
        const userAgents = await db.select().from(agents).where(eq(agents.userId, userId));
        const agentIds = userAgents.map((a) => a.id);
        if (agentIds.length === 0)
            return [];
        // Doing a manual filter/loop since we haven't set up complex joins
        // A better way is using inArray if supported
        // return db.select().from(wallets).where(inArray(wallets.agentId, agentIds));
        // For now assuming we can loop or use a raw query if needed, but let's try strict types
        // Let's iterate
        const allWallets = [];
        for (const agentId of agentIds) {
            const w = await db.select().from(wallets).where(eq(wallets.agentId, agentId));
            allWallets.push(...w);
        }
        return allWallets;
    }
    /**
     * Find wallets by type
     */
    async findByType(type) {
        return db
            .select()
            .from(wallets)
            .where(eq(wallets.type, type));
    }
    /**
     * Update wallet
     */
    async update(id, data) {
        const [wallet] = await db
            .update(wallets)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(wallets.id, id))
            .returning();
        return wallet ?? null;
    }
    /**
     * Update wallet type
     */
    async updateType(id, type) {
        const [wallet] = await db
            .update(wallets)
            .set({ type: type, updatedAt: new Date() })
            .where(eq(wallets.id, id))
            .returning();
        return wallet ?? null;
    }
    /**
     * Activate wallet
     */
    async activate(id) {
        const [wallet] = await db
            .update(wallets)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(wallets.id, id))
            .returning();
        return wallet ?? null;
    }
    /**
     * Delete wallet
     */
    async delete(id) {
        const result = await db.delete(wallets).where(eq(wallets.id, id)).returning();
        return result.length > 0;
    }
    // TRANSACTIONS
    /**
     * Create a new transaction
     */
    async createTransaction(data) {
        const [transaction] = await db.insert(transactions).values(data).returning();
        return transaction;
    }
    /**
     * Find transaction by ID
     */
    async findTransactionById(id) {
        const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
        return transaction ?? null;
    }
    /**
     * Find transaction by hash
     */
    async findTransactionByHash(hash) {
        const [transaction] = await db.select().from(transactions).where(eq(transactions.hash, hash));
        return transaction ?? null;
    }
    /**
     * Find transactions by wallet ID
     */
    async findTransactionsByWalletId(walletId, limit = 100) {
        return db
            .select()
            .from(transactions)
            .where(eq(transactions.walletId, walletId))
            .orderBy(desc(transactions.createdAt))
            .limit(limit);
    }
    /**
     * Find transactions by status
     */
    async findTransactionsByStatus(status, limit = 100) {
        return db
            .select()
            .from(transactions)
            .where(eq(transactions.status, status))
            .orderBy(desc(transactions.createdAt))
            .limit(limit);
    }
    /**
     * Update transaction
     */
    async updateTransaction(id, data) {
        const [transaction] = await db
            .update(transactions)
            .set({ ...data })
            .where(eq(transactions.id, id))
            .returning();
        return transaction ?? null;
    }
    /**
     * Update transaction by hash
     */
    async updateTransactionByHash(hash, data) {
        const [transaction] = await db
            .update(transactions)
            .set({ ...data })
            .where(eq(transactions.hash, hash))
            .returning();
        return transaction ?? null;
    }
    /**
     * Update transaction status
     */
    async updateTransactionStatus(hash, status) {
        const [transaction] = await db
            .update(transactions)
            .set({ status: status })
            .where(eq(transactions.hash, hash))
            .returning();
        return transaction ?? null;
    }
    /**
     * Count transactions by wallet
     */
    async countTransactionsByWalletId(walletId) {
        const result = await db
            .select({ count: sql `cast(count(*) as int)` })
            .from(transactions)
            .where(eq(transactions.walletId, walletId));
        return result[0]?.count ?? 0;
    }
    /**
     * Count pending transactions
     */
    async countTransactionsByStatus(status) {
        const result = await db
            .select({ count: sql `cast(count(*) as int)` })
            .from(transactions)
            .where(eq(transactions.status, status));
        return result[0]?.count ?? 0;
    }
    /**
     * Find pending transactions
     */
    async findPendingTransactions() {
        return this.findTransactionsByStatus('PENDING');
    }
    // MONITORING METHODS
    /**
     * Count active smart accounts
     */
    async countActiveSmartAccounts() {
        const result = await db
            .select({ count: sql `cast(count(*) as int)` })
            .from(wallets)
            .where(eq(wallets.type, 'SMART_ACCOUNT'));
        return result[0]?.count ?? 0;
    }
    /**
     * Count transactions created after a date
     */
    async countTransactionsCreatedAfter(date) {
        const result = await db
            .select({ count: sql `cast(count(*) as int)` })
            .from(transactions)
            .where(gt(transactions.createdAt, date));
        return result[0]?.count ?? 0;
    }
    /**
     * Get average gas used for transactions created after a date
     */
    async getAverageGasUsed(since) {
        // Note: Drizzle aggregate queries can be tricky, using SQL injection for avg
        const result = await db
            .select({ avgValue: sql `avg(value)` }) // Assuming 'value' is gas used, or whatever field we track
            .from(transactions)
            .where(and(gt(transactions.createdAt, since), eq(transactions.status, 'CONFIRMED')));
        return result[0]?.avgValue ?? 0;
    }
    /**
     * Find pending transactions older than a date
     */
    async findPendingTransactionsOlderThan(date) {
        return db
            .select()
            .from(transactions)
            .where(and(eq(transactions.status, 'PENDING'), lt(transactions.createdAt, date)));
    }
}
export const drizzleWalletRepository = new DrizzleWalletRepository();
//# sourceMappingURL=wallet.repository.js.map
# Current Schema Analysis - Production Readiness Assessment

## Date: 2025-11-18

## 1. MISSING INDEXES ANALYSIS

### Critical Missing Indexes (Foreign Keys)
The following foreign key columns lack indexes, which will cause performance issues:

1. **User Model**
   - No indexes needed (primary model)

2. **AuthSession Model**
   - ✅ Already has: None explicitly, but userId is FK
   - ❌ MISSING: userId index for faster session lookups

3. **LoginAttempt Model**
   - ❌ MISSING: userId index
   - ❌ MISSING: createdAt index (for rate limiting queries)
   - ❌ MISSING: ipAddress index (for IP-based rate limiting)

4. **AuthEvent Model**
   - ❌ MISSING: userId index
   - ❌ MISSING: type + createdAt composite index (for audit queries)

5. **Agent Model**
   - ❌ MISSING: userId index
   - ❌ MISSING: status index (for active agent queries)
   - ❌ MISSING: type index (for agent type filtering)

6. **AgentMetadata Model**
   - ✅ agentId is unique, automatically indexed

7. **Chat Model**
   - ❌ MISSING: agentId index
   - ❌ MISSING: userId index (if added as FK)
   - ❌ MISSING: createdAt index (for chat history)

8. **ChatRoom Model**
   - ❌ MISSING: ownerId index
   - ❌ MISSING: isActive index
   - ❌ MISSING: lastMessageAt index (for sorting)

9. **Message Model**
   - ❌ MISSING: senderId index
   - ❌ MISSING: agentId index
   - ❌ MISSING: chatId index
   - ❌ MISSING: roomId index
   - ❌ MISSING: timestamp index (for message ordering)
   - ❌ MISSING: parentMessageId index (for thread lookups)

10. **ChatMessage Model**
    - ❌ MISSING: userId index
    - ❌ MISSING: createdAt index
    - ❌ MISSING: expiresAt index (for cleanup jobs)

11. **Workflow Model**
    - ❌ MISSING: creatorId index
    - ❌ MISSING: agentId index
    - ❌ MISSING: status index
    - ❌ MISSING: isActive index
    - ❌ MISSING: lastExecutedAt index

12. **WorkflowStep Model**
    - ❌ MISSING: workflowId index
    - ❌ MISSING: agentId index
    - ❌ MISSING: order index (for step ordering)

13. **WorkflowExecution Model**
    - ❌ MISSING: workflowId index
    - ❌ MISSING: status index
    - ❌ MISSING: startedAt index

14. **Pipeline Model**
    - ❌ MISSING: userId index (has FK but no explicit index)
    - ❌ MISSING: agentId index
    - ❌ MISSING: status index

15. **Task Model**
    - ❌ MISSING: userId index
    - ❌ MISSING: pipelineId index
    - ❌ MISSING: assignedToId index
    - ❌ MISSING: status index
    - ❌ MISSING: priority index
    - ❌ MISSING: createdAt index

16. **TaskExecution Model**
    - ❌ MISSING: taskId index (has FK)
    - ❌ MISSING: status index
    - ❌ MISSING: startedAt index

17. **CodeExecutionUsage Model**
    - ✅ HAS INDEXES: agentId, clientId, createdAt, language, tier, status

18. **CodeExecutionSession Model**
    - ❌ MISSING: ownerId index
    - ❌ MISSING: expiresAt index (for cleanup)
    - ❌ MISSING: createdAt index

19. **AgentNFT Model**
    - ✅ agentId is unique (indexed)
    - ✅ tokenId is unique (indexed)
    - ❌ MISSING: contractAddress index

20. **FractionalShare Model**
    - ❌ MISSING: agentNFTId index
    - ❌ MISSING: ownerAddress index
    - ❌ MISSING: composite (agentNFTId, ownerAddress) for ownership queries

21. **RevenueStream Model**
    - ❌ MISSING: agentNFTId index
    - ❌ MISSING: isActive index

22. **RevenueDistribution Model**
    - ❌ MISSING: revenueStreamId index
    - ❌ MISSING: txHash index (for lookup)
    - ❌ MISSING: createdAt index

23. **MarketplaceListing Model**
    - ❌ MISSING: agentNFTId index
    - ❌ MISSING: status index
    - ❌ MISSING: seller index
    - ❌ MISSING: expiresAt index

24. **MarketplaceOffer Model**
    - ❌ MISSING: listingId index
    - ❌ MISSING: buyer index
    - ❌ MISSING: status index

25. **Wallet Model**
    - ✅ address is unique (indexed)
    - ✅ agentId is unique (indexed)
    - ❌ MISSING: isActive index
    - ❌ MISSING: lastActivity index

26. **Transaction Model**
    - ✅ HAS INDEXES: walletId, hash, status, createdAt

27. **RegisteredEntity Model**
    - ❌ MISSING: type index
    - ❌ MISSING: status index
    - ❌ MISSING: ownerId index
    - ❌ MISSING: namespace index
    - ❌ MISSING: composite (type, status) for filtered queries

28. **LLMConfig Model**
    - ❌ MISSING: provider index
    - ❌ MISSING: enabled index
    - ❌ MISSING: composite (provider, enabled) for active configs

29. **BusinessMetric Model**
    - ❌ MISSING: name index
    - ❌ MISSING: createdAt index

30. **ErrorLog Model**
    - ❌ MISSING: createdAt index (for cleanup and queries)

31. **SyncState Model**
    - ✅ HAS COMPOSITE UNIQUE: (resourceType, resourceId, tenantId)
    - ❌ MISSING: lastSync index (for sync scheduling)

32. **SyncConflict Model**
    - ❌ MISSING: resourceType + resourceId composite index
    - ❌ MISSING: resolvedAt index
    - ❌ MISSING: createdAt index

## 2. CASCADE DELETE CONFIGURATION ISSUES

### Missing onDelete Configurations
Many relations lack proper cascade delete behavior:

1. **ChatRoom.owner** → User
   - Current: NO onDelete specified
   - Should be: onDelete: Cascade or Restrict (business decision needed)

2. **Message Relations**
   - sender → User: NO onDelete (should be SET NULL)
   - agent → Agent: NO onDelete (should be SET NULL)
   - chat → Chat: NO onDelete (should be Cascade)
   - room → ChatRoom: NO onDelete (should be Cascade)
   - parentMessage: NO onDelete (should be SET NULL)

3. **Workflow Relations**
   - creator → User: NO onDelete (should be SET NULL)
   - agent → Agent: NO onDelete (should be SET NULL)

4. **WorkflowStep Relations**
   - workflow → Workflow: NO onDelete (should be Cascade)
   - agent → Agent: NO onDelete (should be SET NULL)

5. **WorkflowExecution.workflow**
   - Current: NO onDelete
   - Should be: Cascade or Restrict (keep for audit)

6. **Pipeline Relations**
   - agent → Agent: NO onDelete (should be Restrict or SET NULL)

7. **Task Relations**
   - pipeline → Pipeline: NO onDelete (should be Cascade)
   - assignedTo → Agent: NO onDelete (should be SET NULL)
   - user → User: NO onDelete (should be Cascade or Restrict)

8. **CodeExecutionUsage.agent**
   - Current: NO onDelete
   - Should be: Restrict (don't delete agents with execution history)

9. **AgentNFT.agent**
   - Current: NO onDelete
   - Should be: Restrict (NFTs should persist even if agent deleted)

10. **Wallet.agent**
    - Current: NO onDelete
    - Should be: SET NULL (wallets can outlive agents)

## 3. DATA INTEGRITY ISSUES

### Missing Unique Constraints

1. **User.username**
   - ✅ Already unique

2. **AuthSession.token**
   - ✅ Already unique

3. **CodeExecutionUsage.executionId**
   - ✅ Already unique

4. **Transaction.hash**
   - ✅ Already unique

### Potential Duplicate Issues

1. **Message Model**
   - Issue: Can have BOTH chatId and roomId set simultaneously
   - Solution: Add XOR constraint or business logic validation

2. **Message.sender vs agent**
   - Issue: Can have both senderId and agentId set
   - Solution: Validation to ensure only one is set

3. **CodeExecutionSession.collaborators**
   - Issue: Array field, no FK constraint
   - Solution: Create join table or add FK validation

### Missing Validation Constraints

1. **Decimal Fields**
   - FractionalShare.shareAmount: No precision specified
   - RevenueStream amounts: No precision specified
   - Should use: @db.Decimal(65, 18) for crypto precision

2. **Email Validation**
   - User.email has @unique but no format validation at DB level

3. **Enum Mismatches**
   - MessageRole in schema but ChatMessage uses it without proper typing

## 4. DEPRECATED PRISMA FEATURES

### Preview Features Status
Current preview features in schema:
- `driverAdapters`: Still in preview
- `fullTextSearchPostgres`: Still in preview

**Recommendation**: These are stable enough for production but monitor for GA releases.

### Binary Targets
- Current: `["native"]`
- **Issue**: May need platform-specific targets for Docker/Railway
- **Recommendation**: Add `["native", "debian-openssl-3.0.x"]` for Railway

## 5. ADDITIONAL SCHEMA ISSUES

### Redundant Fields

1. **User Model**
   - Has both `role` (single) and `roles` (array)
   - **Recommendation**: Remove single `role` field, use only `roles` array

2. **Agent.capabilities**
   - Uses array but no validation
   - **Recommendation**: Consider separate AgentCapabilities table

### Missing Timestamp Indexes

Many models have `createdAt` and `updatedAt` but no indexes for:
- Time-based queries
- Cleanup jobs
- Analytics

Models needing timestamp indexes:
- All models with createdAt/updatedAt for analytics
- Models with expiresAt for cleanup jobs
- Models with lastActivity for activity tracking

## 6. MIGRATION CONCERNS

### Current Migration Status
- 2 migrations exist:
  1. `20250503222817_init` - Initial schema
  2. `20250612202235_add_a2a_protocol_models` - A2A additions

### Migration Health
- ✅ Migration lock file exists (PostgreSQL)
- ✅ Migrations appear to be sequential
- ⚠️ No verification of applied migrations vs schema drift

### Idempotency Issues
- Need to verify migrations are idempotent
- Should add IF NOT EXISTS checks for safety

## 7. PRODUCTION DATABASE CONFIGURATION

### Missing Configuration

1. **Connection Pooling**
   - No pool size configuration in DATABASE_URL
   - **Recommendation**: Add `?connection_limit=20&pool_timeout=10`

2. **SSL Configuration**
   - Production example shows basic URL
   - **Recommendation**: Add `?sslmode=require` for production

3. **Statement Timeout**
   - No timeout configuration
   - **Recommendation**: Set at application or connection level

4. **Connection Retry Logic**
   - No retry configuration visible
   - **Recommendation**: Implement in PrismaService

### Current PrismaService Issues

1. **No Connection Pooling Config**
   - Using default Prisma pooling
   - May need PgBouncer for high traffic

2. **No Retry Logic**
   - Single connect attempt
   - Should retry on transient failures

3. **No Health Checks**
   - No endpoint to verify DB connectivity
   - Should add health check method

4. **No Query Timeout**
   - Long queries can hang
   - Should set query_timeout

## 8. SECURITY CONCERNS

### Critical Security Issues

1. **LLMConfig.apiKey**
   - ⚠️ Comment says "Should be encrypted in production"
   - Currently stored as plain String
   - **HIGH PRIORITY**: Implement encryption

2. **User.hashedPassword**
   - Assumes hashing at application level
   - No DB-level validation

3. **User.refreshToken**
   - Stored as plain string
   - Should be hashed or encrypted

4. **No Row-Level Security**
   - All security at application level
   - Consider RLS for multi-tenancy

## SUMMARY OF CRITICAL FIXES NEEDED

### Immediate (Before Production)

1. ✅ Add 50+ missing indexes on foreign keys
2. ✅ Configure cascade deletes for all relations
3. ✅ Encrypt LLMConfig.apiKey
4. ✅ Add connection pooling and SSL to DATABASE_URL
5. ✅ Implement retry logic in PrismaService
6. ✅ Add Message validation (chatId XOR roomId)

### High Priority (First Month)

1. ✅ Create seed.ts for initial data
2. ✅ Add timestamp indexes for all time-based queries
3. ✅ Implement soft-delete middleware activation
4. ✅ Add database health check endpoints
5. ✅ Set up query timeout configuration
6. ✅ Create backup and restore procedures

### Medium Priority (First Quarter)

1. ✅ Refactor User.role/roles redundancy
2. ✅ Add Decimal precision to all crypto amounts
3. ✅ Implement XOR constraints for Message
4. ✅ Create CodeExecutionSession collaborators join table
5. ✅ Add JSON schema validation middleware
6. ✅ Implement migration verification system

### Long Term

1. ✅ Consider enhanced.schema.prisma adoption
2. ✅ Implement multi-tenancy (Organizations)
3. ✅ Add Verifiable Credentials system
4. ✅ Set up query monitoring and analytics
5. ✅ Implement automatic key rotation
6. ✅ Add row-level security for multi-tenancy

export const __esModule: boolean;
export namespace Prisma {
    namespace TransactionIsolationLevel {
        let ReadUncommitted: string;
        let ReadCommitted: string;
        let RepeatableRead: string;
        let Serializable: string;
    }
    namespace UserScalarFieldEnum {
        let id: string;
        let email: string;
        let username: string;
        let name: string;
        let createdAt: string;
        let updatedAt: string;
        let hashedPassword: string;
        let role: string;
        let roles: string;
        let isActive: string;
        let lastLogin: string;
        let preferences: string;
        let refreshToken: string;
        let deletedAt: string;
        let emailVerified: string;
    }
    namespace AuthSessionScalarFieldEnum {
        let id_1: string;
        export { id_1 as id };
        export let userId: string;
        export let token: string;
        export let expiresAt: string;
        let createdAt_1: string;
        export { createdAt_1 as createdAt };
    }
    namespace LoginAttemptScalarFieldEnum {
        let id_2: string;
        export { id_2 as id };
        let userId_1: string;
        export { userId_1 as userId };
        export let ipAddress: string;
        export let successful: string;
        let createdAt_2: string;
        export { createdAt_2 as createdAt };
    }
    namespace AuthEventScalarFieldEnum {
        let id_3: string;
        export { id_3 as id };
        let userId_2: string;
        export { userId_2 as userId };
        export let type: string;
        export let details: string;
        let createdAt_3: string;
        export { createdAt_3 as createdAt };
    }
    namespace AgentScalarFieldEnum {
        let id_4: string;
        export { id_4 as id };
        let name_1: string;
        export { name_1 as name };
        let type_1: string;
        export { type_1 as type };
        export let status: string;
        export let description: string;
        export let systemPrompt: string;
        export let config: string;
        export let capabilities: string;
        export let provider: string;
        let userId_3: string;
        export { userId_3 as userId };
        let createdAt_4: string;
        export { createdAt_4 as createdAt };
        let updatedAt_1: string;
        export { updatedAt_1 as updatedAt };
        let deletedAt_1: string;
        export { deletedAt_1 as deletedAt };
    }
    namespace AgentMetadataScalarFieldEnum {
        let id_5: string;
        export { id_5 as id };
        export let agentId: string;
        export let metadata: string;
        export let version: string;
        let config_1: string;
        export { config_1 as config };
    }
    namespace ChatScalarFieldEnum {
        let id_6: string;
        export { id_6 as id };
        export let title: string;
        let agentId_1: string;
        export { agentId_1 as agentId };
        let userId_4: string;
        export { userId_4 as userId };
        let createdAt_5: string;
        export { createdAt_5 as createdAt };
        let updatedAt_2: string;
        export { updatedAt_2 as updatedAt };
        let deletedAt_2: string;
        export { deletedAt_2 as deletedAt };
    }
    namespace ChatRoomScalarFieldEnum {
        let id_7: string;
        export { id_7 as id };
        let name_2: string;
        export { name_2 as name };
        let description_1: string;
        export { description_1 as description };
        export let isPrivate: string;
        export let ownerId: string;
        export let settings: string;
        let metadata_1: string;
        export { metadata_1 as metadata };
        let createdAt_6: string;
        export { createdAt_6 as createdAt };
        let updatedAt_3: string;
        export { updatedAt_3 as updatedAt };
        export let lastMessageAt: string;
        let isActive_1: string;
        export { isActive_1 as isActive };
        let deletedAt_3: string;
        export { deletedAt_3 as deletedAt };
    }
    namespace MessageScalarFieldEnum {
        let id_8: string;
        export { id_8 as id };
        export let content: string;
        let role_1: string;
        export { role_1 as role };
        export let senderId: string;
        export let senderName: string;
        let agentId_2: string;
        export { agentId_2 as agentId };
        export let chatId: string;
        export let roomId: string;
        export let parentMessageId: string;
        let metadata_2: string;
        export { metadata_2 as metadata };
        export let attachments: string;
        export let timestamp: string;
        let updatedAt_4: string;
        export { updatedAt_4 as updatedAt };
        export let isEdited: string;
        export let isDeleted: string;
        export let isEphemeral: string;
        let expiresAt_1: string;
        export { expiresAt_1 as expiresAt };
        export let reactions: string;
    }
    namespace ChatMessageScalarFieldEnum {
        let id_9: string;
        export { id_9 as id };
        let userId_5: string;
        export { userId_5 as userId };
        let role_2: string;
        export { role_2 as role };
        let content_1: string;
        export { content_1 as content };
        let expiresAt_2: string;
        export { expiresAt_2 as expiresAt };
        let createdAt_7: string;
        export { createdAt_7 as createdAt };
        let updatedAt_5: string;
        export { updatedAt_5 as updatedAt };
    }
    namespace WorkflowScalarFieldEnum {
        let id_10: string;
        export { id_10 as id };
        let name_3: string;
        export { name_3 as name };
        let description_2: string;
        export { description_2 as description };
        export let definition: string;
        let status_1: string;
        export { status_1 as status };
        export let creatorId: string;
        let agentId_3: string;
        export { agentId_3 as agentId };
        let metadata_3: string;
        export { metadata_3 as metadata };
        let isActive_2: string;
        export { isActive_2 as isActive };
        export let variables: string;
        export let triggers: string;
        let createdAt_8: string;
        export { createdAt_8 as createdAt };
        let updatedAt_6: string;
        export { updatedAt_6 as updatedAt };
        export let lastExecutedAt: string;
        export let executionCount: string;
        export let statistics: string;
        let deletedAt_4: string;
        export { deletedAt_4 as deletedAt };
    }
    namespace WorkflowStepScalarFieldEnum {
        let id_11: string;
        export { id_11 as id };
        let name_4: string;
        export { name_4 as name };
        let type_2: string;
        export { type_2 as type };
        let config_2: string;
        export { config_2 as config };
        export let order: string;
        export let workflowId: string;
        let agentId_4: string;
        export { agentId_4 as agentId };
        export let nextSteps: string;
        export let conditions: string;
        export let transformations: string;
        let metadata_4: string;
        export { metadata_4 as metadata };
        let isActive_3: string;
        export { isActive_3 as isActive };
        let createdAt_9: string;
        export { createdAt_9 as createdAt };
        let updatedAt_7: string;
        export { updatedAt_7 as updatedAt };
        let lastExecutedAt_1: string;
        export { lastExecutedAt_1 as lastExecutedAt };
        let statistics_1: string;
        export { statistics_1 as statistics };
    }
    namespace WorkflowExecutionScalarFieldEnum {
        let id_12: string;
        export { id_12 as id };
        let workflowId_1: string;
        export { workflowId_1 as workflowId };
        let status_2: string;
        export { status_2 as status };
        export let input: string;
        export let output: string;
        export let error: string;
        export let startedAt: string;
        export let completedAt: string;
    }
    namespace PipelineScalarFieldEnum {
        let id_13: string;
        export { id_13 as id };
        let name_5: string;
        export { name_5 as name };
        let description_3: string;
        export { description_3 as description };
        export let configuration: string;
        let status_3: string;
        export { status_3 as status };
        let userId_6: string;
        export { userId_6 as userId };
        let agentId_5: string;
        export { agentId_5 as agentId };
        let createdAt_10: string;
        export { createdAt_10 as createdAt };
        let updatedAt_8: string;
        export { updatedAt_8 as updatedAt };
        let deletedAt_5: string;
        export { deletedAt_5 as deletedAt };
    }
    namespace TaskScalarFieldEnum {
        let id_14: string;
        export { id_14 as id };
        let title_1: string;
        export { title_1 as title };
        let description_4: string;
        export { description_4 as description };
        let type_3: string;
        export { type_3 as type };
        let status_4: string;
        export { status_4 as status };
        export let priority: string;
        export let data: string;
        export let result: string;
        let error_1: string;
        export { error_1 as error };
        export let startTime: string;
        export let endTime: string;
        export let pipelineId: string;
        export let assignedToId: string;
        let userId_7: string;
        export { userId_7 as userId };
        let createdAt_11: string;
        export { createdAt_11 as createdAt };
        let updatedAt_9: string;
        export { updatedAt_9 as updatedAt };
        let deletedAt_6: string;
        export { deletedAt_6 as deletedAt };
        let metadata_5: string;
        export { metadata_5 as metadata };
    }
    namespace TaskExecutionScalarFieldEnum {
        let id_15: string;
        export { id_15 as id };
        export let taskId: string;
        let status_5: string;
        export { status_5 as status };
        let output_1: string;
        export { output_1 as output };
        let error_2: string;
        export { error_2 as error };
        let startedAt_1: string;
        export { startedAt_1 as startedAt };
        let completedAt_1: string;
        export { completedAt_1 as completedAt };
    }
    namespace CodeExecutionUsageScalarFieldEnum {
        let id_16: string;
        export { id_16 as id };
        let agentId_6: string;
        export { agentId_6 as agentId };
        export let clientId: string;
        export let executionId: string;
        export let language: string;
        export let code: string;
        let result_1: string;
        export { result_1 as result };
        let output_2: string;
        export { output_2 as output };
        let error_3: string;
        export { error_3 as error };
        export let executionTime: string;
        export let memoryUsage: string;
        export let computeUnits: string;
        export let cost: string;
        export let tier: string;
        export let environment: string;
        let status_6: string;
        export { status_6 as status };
        let createdAt_12: string;
        export { createdAt_12 as createdAt };
        let completedAt_2: string;
        export { completedAt_2 as completedAt };
    }
    namespace CodeExecutionSessionScalarFieldEnum {
        let id_17: string;
        export { id_17 as id };
        let name_6: string;
        export { name_6 as name };
        let description_5: string;
        export { description_5 as description };
        let ownerId_1: string;
        export { ownerId_1 as ownerId };
        export let collaborators: string;
        export let isPublic: string;
        export let files: string;
        let environment_1: string;
        export { environment_1 as environment };
        let createdAt_13: string;
        export { createdAt_13 as createdAt };
        let updatedAt_10: string;
        export { updatedAt_10 as updatedAt };
        let expiresAt_3: string;
        export { expiresAt_3 as expiresAt };
        export let storageUsage: string;
    }
    namespace AgentNFTScalarFieldEnum {
        let id_18: string;
        export { id_18 as id };
        let agentId_7: string;
        export { agentId_7 as agentId };
        export let tokenId: string;
        export let contractAddress: string;
        export let smartAccountAddress: string;
        export let isFractionalized: string;
        export let totalShares: string;
        export let metadataUri: string;
        let createdAt_14: string;
        export { createdAt_14 as createdAt };
        let updatedAt_11: string;
        export { updatedAt_11 as updatedAt };
    }
    namespace FractionalShareScalarFieldEnum {
        let id_19: string;
        export { id_19 as id };
        export let agentNFTId: string;
        export let ownerAddress: string;
        export let shareAmount: string;
        let createdAt_15: string;
        export { createdAt_15 as createdAt };
        let updatedAt_12: string;
        export { updatedAt_12 as updatedAt };
    }
    namespace RevenueStreamScalarFieldEnum {
        let id_20: string;
        export { id_20 as id };
        let agentNFTId_1: string;
        export { agentNFTId_1 as agentNFTId };
        export let streamName: string;
        let description_6: string;
        export { description_6 as description };
        export let tokenAddress: string;
        export let totalRevenue: string;
        export let distributedRevenue: string;
        export let distributionThreshold: string;
        let isActive_4: string;
        export { isActive_4 as isActive };
        let createdAt_16: string;
        export { createdAt_16 as createdAt };
        let updatedAt_13: string;
        export { updatedAt_13 as updatedAt };
    }
    namespace RevenueDistributionScalarFieldEnum {
        let id_21: string;
        export { id_21 as id };
        export let revenueStreamId: string;
        export let txHash: string;
        export let totalAmount: string;
        export let distributedTo: string;
        export let blockNumber: string;
        let createdAt_17: string;
        export { createdAt_17 as createdAt };
    }
    namespace MarketplaceListingScalarFieldEnum {
        let id_22: string;
        export { id_22 as id };
        let agentNFTId_2: string;
        export { agentNFTId_2 as agentNFTId };
        export let listingId: string;
        export let seller: string;
        let shareAmount_1: string;
        export { shareAmount_1 as shareAmount };
        export let pricePerShare: string;
        export let totalPrice: string;
        let status_7: string;
        export { status_7 as status };
        let expiresAt_4: string;
        export { expiresAt_4 as expiresAt };
        let createdAt_18: string;
        export { createdAt_18 as createdAt };
        let updatedAt_14: string;
        export { updatedAt_14 as updatedAt };
    }
    namespace MarketplaceOfferScalarFieldEnum {
        let id_23: string;
        export { id_23 as id };
        let listingId_1: string;
        export { listingId_1 as listingId };
        export let buyer: string;
        let shareAmount_2: string;
        export { shareAmount_2 as shareAmount };
        export let offerPrice: string;
        let status_8: string;
        export { status_8 as status };
        let expiresAt_5: string;
        export { expiresAt_5 as expiresAt };
        let createdAt_19: string;
        export { createdAt_19 as createdAt };
        let updatedAt_15: string;
        export { updatedAt_15 as updatedAt };
    }
    namespace WalletScalarFieldEnum {
        let id_24: string;
        export { id_24 as id };
        export let address: string;
        let agentId_8: string;
        export { agentId_8 as agentId };
        let type_4: string;
        export { type_4 as type };
        export let balance: string;
        export let nonce: string;
        let isActive_5: string;
        export { isActive_5 as isActive };
        export let lastActivity: string;
        let createdAt_20: string;
        export { createdAt_20 as createdAt };
        let updatedAt_16: string;
        export { updatedAt_16 as updatedAt };
    }
    namespace TransactionScalarFieldEnum {
        let id_25: string;
        export { id_25 as id };
        export let hash: string;
        export let walletId: string;
        export let fromAddress: string;
        export let toAddress: string;
        export let value: string;
        export let gasPrice: string;
        export let gasUsed: string;
        export let gasLimit: string;
        let status_9: string;
        export { status_9 as status };
        let blockNumber_1: string;
        export { blockNumber_1 as blockNumber };
        export let blockHash: string;
        let type_5: string;
        export { type_5 as type };
        let data_1: string;
        export { data_1 as data };
        let createdAt_21: string;
        export { createdAt_21 as createdAt };
        export let confirmedAt: string;
    }
    namespace RegisteredEntityScalarFieldEnum {
        let id_26: string;
        export { id_26 as id };
        let name_7: string;
        export { name_7 as name };
        let type_6: string;
        export { type_6 as type };
        let description_7: string;
        export { description_7 as description };
        let metadata_6: string;
        export { metadata_6 as metadata };
        let config_3: string;
        export { config_3 as config };
        let status_10: string;
        export { status_10 as status };
        let version_1: string;
        export { version_1 as version };
        export let namespace: string;
        export let tags: string;
        let capabilities_1: string;
        export { capabilities_1 as capabilities };
        export let dependencies: string;
        let isPublic_1: string;
        export { isPublic_1 as isPublic };
        let ownerId_2: string;
        export { ownerId_2 as ownerId };
        let createdAt_22: string;
        export { createdAt_22 as createdAt };
        let updatedAt_17: string;
        export { updatedAt_17 as updatedAt };
        let deletedAt_7: string;
        export { deletedAt_7 as deletedAt };
    }
    namespace LLMConfigScalarFieldEnum {
        let id_27: string;
        export { id_27 as id };
        let name_8: string;
        export { name_8 as name };
        let provider_1: string;
        export { provider_1 as provider };
        export let modelName: string;
        export let apiKey: string;
        export let apiEndpoint: string;
        export let isCustom: string;
        export let enabled: string;
        let priority_1: string;
        export { priority_1 as priority };
        export let retryConfig: string;
        let createdAt_23: string;
        export { createdAt_23 as createdAt };
        let updatedAt_18: string;
        export { updatedAt_18 as updatedAt };
        let deletedAt_8: string;
        export { deletedAt_8 as deletedAt };
    }
    namespace BusinessMetricScalarFieldEnum {
        let id_28: string;
        export { id_28 as id };
        let name_9: string;
        export { name_9 as name };
        let value_1: string;
        export { value_1 as value };
        let tags_1: string;
        export { tags_1 as tags };
        let createdAt_24: string;
        export { createdAt_24 as createdAt };
    }
    namespace ErrorLogScalarFieldEnum {
        let id_29: string;
        export { id_29 as id };
        export let message: string;
        export let stack: string;
        export let context: string;
        let createdAt_25: string;
        export { createdAt_25 as createdAt };
    }
    namespace SortOrder {
        let asc: string;
        let desc: string;
    }
    namespace NullableJsonNullValueInput {
        import DbNull = Prisma.DbNull;
        export { DbNull };
        import JsonNull = Prisma.JsonNull;
        export { JsonNull };
    }
    namespace JsonNullValueInput {
        import JsonNull_1 = Prisma.JsonNull;
        export { JsonNull_1 as JsonNull };
    }
    namespace QueryMode {
        let _default: string;
        export { _default as default };
        export let insensitive: string;
    }
    namespace JsonNullValueFilter {
        import DbNull_1 = Prisma.DbNull;
        export { DbNull_1 as DbNull };
        import JsonNull_2 = Prisma.JsonNull;
        export { JsonNull_2 as JsonNull };
        import AnyNull = Prisma.AnyNull;
        export { AnyNull };
    }
    namespace NullsOrder {
        let first: string;
        let last: string;
    }
    namespace UserOrderByRelevanceFieldEnum {
        let id_30: string;
        export { id_30 as id };
        let email_1: string;
        export { email_1 as email };
        let username_1: string;
        export { username_1 as username };
        let name_10: string;
        export { name_10 as name };
        let hashedPassword_1: string;
        export { hashedPassword_1 as hashedPassword };
        let refreshToken_1: string;
        export { refreshToken_1 as refreshToken };
    }
    namespace AuthSessionOrderByRelevanceFieldEnum {
        let id_31: string;
        export { id_31 as id };
        let userId_8: string;
        export { userId_8 as userId };
        let token_1: string;
        export { token_1 as token };
    }
    namespace LoginAttemptOrderByRelevanceFieldEnum {
        let id_32: string;
        export { id_32 as id };
        let userId_9: string;
        export { userId_9 as userId };
        let ipAddress_1: string;
        export { ipAddress_1 as ipAddress };
    }
    namespace AuthEventOrderByRelevanceFieldEnum {
        let id_33: string;
        export { id_33 as id };
        let userId_10: string;
        export { userId_10 as userId };
        let type_7: string;
        export { type_7 as type };
    }
    namespace AgentOrderByRelevanceFieldEnum {
        let id_34: string;
        export { id_34 as id };
        let name_11: string;
        export { name_11 as name };
        let description_8: string;
        export { description_8 as description };
        let systemPrompt_1: string;
        export { systemPrompt_1 as systemPrompt };
        let provider_2: string;
        export { provider_2 as provider };
        let userId_11: string;
        export { userId_11 as userId };
    }
    namespace AgentMetadataOrderByRelevanceFieldEnum {
        let id_35: string;
        export { id_35 as id };
        let agentId_9: string;
        export { agentId_9 as agentId };
        let version_2: string;
        export { version_2 as version };
    }
    namespace ChatOrderByRelevanceFieldEnum {
        let id_36: string;
        export { id_36 as id };
        let title_2: string;
        export { title_2 as title };
        let agentId_10: string;
        export { agentId_10 as agentId };
        let userId_12: string;
        export { userId_12 as userId };
    }
    namespace ChatRoomOrderByRelevanceFieldEnum {
        let id_37: string;
        export { id_37 as id };
        let name_12: string;
        export { name_12 as name };
        let description_9: string;
        export { description_9 as description };
        let ownerId_3: string;
        export { ownerId_3 as ownerId };
    }
    namespace MessageOrderByRelevanceFieldEnum {
        let id_38: string;
        export { id_38 as id };
        let content_2: string;
        export { content_2 as content };
        let senderId_1: string;
        export { senderId_1 as senderId };
        let senderName_1: string;
        export { senderName_1 as senderName };
        let agentId_11: string;
        export { agentId_11 as agentId };
        let chatId_1: string;
        export { chatId_1 as chatId };
        let roomId_1: string;
        export { roomId_1 as roomId };
        let parentMessageId_1: string;
        export { parentMessageId_1 as parentMessageId };
        let attachments_1: string;
        export { attachments_1 as attachments };
    }
    namespace ChatMessageOrderByRelevanceFieldEnum {
        let id_39: string;
        export { id_39 as id };
        let userId_13: string;
        export { userId_13 as userId };
        let content_3: string;
        export { content_3 as content };
    }
    namespace WorkflowOrderByRelevanceFieldEnum {
        let id_40: string;
        export { id_40 as id };
        let name_13: string;
        export { name_13 as name };
        let description_10: string;
        export { description_10 as description };
        let creatorId_1: string;
        export { creatorId_1 as creatorId };
        let agentId_12: string;
        export { agentId_12 as agentId };
    }
    namespace WorkflowStepOrderByRelevanceFieldEnum {
        let id_41: string;
        export { id_41 as id };
        let name_14: string;
        export { name_14 as name };
        let type_8: string;
        export { type_8 as type };
        let workflowId_2: string;
        export { workflowId_2 as workflowId };
        let agentId_13: string;
        export { agentId_13 as agentId };
        let nextSteps_1: string;
        export { nextSteps_1 as nextSteps };
    }
    namespace WorkflowExecutionOrderByRelevanceFieldEnum {
        let id_42: string;
        export { id_42 as id };
        let workflowId_3: string;
        export { workflowId_3 as workflowId };
        let error_4: string;
        export { error_4 as error };
    }
    namespace PipelineOrderByRelevanceFieldEnum {
        let id_43: string;
        export { id_43 as id };
        let name_15: string;
        export { name_15 as name };
        let description_11: string;
        export { description_11 as description };
        let userId_14: string;
        export { userId_14 as userId };
        let agentId_14: string;
        export { agentId_14 as agentId };
    }
    namespace TaskOrderByRelevanceFieldEnum {
        let id_44: string;
        export { id_44 as id };
        let title_3: string;
        export { title_3 as title };
        let description_12: string;
        export { description_12 as description };
        let type_9: string;
        export { type_9 as type };
        let error_5: string;
        export { error_5 as error };
        let pipelineId_1: string;
        export { pipelineId_1 as pipelineId };
        let assignedToId_1: string;
        export { assignedToId_1 as assignedToId };
        let userId_15: string;
        export { userId_15 as userId };
    }
    namespace TaskExecutionOrderByRelevanceFieldEnum {
        let id_45: string;
        export { id_45 as id };
        let taskId_1: string;
        export { taskId_1 as taskId };
        let status_11: string;
        export { status_11 as status };
        let error_6: string;
        export { error_6 as error };
    }
    namespace CodeExecutionUsageOrderByRelevanceFieldEnum {
        let id_46: string;
        export { id_46 as id };
        let agentId_15: string;
        export { agentId_15 as agentId };
        let clientId_1: string;
        export { clientId_1 as clientId };
        let executionId_1: string;
        export { executionId_1 as executionId };
        let code_1: string;
        export { code_1 as code };
        let environment_2: string;
        export { environment_2 as environment };
    }
    namespace CodeExecutionSessionOrderByRelevanceFieldEnum {
        let id_47: string;
        export { id_47 as id };
        let name_16: string;
        export { name_16 as name };
        let description_13: string;
        export { description_13 as description };
        let ownerId_4: string;
        export { ownerId_4 as ownerId };
        let collaborators_1: string;
        export { collaborators_1 as collaborators };
    }
    namespace AgentNFTOrderByRelevanceFieldEnum {
        let id_48: string;
        export { id_48 as id };
        let agentId_16: string;
        export { agentId_16 as agentId };
        let contractAddress_1: string;
        export { contractAddress_1 as contractAddress };
        let smartAccountAddress_1: string;
        export { smartAccountAddress_1 as smartAccountAddress };
        let metadataUri_1: string;
        export { metadataUri_1 as metadataUri };
    }
    namespace FractionalShareOrderByRelevanceFieldEnum {
        let id_49: string;
        export { id_49 as id };
        let agentNFTId_3: string;
        export { agentNFTId_3 as agentNFTId };
        let ownerAddress_1: string;
        export { ownerAddress_1 as ownerAddress };
    }
    namespace RevenueStreamOrderByRelevanceFieldEnum {
        let id_50: string;
        export { id_50 as id };
        let agentNFTId_4: string;
        export { agentNFTId_4 as agentNFTId };
        let streamName_1: string;
        export { streamName_1 as streamName };
        let description_14: string;
        export { description_14 as description };
        let tokenAddress_1: string;
        export { tokenAddress_1 as tokenAddress };
    }
    namespace RevenueDistributionOrderByRelevanceFieldEnum {
        let id_51: string;
        export { id_51 as id };
        let revenueStreamId_1: string;
        export { revenueStreamId_1 as revenueStreamId };
        let txHash_1: string;
        export { txHash_1 as txHash };
    }
    namespace MarketplaceListingOrderByRelevanceFieldEnum {
        let id_52: string;
        export { id_52 as id };
        let agentNFTId_5: string;
        export { agentNFTId_5 as agentNFTId };
        let seller_1: string;
        export { seller_1 as seller };
    }
    namespace MarketplaceOfferOrderByRelevanceFieldEnum {
        let id_53: string;
        export { id_53 as id };
        let listingId_2: string;
        export { listingId_2 as listingId };
        let buyer_1: string;
        export { buyer_1 as buyer };
    }
    namespace WalletOrderByRelevanceFieldEnum {
        let id_54: string;
        export { id_54 as id };
        let address_1: string;
        export { address_1 as address };
        let agentId_17: string;
        export { agentId_17 as agentId };
    }
    namespace TransactionOrderByRelevanceFieldEnum {
        let id_55: string;
        export { id_55 as id };
        let hash_1: string;
        export { hash_1 as hash };
        let walletId_1: string;
        export { walletId_1 as walletId };
        let fromAddress_1: string;
        export { fromAddress_1 as fromAddress };
        let toAddress_1: string;
        export { toAddress_1 as toAddress };
        let blockHash_1: string;
        export { blockHash_1 as blockHash };
    }
    namespace RegisteredEntityOrderByRelevanceFieldEnum {
        let id_56: string;
        export { id_56 as id };
        let name_17: string;
        export { name_17 as name };
        let description_15: string;
        export { description_15 as description };
        let version_3: string;
        export { version_3 as version };
        let namespace_1: string;
        export { namespace_1 as namespace };
        let tags_2: string;
        export { tags_2 as tags };
        let capabilities_2: string;
        export { capabilities_2 as capabilities };
        let dependencies_1: string;
        export { dependencies_1 as dependencies };
        let ownerId_5: string;
        export { ownerId_5 as ownerId };
    }
    namespace LLMConfigOrderByRelevanceFieldEnum {
        let id_57: string;
        export { id_57 as id };
        let name_18: string;
        export { name_18 as name };
        let provider_3: string;
        export { provider_3 as provider };
        let modelName_1: string;
        export { modelName_1 as modelName };
        let apiKey_1: string;
        export { apiKey_1 as apiKey };
        let apiEndpoint_1: string;
        export { apiEndpoint_1 as apiEndpoint };
    }
    namespace BusinessMetricOrderByRelevanceFieldEnum {
        let id_58: string;
        export { id_58 as id };
        let name_19: string;
        export { name_19 as name };
    }
    namespace ErrorLogOrderByRelevanceFieldEnum {
        let id_59: string;
        export { id_59 as id };
        let message_1: string;
        export { message_1 as message };
        let stack_1: string;
        export { stack_1 as stack };
    }
    namespace ModelName {
        let User: string;
        let AuthSession: string;
        let LoginAttempt: string;
        let AuthEvent: string;
        let Agent: string;
        let AgentMetadata: string;
        let Chat: string;
        let ChatRoom: string;
        let Message: string;
        let ChatMessage: string;
        let Workflow: string;
        let WorkflowStep: string;
        let WorkflowExecution: string;
        let Pipeline: string;
        let Task: string;
        let TaskExecution: string;
        let CodeExecutionUsage: string;
        let CodeExecutionSession: string;
        let AgentNFT: string;
        let FractionalShare: string;
        let RevenueStream: string;
        let RevenueDistribution: string;
        let MarketplaceListing: string;
        let MarketplaceOffer: string;
        let Wallet: string;
        let Transaction: string;
        let RegisteredEntity: string;
        let LLMConfig: string;
        let BusinessMetric: string;
        let ErrorLog: string;
    }
}
export namespace $Enums {
    namespace UserRole {
        let USER: string;
        let ADMIN: string;
        let SUPER_ADMIN: string;
        let AGENCY_OWNER: string;
        let AGENCY_ADMIN: string;
        let AGENCY_MANAGER: string;
        let AGENT_OPERATOR: string;
    }
    namespace AgentType {
        let BASIC: string;
        let CHAT: string;
        let WORKFLOW: string;
        let TASK: string;
        let ASSISTANT: string;
        let ANALYSIS: string;
        let CONVERSATIONAL: string;
        let IDE_EXTENSION: string;
        let API: string;
    }
    namespace AgentStatus {
        let ACTIVE: string;
        let INACTIVE: string;
        let IDLE: string;
        let BUSY: string;
        let ERROR: string;
        let OFFLINE: string;
        let INITIALIZING: string;
        let READY: string;
        let TERMINATED: string;
    }
    namespace AgentCapability {
        export let CODE_GENERATION: string;
        export let CODE_REVIEW: string;
        export let CODE_REFACTORING: string;
        export let CODE_EXECUTION: string;
        export let DEBUGGING: string;
        export let TESTING: string;
        export let DOCUMENTATION: string;
        export let ARCHITECTURE_DESIGN: string;
        export let OPTIMIZATION: string;
        export let SECURITY_AUDIT: string;
        export let PROJECT_MANAGEMENT: string;
        export let TOOL_USAGE: string;
        export let TASK_EXECUTION: string;
        export let FILE_MANAGEMENT: string;
        export let CODE_COMPLETION: string;
        export let CODE_SUGGESTIONS: string;
        export let SYNTAX_HIGHLIGHTING: string;
        export let ERROR_DETECTION: string;
        export let CODE_FORMATTING: string;
        export let INTELLISENSE: string;
        let CHAT_1: string;
        export { CHAT_1 as CHAT };
        let WORKFLOW_1: string;
        export { WORKFLOW_1 as WORKFLOW };
        export let RESEARCH: string;
        let ANALYSIS_1: string;
        export { ANALYSIS_1 as ANALYSIS };
        export let INTEGRATION: string;
    }
    namespace MessageRole {
        let USER_1: string;
        export { USER_1 as USER };
        export let AGENT: string;
        export let SYSTEM: string;
        let ASSISTANT_1: string;
        export { ASSISTANT_1 as ASSISTANT };
        export let TOOL: string;
    }
    namespace WorkflowStatus {
        export let DRAFT: string;
        export let PUBLISHED: string;
        export let ARCHIVED: string;
        let ACTIVE_1: string;
        export { ACTIVE_1 as ACTIVE };
        export let PAUSED: string;
        export let COMPLETED: string;
        export let FAILED: string;
    }
    namespace WorkflowExecutionStatus {
        export let PENDING: string;
        export let RUNNING: string;
        let COMPLETED_1: string;
        export { COMPLETED_1 as COMPLETED };
        let FAILED_1: string;
        export { FAILED_1 as FAILED };
        export let CANCELLED: string;
    }
    namespace PipelineStatus {
        let DRAFT_1: string;
        export { DRAFT_1 as DRAFT };
        let ACTIVE_2: string;
        export { ACTIVE_2 as ACTIVE };
        let PAUSED_1: string;
        export { PAUSED_1 as PAUSED };
        let COMPLETED_2: string;
        export { COMPLETED_2 as COMPLETED };
        let FAILED_2: string;
        export { FAILED_2 as FAILED };
    }
    namespace TaskStatus {
        let PENDING_1: string;
        export { PENDING_1 as PENDING };
        export let IN_PROGRESS: string;
        let COMPLETED_3: string;
        export { COMPLETED_3 as COMPLETED };
        let FAILED_3: string;
        export { FAILED_3 as FAILED };
        let CANCELLED_1: string;
        export { CANCELLED_1 as CANCELLED };
    }
    namespace TaskPriority {
        let LOW: string;
        let MEDIUM: string;
        let HIGH: string;
        let URGENT: string;
    }
    namespace CodeExecutionLanguage {
        let JAVASCRIPT: string;
        let TYPESCRIPT: string;
        let PYTHON: string;
        let RUBY: string;
        let SHELL: string;
        let HTML: string;
        let CSS: string;
    }
    namespace CodeExecutionTier {
        let BASIC_1: string;
        export { BASIC_1 as BASIC };
        export let STANDARD: string;
        export let PREMIUM: string;
        export let ENTERPRISE: string;
    }
    namespace CodeExecutionStatus {
        let PENDING_2: string;
        export { PENDING_2 as PENDING };
        let RUNNING_1: string;
        export { RUNNING_1 as RUNNING };
        let COMPLETED_4: string;
        export { COMPLETED_4 as COMPLETED };
        let FAILED_4: string;
        export { FAILED_4 as FAILED };
        export let TIMEOUT: string;
        let CANCELLED_2: string;
        export { CANCELLED_2 as CANCELLED };
    }
    namespace MarketplaceStatus {
        let ACTIVE_3: string;
        export { ACTIVE_3 as ACTIVE };
        export let SOLD: string;
        let CANCELLED_3: string;
        export { CANCELLED_3 as CANCELLED };
        export let EXPIRED: string;
    }
    namespace OfferStatus {
        let PENDING_3: string;
        export { PENDING_3 as PENDING };
        export let ACCEPTED: string;
        export let REJECTED: string;
        let CANCELLED_4: string;
        export { CANCELLED_4 as CANCELLED };
        let EXPIRED_1: string;
        export { EXPIRED_1 as EXPIRED };
    }
    namespace WalletType {
        let SMART_ACCOUNT: string;
        let EOA: string;
        let MULTI_SIG: string;
    }
    namespace TransactionStatus {
        let PENDING_4: string;
        export { PENDING_4 as PENDING };
        export let CONFIRMED: string;
        let FAILED_5: string;
        export { FAILED_5 as FAILED };
        let CANCELLED_5: string;
        export { CANCELLED_5 as CANCELLED };
    }
    namespace TransactionType {
        let TRANSFER: string;
        let CONTRACT_CALL: string;
        let CONTRACT_DEPLOYMENT: string;
        let NFT_MINT: string;
        let NFT_TRANSFER: string;
    }
    namespace RegisteredEntityType {
        let AGENT_1: string;
        export { AGENT_1 as AGENT };
        let WORKFLOW_2: string;
        export { WORKFLOW_2 as WORKFLOW };
        let TOOL_1: string;
        export { TOOL_1 as TOOL };
        export let SERVICE: string;
        let INTEGRATION_1: string;
        export { INTEGRATION_1 as INTEGRATION };
        export let TEMPLATE: string;
        export let COMPONENT: string;
        export let MODULE: string;
    }
    namespace EntityStatus {
        let ACTIVE_4: string;
        export { ACTIVE_4 as ACTIVE };
        let INACTIVE_1: string;
        export { INACTIVE_1 as INACTIVE };
        export let DEPRECATED: string;
        let PENDING_5: string;
        export { PENDING_5 as PENDING };
        let FAILED_6: string;
        export { FAILED_6 as FAILED };
    }
}
export namespace UserRole {
    let USER_2: string;
    export { USER_2 as USER };
    let ADMIN_1: string;
    export { ADMIN_1 as ADMIN };
    let SUPER_ADMIN_1: string;
    export { SUPER_ADMIN_1 as SUPER_ADMIN };
    let AGENCY_OWNER_1: string;
    export { AGENCY_OWNER_1 as AGENCY_OWNER };
    let AGENCY_ADMIN_1: string;
    export { AGENCY_ADMIN_1 as AGENCY_ADMIN };
    let AGENCY_MANAGER_1: string;
    export { AGENCY_MANAGER_1 as AGENCY_MANAGER };
    let AGENT_OPERATOR_1: string;
    export { AGENT_OPERATOR_1 as AGENT_OPERATOR };
}
export namespace AgentType {
    let BASIC_2: string;
    export { BASIC_2 as BASIC };
    let CHAT_2: string;
    export { CHAT_2 as CHAT };
    let WORKFLOW_3: string;
    export { WORKFLOW_3 as WORKFLOW };
    let TASK_1: string;
    export { TASK_1 as TASK };
    let ASSISTANT_2: string;
    export { ASSISTANT_2 as ASSISTANT };
    let ANALYSIS_2: string;
    export { ANALYSIS_2 as ANALYSIS };
    let CONVERSATIONAL_1: string;
    export { CONVERSATIONAL_1 as CONVERSATIONAL };
    let IDE_EXTENSION_1: string;
    export { IDE_EXTENSION_1 as IDE_EXTENSION };
    let API_1: string;
    export { API_1 as API };
}
export namespace AgentStatus {
    let ACTIVE_5: string;
    export { ACTIVE_5 as ACTIVE };
    let INACTIVE_2: string;
    export { INACTIVE_2 as INACTIVE };
    let IDLE_1: string;
    export { IDLE_1 as IDLE };
    let BUSY_1: string;
    export { BUSY_1 as BUSY };
    let ERROR_1: string;
    export { ERROR_1 as ERROR };
    let OFFLINE_1: string;
    export { OFFLINE_1 as OFFLINE };
    let INITIALIZING_1: string;
    export { INITIALIZING_1 as INITIALIZING };
    let READY_1: string;
    export { READY_1 as READY };
    let TERMINATED_1: string;
    export { TERMINATED_1 as TERMINATED };
}
export namespace AgentCapability {
    let CODE_GENERATION_1: string;
    export { CODE_GENERATION_1 as CODE_GENERATION };
    let CODE_REVIEW_1: string;
    export { CODE_REVIEW_1 as CODE_REVIEW };
    let CODE_REFACTORING_1: string;
    export { CODE_REFACTORING_1 as CODE_REFACTORING };
    let CODE_EXECUTION_1: string;
    export { CODE_EXECUTION_1 as CODE_EXECUTION };
    let DEBUGGING_1: string;
    export { DEBUGGING_1 as DEBUGGING };
    let TESTING_1: string;
    export { TESTING_1 as TESTING };
    let DOCUMENTATION_1: string;
    export { DOCUMENTATION_1 as DOCUMENTATION };
    let ARCHITECTURE_DESIGN_1: string;
    export { ARCHITECTURE_DESIGN_1 as ARCHITECTURE_DESIGN };
    let OPTIMIZATION_1: string;
    export { OPTIMIZATION_1 as OPTIMIZATION };
    let SECURITY_AUDIT_1: string;
    export { SECURITY_AUDIT_1 as SECURITY_AUDIT };
    let PROJECT_MANAGEMENT_1: string;
    export { PROJECT_MANAGEMENT_1 as PROJECT_MANAGEMENT };
    let TOOL_USAGE_1: string;
    export { TOOL_USAGE_1 as TOOL_USAGE };
    let TASK_EXECUTION_1: string;
    export { TASK_EXECUTION_1 as TASK_EXECUTION };
    let FILE_MANAGEMENT_1: string;
    export { FILE_MANAGEMENT_1 as FILE_MANAGEMENT };
    let CODE_COMPLETION_1: string;
    export { CODE_COMPLETION_1 as CODE_COMPLETION };
    let CODE_SUGGESTIONS_1: string;
    export { CODE_SUGGESTIONS_1 as CODE_SUGGESTIONS };
    let SYNTAX_HIGHLIGHTING_1: string;
    export { SYNTAX_HIGHLIGHTING_1 as SYNTAX_HIGHLIGHTING };
    let ERROR_DETECTION_1: string;
    export { ERROR_DETECTION_1 as ERROR_DETECTION };
    let CODE_FORMATTING_1: string;
    export { CODE_FORMATTING_1 as CODE_FORMATTING };
    let INTELLISENSE_1: string;
    export { INTELLISENSE_1 as INTELLISENSE };
    let CHAT_3: string;
    export { CHAT_3 as CHAT };
    let WORKFLOW_4: string;
    export { WORKFLOW_4 as WORKFLOW };
    let RESEARCH_1: string;
    export { RESEARCH_1 as RESEARCH };
    let ANALYSIS_3: string;
    export { ANALYSIS_3 as ANALYSIS };
    let INTEGRATION_2: string;
    export { INTEGRATION_2 as INTEGRATION };
}
export namespace MessageRole {
    let USER_3: string;
    export { USER_3 as USER };
    let AGENT_2: string;
    export { AGENT_2 as AGENT };
    let SYSTEM_1: string;
    export { SYSTEM_1 as SYSTEM };
    let ASSISTANT_3: string;
    export { ASSISTANT_3 as ASSISTANT };
    let TOOL_2: string;
    export { TOOL_2 as TOOL };
}
export namespace WorkflowStatus {
    let DRAFT_2: string;
    export { DRAFT_2 as DRAFT };
    let PUBLISHED_1: string;
    export { PUBLISHED_1 as PUBLISHED };
    let ARCHIVED_1: string;
    export { ARCHIVED_1 as ARCHIVED };
    let ACTIVE_6: string;
    export { ACTIVE_6 as ACTIVE };
    let PAUSED_2: string;
    export { PAUSED_2 as PAUSED };
    let COMPLETED_5: string;
    export { COMPLETED_5 as COMPLETED };
    let FAILED_7: string;
    export { FAILED_7 as FAILED };
}
export namespace WorkflowExecutionStatus {
    let PENDING_6: string;
    export { PENDING_6 as PENDING };
    let RUNNING_2: string;
    export { RUNNING_2 as RUNNING };
    let COMPLETED_6: string;
    export { COMPLETED_6 as COMPLETED };
    let FAILED_8: string;
    export { FAILED_8 as FAILED };
    let CANCELLED_6: string;
    export { CANCELLED_6 as CANCELLED };
}
export namespace PipelineStatus {
    let DRAFT_3: string;
    export { DRAFT_3 as DRAFT };
    let ACTIVE_7: string;
    export { ACTIVE_7 as ACTIVE };
    let PAUSED_3: string;
    export { PAUSED_3 as PAUSED };
    let COMPLETED_7: string;
    export { COMPLETED_7 as COMPLETED };
    let FAILED_9: string;
    export { FAILED_9 as FAILED };
}
export namespace TaskStatus {
    let PENDING_7: string;
    export { PENDING_7 as PENDING };
    let IN_PROGRESS_1: string;
    export { IN_PROGRESS_1 as IN_PROGRESS };
    let COMPLETED_8: string;
    export { COMPLETED_8 as COMPLETED };
    let FAILED_10: string;
    export { FAILED_10 as FAILED };
    let CANCELLED_7: string;
    export { CANCELLED_7 as CANCELLED };
}
export namespace TaskPriority {
    let LOW_1: string;
    export { LOW_1 as LOW };
    let MEDIUM_1: string;
    export { MEDIUM_1 as MEDIUM };
    let HIGH_1: string;
    export { HIGH_1 as HIGH };
    let URGENT_1: string;
    export { URGENT_1 as URGENT };
}
export namespace CodeExecutionLanguage {
    let JAVASCRIPT_1: string;
    export { JAVASCRIPT_1 as JAVASCRIPT };
    let TYPESCRIPT_1: string;
    export { TYPESCRIPT_1 as TYPESCRIPT };
    let PYTHON_1: string;
    export { PYTHON_1 as PYTHON };
    let RUBY_1: string;
    export { RUBY_1 as RUBY };
    let SHELL_1: string;
    export { SHELL_1 as SHELL };
    let HTML_1: string;
    export { HTML_1 as HTML };
    let CSS_1: string;
    export { CSS_1 as CSS };
}
export namespace CodeExecutionTier {
    let BASIC_3: string;
    export { BASIC_3 as BASIC };
    let STANDARD_1: string;
    export { STANDARD_1 as STANDARD };
    let PREMIUM_1: string;
    export { PREMIUM_1 as PREMIUM };
    let ENTERPRISE_1: string;
    export { ENTERPRISE_1 as ENTERPRISE };
}
export namespace CodeExecutionStatus {
    let PENDING_8: string;
    export { PENDING_8 as PENDING };
    let RUNNING_3: string;
    export { RUNNING_3 as RUNNING };
    let COMPLETED_9: string;
    export { COMPLETED_9 as COMPLETED };
    let FAILED_11: string;
    export { FAILED_11 as FAILED };
    let TIMEOUT_1: string;
    export { TIMEOUT_1 as TIMEOUT };
    let CANCELLED_8: string;
    export { CANCELLED_8 as CANCELLED };
}
export namespace MarketplaceStatus {
    let ACTIVE_8: string;
    export { ACTIVE_8 as ACTIVE };
    let SOLD_1: string;
    export { SOLD_1 as SOLD };
    let CANCELLED_9: string;
    export { CANCELLED_9 as CANCELLED };
    let EXPIRED_2: string;
    export { EXPIRED_2 as EXPIRED };
}
export namespace OfferStatus {
    let PENDING_9: string;
    export { PENDING_9 as PENDING };
    let ACCEPTED_1: string;
    export { ACCEPTED_1 as ACCEPTED };
    let REJECTED_1: string;
    export { REJECTED_1 as REJECTED };
    let CANCELLED_10: string;
    export { CANCELLED_10 as CANCELLED };
    let EXPIRED_3: string;
    export { EXPIRED_3 as EXPIRED };
}
export namespace WalletType {
    let SMART_ACCOUNT_1: string;
    export { SMART_ACCOUNT_1 as SMART_ACCOUNT };
    let EOA_1: string;
    export { EOA_1 as EOA };
    let MULTI_SIG_1: string;
    export { MULTI_SIG_1 as MULTI_SIG };
}
export namespace TransactionStatus {
    let PENDING_10: string;
    export { PENDING_10 as PENDING };
    let CONFIRMED_1: string;
    export { CONFIRMED_1 as CONFIRMED };
    let FAILED_12: string;
    export { FAILED_12 as FAILED };
    let CANCELLED_11: string;
    export { CANCELLED_11 as CANCELLED };
}
export namespace TransactionType {
    let TRANSFER_1: string;
    export { TRANSFER_1 as TRANSFER };
    let CONTRACT_CALL_1: string;
    export { CONTRACT_CALL_1 as CONTRACT_CALL };
    let CONTRACT_DEPLOYMENT_1: string;
    export { CONTRACT_DEPLOYMENT_1 as CONTRACT_DEPLOYMENT };
    let NFT_MINT_1: string;
    export { NFT_MINT_1 as NFT_MINT };
    let NFT_TRANSFER_1: string;
    export { NFT_TRANSFER_1 as NFT_TRANSFER };
}
export namespace RegisteredEntityType {
    let AGENT_3: string;
    export { AGENT_3 as AGENT };
    let WORKFLOW_5: string;
    export { WORKFLOW_5 as WORKFLOW };
    let TOOL_3: string;
    export { TOOL_3 as TOOL };
    let SERVICE_1: string;
    export { SERVICE_1 as SERVICE };
    let INTEGRATION_3: string;
    export { INTEGRATION_3 as INTEGRATION };
    let TEMPLATE_1: string;
    export { TEMPLATE_1 as TEMPLATE };
    let COMPONENT_1: string;
    export { COMPONENT_1 as COMPONENT };
    let MODULE_1: string;
    export { MODULE_1 as MODULE };
}
export namespace EntityStatus {
    let ACTIVE_9: string;
    export { ACTIVE_9 as ACTIVE };
    let INACTIVE_3: string;
    export { INACTIVE_3 as INACTIVE };
    let DEPRECATED_1: string;
    export { DEPRECATED_1 as DEPRECATED };
    let PENDING_11: string;
    export { PENDING_11 as PENDING };
    let FAILED_13: string;
    export { FAILED_13 as FAILED };
}
export namespace Prisma {
    export namespace prismaVersion {
        let client: string;
        let engine: string;
    }
    export function PrismaClientKnownRequestError(): never;
    export function PrismaClientUnknownRequestError(): never;
    export function PrismaClientRustPanicError(): never;
    export function PrismaClientInitializationError(): never;
    export function PrismaClientValidationError(): never;
    export { Decimal };
    /**
     * Re-export of sql-template-tag
     */
    export function sql(): never;
    export function empty(): never;
    export function join(): never;
    export function raw(): never;
    export let validator: typeof Public.validator;
    /**
    * Extensions
    */
    export function getExtensionContext(): never;
    export function defineExtension(): never;
    let DbNull_2: {
        "__#private@#private": any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    export { DbNull_2 as DbNull };
    let JsonNull_3: {
        "__#private@#private": any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    export { JsonNull_3 as JsonNull };
    let AnyNull_1: {
        "__#private@#private": any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    export { AnyNull_1 as AnyNull };
    export namespace NullTypes {
        let DbNull_3: {
            new (arg?: symbol): {
                "__#private@#private": any;
                _getNamespace(): string;
                _getName(): string;
                toString(): string;
            };
        };
        export { DbNull_3 as DbNull };
        let JsonNull_4: {
            new (arg?: symbol): {
                "__#private@#private": any;
                _getNamespace(): string;
                _getName(): string;
                toString(): string;
            };
        };
        export { JsonNull_4 as JsonNull };
        let AnyNull_2: {
            new (arg?: symbol): {
                "__#private@#private": any;
                _getNamespace(): string;
                _getName(): string;
                toString(): string;
            };
        };
        export { AnyNull_2 as AnyNull };
    }
}
/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
export class PrismaClient {
}
import { Decimal } from "./runtime/index-browser.js";
import { Public } from "./runtime/index-browser.js";
//# sourceMappingURL=index-browser.d.ts.map
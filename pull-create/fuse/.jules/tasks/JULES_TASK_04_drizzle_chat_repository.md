<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". We are migrating from
Drizzle 7 to Drizzle ORM. The foundation has been laid in
packages/database/src/drizzle/.

Key files to reference:

- packages/database/src/drizzle/repositories/agent.repository.ts (example
  pattern)
- packages/database/src/drizzle/schema/chat.ts (chat schema)
- packages/database/src/drizzle/types.ts (type exports)
- packages/database/src/repositories/chat-message.repository.ts (existing Drizzle
  repository) </workspace_context> <mission_brief>

## Task: Create Drizzle Chat & Message Repositories

Create Drizzle-based ChatRepository and MessageRepository for the messaging
system.

### Steps:

1. Create `packages/database/src/drizzle/repositories/chat.repository.ts`
2. Implement ChatRepository methods:
   - `create(data: NewChat): Promise<Chat>`
   - `findById(id: string): Promise<Chat | null>`
   - `findByAgentId(agentId: string): Promise<Chat[]>`
   - `findWithMessages(id: string, limit?: number): Promise<Chat & { messages: Message[] } | null>`
   - `softDelete(id: string): Promise<boolean>`
3. Create `packages/database/src/drizzle/repositories/message.repository.ts`
4. Implement MessageRepository methods:
   - `create(data: NewMessage): Promise<Message>`
   - `findById(id: string): Promise<Message | null>`
   - `findByChatId(chatId: string, options?: { limit?: number; before?: Date }): Promise<Message[]>`
   - `findByRoomId(roomId: string, options?: { limit?: number }): Promise<Message[]>`
   - `findReplies(parentMessageId: string): Promise<Message[]>`
   - `update(id: string, data: Partial<NewMessage>): Promise<Message | null>`
   - `markAsDeleted(id: string): Promise<boolean>`
   - `addReaction(id: string, reaction: object): Promise<boolean>`
5. Export both from `packages/database/src/drizzle/repositories/index.ts`

### Success Criteria:

- Both repositories compile without errors
- Message threading (replies) properly handled
- Pagination support for message queries </mission_brief>

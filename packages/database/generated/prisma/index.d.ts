
/**
 * Client
**/

import * as runtime from './runtime/library';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions

export type PrismaPromise<T> = $Public.PrismaPromise<T>


export type TaskPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "Task"
  objects: {}
  scalars: $Extensions.GetResult<{
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    type: string
    createdAt: Date
    updatedAt: Date
    dueDate: Date | null
    assignedTo: string | null
    createdBy: string
    metadata: Prisma.JsonValue | null
    tags: string[]
    dependencies: string[]
    error: string | null
    completedAt: Date | null
  }, ExtArgs["result"]["task"]>
  composites: {}
}

/**
 * Model Task
 * 
 */
export type Task = runtime.Types.DefaultSelection<TaskPayload>
export type AgentPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "Agent"
  objects: {
    user: UserPayload<ExtArgs> | null
  }
  scalars: $Extensions.GetResult<{
    id: string
    name: string
    description: string | null
    type: AgentType
    status: AgentStatus
    capabilities: string[]
    provider: string
    lastActive: Date
    metadata: Prisma.JsonValue | null
    createdAt: Date
    updatedAt: Date
    userId: string | null
  }, ExtArgs["result"]["agent"]>
  composites: {}
}

/**
 * Model Agent
 * 
 */
export type Agent = runtime.Types.DefaultSelection<AgentPayload>
export type RegisteredEntityPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "RegisteredEntity"
  objects: {}
  scalars: $Extensions.GetResult<{
    id: string
    name: string
    type: string
    description: string | null
    metadata: Prisma.JsonValue | null
    status: EntityStatus
    createdAt: Date
    updatedAt: Date
  }, ExtArgs["result"]["registeredEntity"]>
  composites: {}
}

/**
 * Model RegisteredEntity
 * 
 */
export type RegisteredEntity = runtime.Types.DefaultSelection<RegisteredEntityPayload>
export type UserPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "User"
  objects: {
    agents: AgentPayload<ExtArgs>[]
    chatMessages: ChatMessagePayload<ExtArgs>[]
  }
  scalars: $Extensions.GetResult<{
    id: string
    email: string
    name: string | null
    passwordHash: string
    role: UserRole
    createdAt: Date
    updatedAt: Date
  }, ExtArgs["result"]["user"]>
  composites: {}
}

/**
 * Model User
 * 
 */
export type User = runtime.Types.DefaultSelection<UserPayload>
export type ChatMessagePayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "ChatMessage"
  objects: {
    user: UserPayload<ExtArgs>
  }
  scalars: $Extensions.GetResult<{
    id: string
    content: string
    role: string
    userId: string
    sessionId: string | null
    metadata: Prisma.JsonValue | null
    createdAt: Date
    updatedAt: Date
  }, ExtArgs["result"]["chatMessage"]>
  composites: {}
}

/**
 * Model ChatMessage
 * 
 */
export type ChatMessage = runtime.Types.DefaultSelection<ChatMessagePayload>
export type A2AAgentPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "A2AAgent"
  objects: {
    capabilities: A2AAgentCapabilityPayload<ExtArgs>[]
    sentMessages: A2AMessagePayload<ExtArgs>[]
    receivedMessages: A2AMessagePayload<ExtArgs>[]
    conversations: A2AConversationParticipantPayload<ExtArgs>[]
    heartbeats: A2AHeartbeatPayload<ExtArgs>[]
  }
  scalars: $Extensions.GetResult<{
    id: string
    agentId: string
    name: string
    type: string
    version: string
    description: string | null
    metadata: Prisma.JsonValue | null
    endpoints: Prisma.JsonValue | null
    authentication: Prisma.JsonValue | null
    status: A2AAgentStatus
    lastHeartbeat: Date | null
    registeredAt: Date
    updatedAt: Date
  }, ExtArgs["result"]["a2AAgent"]>
  composites: {}
}

/**
 * Model A2AAgent
 * 
 */
export type A2AAgent = runtime.Types.DefaultSelection<A2AAgentPayload>
export type A2AAgentCapabilityPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "A2AAgentCapability"
  objects: {
    agent: A2AAgentPayload<ExtArgs>
  }
  scalars: $Extensions.GetResult<{
    id: string
    agentId: string
    name: string
    description: string | null
    version: string
    parameters: Prisma.JsonValue | null
    metadata: Prisma.JsonValue | null
  }, ExtArgs["result"]["a2AAgentCapability"]>
  composites: {}
}

/**
 * Model A2AAgentCapability
 * 
 */
export type A2AAgentCapability = runtime.Types.DefaultSelection<A2AAgentCapabilityPayload>
export type A2AMessagePayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "A2AMessage"
  objects: {
    fromAgent: A2AAgentPayload<ExtArgs>
    toAgent: A2AAgentPayload<ExtArgs> | null
    conversation: A2AConversationPayload<ExtArgs> | null
  }
  scalars: $Extensions.GetResult<{
    id: string
    messageId: string
    protocolVersion: string
    timestamp: Date
    fromAgentId: string
    toAgentId: string | null
    type: A2AMessageType
    priority: A2AMessagePriority
    conversationId: string | null
    requestId: string | null
    ttl: number | null
    payload: Prisma.JsonValue
    routing: Prisma.JsonValue | null
    signature: string | null
    checksum: string | null
    metadata: Prisma.JsonValue | null
    deliveredAt: Date | null
    acknowledgedAt: Date | null
    createdAt: Date
  }, ExtArgs["result"]["a2AMessage"]>
  composites: {}
}

/**
 * Model A2AMessage
 * 
 */
export type A2AMessage = runtime.Types.DefaultSelection<A2AMessagePayload>
export type A2AConversationPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "A2AConversation"
  objects: {
    participants: A2AConversationParticipantPayload<ExtArgs>[]
    messages: A2AMessagePayload<ExtArgs>[]
  }
  scalars: $Extensions.GetResult<{
    id: string
    conversationId: string
    initiatorId: string
    topic: string | null
    status: A2AConversationStatus
    createdAt: Date
    updatedAt: Date
  }, ExtArgs["result"]["a2AConversation"]>
  composites: {}
}

/**
 * Model A2AConversation
 * 
 */
export type A2AConversation = runtime.Types.DefaultSelection<A2AConversationPayload>
export type A2AConversationParticipantPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "A2AConversationParticipant"
  objects: {
    conversation: A2AConversationPayload<ExtArgs>
    agent: A2AAgentPayload<ExtArgs>
  }
  scalars: $Extensions.GetResult<{
    id: string
    conversationId: string
    agentId: string
    joinedAt: Date
    leftAt: Date | null
    role: string | null
  }, ExtArgs["result"]["a2AConversationParticipant"]>
  composites: {}
}

/**
 * Model A2AConversationParticipant
 * 
 */
export type A2AConversationParticipant = runtime.Types.DefaultSelection<A2AConversationParticipantPayload>
export type A2AHeartbeatPayload<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
  name: "A2AHeartbeat"
  objects: {
    agent: A2AAgentPayload<ExtArgs>
  }
  scalars: $Extensions.GetResult<{
    id: string
    agentId: string
    timestamp: Date
    status: A2AAgentStatus
    load: number | null
    activeConnections: number | null
    lastActivity: Date | null
    metadata: Prisma.JsonValue | null
    createdAt: Date
  }, ExtArgs["result"]["a2AHeartbeat"]>
  composites: {}
}

/**
 * Model A2AHeartbeat
 * 
 */
export type A2AHeartbeat = runtime.Types.DefaultSelection<A2AHeartbeatPayload>

/**
 * Enums
 */

export const TaskStatus: {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]


export const TaskPriority: {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority]


export const AgentType: {
  GENERIC: 'GENERIC',
  CODER: 'CODER',
  ANALYZER: 'ANALYZER',
  COORDINATOR: 'COORDINATOR',
  COMMUNICATOR: 'COMMUNICATOR'
};

export type AgentType = (typeof AgentType)[keyof typeof AgentType]


export const AgentStatus: {
  IDLE: 'IDLE',
  BUSY: 'BUSY',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE'
};

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus]


export const EntityStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING'
};

export type EntityStatus = (typeof EntityStatus)[keyof typeof EntityStatus]


export const UserRole: {
  USER: 'USER',
  ADMIN: 'ADMIN',
  AGENT: 'AGENT'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const A2AAgentStatus: {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BUSY: 'BUSY',
  IDLE: 'IDLE',
  ERROR: 'ERROR'
};

export type A2AAgentStatus = (typeof A2AAgentStatus)[keyof typeof A2AAgentStatus]


export const A2AMessageType: {
  HANDSHAKE: 'HANDSHAKE',
  REQUEST: 'REQUEST',
  RESPONSE: 'RESPONSE',
  NOTIFICATION: 'NOTIFICATION',
  HEARTBEAT: 'HEARTBEAT',
  ERROR: 'ERROR',
  BROADCAST: 'BROADCAST'
};

export type A2AMessageType = (typeof A2AMessageType)[keyof typeof A2AMessageType]


export const A2AMessagePriority: {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export type A2AMessagePriority = (typeof A2AMessagePriority)[keyof typeof A2AMessagePriority]


export const A2AConversationStatus: {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export type A2AConversationStatus = (typeof A2AConversationStatus)[keyof typeof A2AConversationStatus]


/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Tasks
 * const tasks = await prisma.task.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  T extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof T ? T['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<T['log']> : never : never,
  GlobalReject extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined = 'rejectOnNotFound' extends keyof T
    ? T['rejectOnNotFound']
    : false,
  ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Tasks
   * const tasks = await prisma.task.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<T, Prisma.PrismaClientOptions>);
  $on<V extends (U | 'beforeExit')>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : V extends 'beforeExit' ? () => Promise<void> : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): Promise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): Promise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => Promise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): Promise<R>


  $extends: $Extensions.ExtendsHook<'extends', Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.task`: Exposes CRUD operations for the **Task** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tasks
    * const tasks = await prisma.task.findMany()
    * ```
    */
  get task(): Prisma.TaskDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.agent`: Exposes CRUD operations for the **Agent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Agents
    * const agents = await prisma.agent.findMany()
    * ```
    */
  get agent(): Prisma.AgentDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.registeredEntity`: Exposes CRUD operations for the **RegisteredEntity** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RegisteredEntities
    * const registeredEntities = await prisma.registeredEntity.findMany()
    * ```
    */
  get registeredEntity(): Prisma.RegisteredEntityDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.chatMessage`: Exposes CRUD operations for the **ChatMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChatMessages
    * const chatMessages = await prisma.chatMessage.findMany()
    * ```
    */
  get chatMessage(): Prisma.ChatMessageDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.a2AAgent`: Exposes CRUD operations for the **A2AAgent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more A2AAgents
    * const a2AAgents = await prisma.a2AAgent.findMany()
    * ```
    */
  get a2AAgent(): Prisma.A2AAgentDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.a2AAgentCapability`: Exposes CRUD operations for the **A2AAgentCapability** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more A2AAgentCapabilities
    * const a2AAgentCapabilities = await prisma.a2AAgentCapability.findMany()
    * ```
    */
  get a2AAgentCapability(): Prisma.A2AAgentCapabilityDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.a2AMessage`: Exposes CRUD operations for the **A2AMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more A2AMessages
    * const a2AMessages = await prisma.a2AMessage.findMany()
    * ```
    */
  get a2AMessage(): Prisma.A2AMessageDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.a2AConversation`: Exposes CRUD operations for the **A2AConversation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more A2AConversations
    * const a2AConversations = await prisma.a2AConversation.findMany()
    * ```
    */
  get a2AConversation(): Prisma.A2AConversationDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.a2AConversationParticipant`: Exposes CRUD operations for the **A2AConversationParticipant** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more A2AConversationParticipants
    * const a2AConversationParticipants = await prisma.a2AConversationParticipant.findMany()
    * ```
    */
  get a2AConversationParticipant(): Prisma.A2AConversationParticipantDelegate<GlobalReject, ExtArgs>;

  /**
   * `prisma.a2AHeartbeat`: Exposes CRUD operations for the **A2AHeartbeat** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more A2AHeartbeats
    * const a2AHeartbeats = await prisma.a2AHeartbeat.findMany()
    * ```
    */
  get a2AHeartbeat(): Prisma.A2AHeartbeatDelegate<GlobalReject, ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export type Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export type Args<T, F extends $Public.Operation> = $Public.Args<T, F>
  export type Payload<T, F extends $Public.Operation> = $Public.Payload<T, F>
  export type Result<T, A, F extends $Public.Operation> = $Public.Result<T, A, F>
  export type Exact<T, W> = $Public.Exact<T, W>

  /**
   * Prisma Client JS version: 4.16.2
   * Query Engine version: 4bc8b6e1b66cb932731fb1bdbbc550d1e010de81
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON object.
   * This type can be useful to enforce some input to be JSON-compatible or as a super-type to be extended from. 
   */
  export type JsonObject = {[Key in string]?: JsonValue}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON array.
   */
  export interface JsonArray extends Array<JsonValue> {}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches any valid JSON value.
   */
  export type JsonValue = string | number | boolean | JsonObject | JsonArray | null

  /**
   * Matches a JSON object.
   * Unlike `JsonObject`, this type allows undefined and read-only properties.
   */
  export type InputJsonObject = {readonly [Key in string]?: InputJsonValue | null}

  /**
   * Matches a JSON array.
   * Unlike `JsonArray`, readonly arrays are assignable to this type.
   */
  export interface InputJsonArray extends ReadonlyArray<InputJsonValue | null> {}

  /**
   * Matches any valid value that can be used as an input for operations like
   * create and update as the value of a JSON field. Unlike `JsonValue`, this
   * type allows read-only arrays and read-only object properties and disallows
   * `null` at the top level.
   *
   * `null` cannot be used as the value of a JSON field because its meaning
   * would be ambiguous. Use `Prisma.JsonNull` to store the JSON null value or
   * `Prisma.DbNull` to clear the JSON value and set the field to the database
   * NULL value instead.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-by-null-values
   */
  export type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }
  type HasSelect = {
    select: any
  }
  type HasInclude = {
    include: any
  }
  type CheckSelect<T, S, U> = T extends SelectAndInclude
    ? 'Please either choose `select` or `include`'
    : T extends HasSelect
    ? U
    : T extends HasInclude
    ? U
    : S

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => Promise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but with an array
   */
  type PickArray<T, K extends Array<keyof T>> = Prisma__Pick<T, TupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Task: 'Task',
    Agent: 'Agent',
    RegisteredEntity: 'RegisteredEntity',
    User: 'User',
    ChatMessage: 'ChatMessage',
    A2AAgent: 'A2AAgent',
    A2AAgentCapability: 'A2AAgentCapability',
    A2AMessage: 'A2AMessage',
    A2AConversation: 'A2AConversation',
    A2AConversationParticipant: 'A2AConversationParticipant',
    A2AHeartbeat: 'A2AHeartbeat'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }


  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.Args}, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs']>
  }

  export type TypeMap<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    meta: {
      modelProps: 'task' | 'agent' | 'registeredEntity' | 'user' | 'chatMessage' | 'a2AAgent' | 'a2AAgentCapability' | 'a2AMessage' | 'a2AConversation' | 'a2AConversationParticipant' | 'a2AHeartbeat'
      txIsolationLevel: Prisma.TransactionIsolationLevel
    },
    model: {
      Task: {
        payload: TaskPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.TaskFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TaskFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload>
          }
          findFirst: {
            args: Prisma.TaskFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TaskFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload>
          }
          findMany: {
            args: Prisma.TaskFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload>[]
          }
          create: {
            args: Prisma.TaskCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload>
          }
          createMany: {
            args: Prisma.TaskCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.TaskDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload>
          }
          update: {
            args: Prisma.TaskUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload>
          }
          deleteMany: {
            args: Prisma.TaskDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.TaskUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.TaskUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<TaskPayload>
          }
          aggregate: {
            args: Prisma.TaskAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateTask>
          }
          groupBy: {
            args: Prisma.TaskGroupByArgs<ExtArgs>,
            result: $Utils.Optional<TaskGroupByOutputType>[]
          }
          count: {
            args: Prisma.TaskCountArgs<ExtArgs>,
            result: $Utils.Optional<TaskCountAggregateOutputType> | number
          }
        }
      }
      Agent: {
        payload: AgentPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.AgentFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgentFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload>
          }
          findFirst: {
            args: Prisma.AgentFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgentFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload>
          }
          findMany: {
            args: Prisma.AgentFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload>[]
          }
          create: {
            args: Prisma.AgentCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload>
          }
          createMany: {
            args: Prisma.AgentCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.AgentDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload>
          }
          update: {
            args: Prisma.AgentUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload>
          }
          deleteMany: {
            args: Prisma.AgentDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.AgentUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.AgentUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<AgentPayload>
          }
          aggregate: {
            args: Prisma.AgentAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateAgent>
          }
          groupBy: {
            args: Prisma.AgentGroupByArgs<ExtArgs>,
            result: $Utils.Optional<AgentGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgentCountArgs<ExtArgs>,
            result: $Utils.Optional<AgentCountAggregateOutputType> | number
          }
        }
      }
      RegisteredEntity: {
        payload: RegisteredEntityPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.RegisteredEntityFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RegisteredEntityFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload>
          }
          findFirst: {
            args: Prisma.RegisteredEntityFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RegisteredEntityFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload>
          }
          findMany: {
            args: Prisma.RegisteredEntityFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload>[]
          }
          create: {
            args: Prisma.RegisteredEntityCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload>
          }
          createMany: {
            args: Prisma.RegisteredEntityCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.RegisteredEntityDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload>
          }
          update: {
            args: Prisma.RegisteredEntityUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload>
          }
          deleteMany: {
            args: Prisma.RegisteredEntityDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.RegisteredEntityUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.RegisteredEntityUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<RegisteredEntityPayload>
          }
          aggregate: {
            args: Prisma.RegisteredEntityAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateRegisteredEntity>
          }
          groupBy: {
            args: Prisma.RegisteredEntityGroupByArgs<ExtArgs>,
            result: $Utils.Optional<RegisteredEntityGroupByOutputType>[]
          }
          count: {
            args: Prisma.RegisteredEntityCountArgs<ExtArgs>,
            result: $Utils.Optional<RegisteredEntityCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: UserPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>,
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>,
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      ChatMessage: {
        payload: ChatMessagePayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.ChatMessageFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChatMessageFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload>
          }
          findFirst: {
            args: Prisma.ChatMessageFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChatMessageFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload>
          }
          findMany: {
            args: Prisma.ChatMessageFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload>[]
          }
          create: {
            args: Prisma.ChatMessageCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload>
          }
          createMany: {
            args: Prisma.ChatMessageCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.ChatMessageDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload>
          }
          update: {
            args: Prisma.ChatMessageUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload>
          }
          deleteMany: {
            args: Prisma.ChatMessageDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.ChatMessageUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.ChatMessageUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<ChatMessagePayload>
          }
          aggregate: {
            args: Prisma.ChatMessageAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateChatMessage>
          }
          groupBy: {
            args: Prisma.ChatMessageGroupByArgs<ExtArgs>,
            result: $Utils.Optional<ChatMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChatMessageCountArgs<ExtArgs>,
            result: $Utils.Optional<ChatMessageCountAggregateOutputType> | number
          }
        }
      }
      A2AAgent: {
        payload: A2AAgentPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.A2AAgentFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.A2AAgentFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload>
          }
          findFirst: {
            args: Prisma.A2AAgentFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.A2AAgentFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload>
          }
          findMany: {
            args: Prisma.A2AAgentFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload>[]
          }
          create: {
            args: Prisma.A2AAgentCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload>
          }
          createMany: {
            args: Prisma.A2AAgentCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.A2AAgentDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload>
          }
          update: {
            args: Prisma.A2AAgentUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload>
          }
          deleteMany: {
            args: Prisma.A2AAgentDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.A2AAgentUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.A2AAgentUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentPayload>
          }
          aggregate: {
            args: Prisma.A2AAgentAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateA2AAgent>
          }
          groupBy: {
            args: Prisma.A2AAgentGroupByArgs<ExtArgs>,
            result: $Utils.Optional<A2AAgentGroupByOutputType>[]
          }
          count: {
            args: Prisma.A2AAgentCountArgs<ExtArgs>,
            result: $Utils.Optional<A2AAgentCountAggregateOutputType> | number
          }
        }
      }
      A2AAgentCapability: {
        payload: A2AAgentCapabilityPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.A2AAgentCapabilityFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.A2AAgentCapabilityFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload>
          }
          findFirst: {
            args: Prisma.A2AAgentCapabilityFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.A2AAgentCapabilityFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload>
          }
          findMany: {
            args: Prisma.A2AAgentCapabilityFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload>[]
          }
          create: {
            args: Prisma.A2AAgentCapabilityCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload>
          }
          createMany: {
            args: Prisma.A2AAgentCapabilityCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.A2AAgentCapabilityDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload>
          }
          update: {
            args: Prisma.A2AAgentCapabilityUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload>
          }
          deleteMany: {
            args: Prisma.A2AAgentCapabilityDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.A2AAgentCapabilityUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.A2AAgentCapabilityUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AAgentCapabilityPayload>
          }
          aggregate: {
            args: Prisma.A2AAgentCapabilityAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateA2AAgentCapability>
          }
          groupBy: {
            args: Prisma.A2AAgentCapabilityGroupByArgs<ExtArgs>,
            result: $Utils.Optional<A2AAgentCapabilityGroupByOutputType>[]
          }
          count: {
            args: Prisma.A2AAgentCapabilityCountArgs<ExtArgs>,
            result: $Utils.Optional<A2AAgentCapabilityCountAggregateOutputType> | number
          }
        }
      }
      A2AMessage: {
        payload: A2AMessagePayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.A2AMessageFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.A2AMessageFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload>
          }
          findFirst: {
            args: Prisma.A2AMessageFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.A2AMessageFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload>
          }
          findMany: {
            args: Prisma.A2AMessageFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload>[]
          }
          create: {
            args: Prisma.A2AMessageCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload>
          }
          createMany: {
            args: Prisma.A2AMessageCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.A2AMessageDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload>
          }
          update: {
            args: Prisma.A2AMessageUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload>
          }
          deleteMany: {
            args: Prisma.A2AMessageDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.A2AMessageUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.A2AMessageUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AMessagePayload>
          }
          aggregate: {
            args: Prisma.A2AMessageAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateA2AMessage>
          }
          groupBy: {
            args: Prisma.A2AMessageGroupByArgs<ExtArgs>,
            result: $Utils.Optional<A2AMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.A2AMessageCountArgs<ExtArgs>,
            result: $Utils.Optional<A2AMessageCountAggregateOutputType> | number
          }
        }
      }
      A2AConversation: {
        payload: A2AConversationPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.A2AConversationFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.A2AConversationFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload>
          }
          findFirst: {
            args: Prisma.A2AConversationFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.A2AConversationFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload>
          }
          findMany: {
            args: Prisma.A2AConversationFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload>[]
          }
          create: {
            args: Prisma.A2AConversationCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload>
          }
          createMany: {
            args: Prisma.A2AConversationCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.A2AConversationDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload>
          }
          update: {
            args: Prisma.A2AConversationUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload>
          }
          deleteMany: {
            args: Prisma.A2AConversationDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.A2AConversationUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.A2AConversationUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationPayload>
          }
          aggregate: {
            args: Prisma.A2AConversationAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateA2AConversation>
          }
          groupBy: {
            args: Prisma.A2AConversationGroupByArgs<ExtArgs>,
            result: $Utils.Optional<A2AConversationGroupByOutputType>[]
          }
          count: {
            args: Prisma.A2AConversationCountArgs<ExtArgs>,
            result: $Utils.Optional<A2AConversationCountAggregateOutputType> | number
          }
        }
      }
      A2AConversationParticipant: {
        payload: A2AConversationParticipantPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.A2AConversationParticipantFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.A2AConversationParticipantFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload>
          }
          findFirst: {
            args: Prisma.A2AConversationParticipantFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.A2AConversationParticipantFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload>
          }
          findMany: {
            args: Prisma.A2AConversationParticipantFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload>[]
          }
          create: {
            args: Prisma.A2AConversationParticipantCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload>
          }
          createMany: {
            args: Prisma.A2AConversationParticipantCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.A2AConversationParticipantDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload>
          }
          update: {
            args: Prisma.A2AConversationParticipantUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload>
          }
          deleteMany: {
            args: Prisma.A2AConversationParticipantDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.A2AConversationParticipantUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.A2AConversationParticipantUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AConversationParticipantPayload>
          }
          aggregate: {
            args: Prisma.A2AConversationParticipantAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateA2AConversationParticipant>
          }
          groupBy: {
            args: Prisma.A2AConversationParticipantGroupByArgs<ExtArgs>,
            result: $Utils.Optional<A2AConversationParticipantGroupByOutputType>[]
          }
          count: {
            args: Prisma.A2AConversationParticipantCountArgs<ExtArgs>,
            result: $Utils.Optional<A2AConversationParticipantCountAggregateOutputType> | number
          }
        }
      }
      A2AHeartbeat: {
        payload: A2AHeartbeatPayload<ExtArgs>
        operations: {
          findUnique: {
            args: Prisma.A2AHeartbeatFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.A2AHeartbeatFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload>
          }
          findFirst: {
            args: Prisma.A2AHeartbeatFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.A2AHeartbeatFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload>
          }
          findMany: {
            args: Prisma.A2AHeartbeatFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload>[]
          }
          create: {
            args: Prisma.A2AHeartbeatCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload>
          }
          createMany: {
            args: Prisma.A2AHeartbeatCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.A2AHeartbeatDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload>
          }
          update: {
            args: Prisma.A2AHeartbeatUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload>
          }
          deleteMany: {
            args: Prisma.A2AHeartbeatDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.A2AHeartbeatUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.A2AHeartbeatUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<A2AHeartbeatPayload>
          }
          aggregate: {
            args: Prisma.A2AHeartbeatAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateA2AHeartbeat>
          }
          groupBy: {
            args: Prisma.A2AHeartbeatGroupByArgs<ExtArgs>,
            result: $Utils.Optional<A2AHeartbeatGroupByOutputType>[]
          }
          count: {
            args: Prisma.A2AHeartbeatCountArgs<ExtArgs>,
            result: $Utils.Optional<A2AHeartbeatCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<'define', Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type RejectOnNotFound = boolean | ((error: Error) => Error)
  export type RejectPerModel = { [P in ModelName]?: RejectOnNotFound }
  export type RejectPerOperation =  { [P in "findUnique" | "findFirst"]?: RejectPerModel | RejectOnNotFound } 
  type IsReject<T> = T extends true ? True : T extends (err: Error) => Error ? True : False
  export type HasReject<
    GlobalRejectSettings extends Prisma.PrismaClientOptions['rejectOnNotFound'],
    LocalRejectSettings,
    Action extends PrismaAction,
    Model extends ModelName
  > = LocalRejectSettings extends RejectOnNotFound
    ? IsReject<LocalRejectSettings>
    : GlobalRejectSettings extends RejectPerOperation
    ? Action extends keyof GlobalRejectSettings
      ? GlobalRejectSettings[Action] extends RejectOnNotFound
        ? IsReject<GlobalRejectSettings[Action]>
        : GlobalRejectSettings[Action] extends RejectPerModel
        ? Model extends keyof GlobalRejectSettings[Action]
          ? IsReject<GlobalRejectSettings[Action][Model]>
          : False
        : False
      : False
    : IsReject<GlobalRejectSettings>
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'

  export interface PrismaClientOptions {
    /**
     * Configure findUnique/findFirst to throw an error if the query returns null. 
     * @deprecated since 4.0.0. Use `findUniqueOrThrow`/`findFirstOrThrow` methods instead.
     * @example
     * ```
     * // Reject on both findUnique/findFirst
     * rejectOnNotFound: true
     * // Reject only on findFirst with a custom error
     * rejectOnNotFound: { findFirst: (err) => new Error("Custom Error")}
     * // Reject on user.findUnique with a custom error
     * rejectOnNotFound: { findUnique: {User: (err) => new Error("User not found")}}
     * ```
     */
    rejectOnNotFound?: RejectOnNotFound | RejectPerOperation
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources

    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat

    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: Array<LogLevel | LogDefinition>
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findMany'
    | 'findFirst'
    | 'create'
    | 'createMany'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => Promise<T>,
  ) => Promise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */


  export type UserCountOutputType = {
    agents: number
    chatMessages: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    agents?: boolean | UserCountOutputTypeCountAgentsArgs
    chatMessages?: boolean | UserCountOutputTypeCountChatMessagesArgs
  }

  // Custom InputTypes

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAgentsArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: AgentWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountChatMessagesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: ChatMessageWhereInput
  }



  /**
   * Count Type A2AAgentCountOutputType
   */


  export type A2AAgentCountOutputType = {
    capabilities: number
    sentMessages: number
    receivedMessages: number
    conversations: number
    heartbeats: number
  }

  export type A2AAgentCountOutputTypeSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    capabilities?: boolean | A2AAgentCountOutputTypeCountCapabilitiesArgs
    sentMessages?: boolean | A2AAgentCountOutputTypeCountSentMessagesArgs
    receivedMessages?: boolean | A2AAgentCountOutputTypeCountReceivedMessagesArgs
    conversations?: boolean | A2AAgentCountOutputTypeCountConversationsArgs
    heartbeats?: boolean | A2AAgentCountOutputTypeCountHeartbeatsArgs
  }

  // Custom InputTypes

  /**
   * A2AAgentCountOutputType without action
   */
  export type A2AAgentCountOutputTypeArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCountOutputType
     */
    select?: A2AAgentCountOutputTypeSelect<ExtArgs> | null
  }


  /**
   * A2AAgentCountOutputType without action
   */
  export type A2AAgentCountOutputTypeCountCapabilitiesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AAgentCapabilityWhereInput
  }


  /**
   * A2AAgentCountOutputType without action
   */
  export type A2AAgentCountOutputTypeCountSentMessagesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AMessageWhereInput
  }


  /**
   * A2AAgentCountOutputType without action
   */
  export type A2AAgentCountOutputTypeCountReceivedMessagesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AMessageWhereInput
  }


  /**
   * A2AAgentCountOutputType without action
   */
  export type A2AAgentCountOutputTypeCountConversationsArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AConversationParticipantWhereInput
  }


  /**
   * A2AAgentCountOutputType without action
   */
  export type A2AAgentCountOutputTypeCountHeartbeatsArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AHeartbeatWhereInput
  }



  /**
   * Count Type A2AConversationCountOutputType
   */


  export type A2AConversationCountOutputType = {
    participants: number
    messages: number
  }

  export type A2AConversationCountOutputTypeSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    participants?: boolean | A2AConversationCountOutputTypeCountParticipantsArgs
    messages?: boolean | A2AConversationCountOutputTypeCountMessagesArgs
  }

  // Custom InputTypes

  /**
   * A2AConversationCountOutputType without action
   */
  export type A2AConversationCountOutputTypeArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationCountOutputType
     */
    select?: A2AConversationCountOutputTypeSelect<ExtArgs> | null
  }


  /**
   * A2AConversationCountOutputType without action
   */
  export type A2AConversationCountOutputTypeCountParticipantsArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AConversationParticipantWhereInput
  }


  /**
   * A2AConversationCountOutputType without action
   */
  export type A2AConversationCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AMessageWhereInput
  }



  /**
   * Models
   */

  /**
   * Model Task
   */


  export type AggregateTask = {
    _count: TaskCountAggregateOutputType | null
    _min: TaskMinAggregateOutputType | null
    _max: TaskMaxAggregateOutputType | null
  }

  export type TaskMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    status: TaskStatus | null
    priority: TaskPriority | null
    type: string | null
    createdAt: Date | null
    updatedAt: Date | null
    dueDate: Date | null
    assignedTo: string | null
    createdBy: string | null
    error: string | null
    completedAt: Date | null
  }

  export type TaskMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    status: TaskStatus | null
    priority: TaskPriority | null
    type: string | null
    createdAt: Date | null
    updatedAt: Date | null
    dueDate: Date | null
    assignedTo: string | null
    createdBy: string | null
    error: string | null
    completedAt: Date | null
  }

  export type TaskCountAggregateOutputType = {
    id: number
    title: number
    description: number
    status: number
    priority: number
    type: number
    createdAt: number
    updatedAt: number
    dueDate: number
    assignedTo: number
    createdBy: number
    metadata: number
    tags: number
    dependencies: number
    error: number
    completedAt: number
    _all: number
  }


  export type TaskMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    type?: true
    createdAt?: true
    updatedAt?: true
    dueDate?: true
    assignedTo?: true
    createdBy?: true
    error?: true
    completedAt?: true
  }

  export type TaskMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    type?: true
    createdAt?: true
    updatedAt?: true
    dueDate?: true
    assignedTo?: true
    createdBy?: true
    error?: true
    completedAt?: true
  }

  export type TaskCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    priority?: true
    type?: true
    createdAt?: true
    updatedAt?: true
    dueDate?: true
    assignedTo?: true
    createdBy?: true
    metadata?: true
    tags?: true
    dependencies?: true
    error?: true
    completedAt?: true
    _all?: true
  }

  export type TaskAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which Task to aggregate.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: Enumerable<TaskOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tasks
    **/
    _count?: true | TaskCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TaskMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TaskMaxAggregateInputType
  }

  export type GetTaskAggregateType<T extends TaskAggregateArgs> = {
        [P in keyof T & keyof AggregateTask]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTask[P]>
      : GetScalarType<T[P], AggregateTask[P]>
  }




  export type TaskGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
    orderBy?: Enumerable<TaskOrderByWithAggregationInput>
    by: TaskScalarFieldEnum[]
    having?: TaskScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TaskCountAggregateInputType | true
    _min?: TaskMinAggregateInputType
    _max?: TaskMaxAggregateInputType
  }


  export type TaskGroupByOutputType = {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    type: string
    createdAt: Date
    updatedAt: Date
    dueDate: Date | null
    assignedTo: string | null
    createdBy: string
    metadata: JsonValue | null
    tags: string[]
    dependencies: string[]
    error: string | null
    completedAt: Date | null
    _count: TaskCountAggregateOutputType | null
    _min: TaskMinAggregateOutputType | null
    _max: TaskMaxAggregateOutputType | null
  }

  type GetTaskGroupByPayload<T extends TaskGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<TaskGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TaskGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TaskGroupByOutputType[P]>
            : GetScalarType<T[P], TaskGroupByOutputType[P]>
        }
      >
    >


  export type TaskSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    type?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    dueDate?: boolean
    assignedTo?: boolean
    createdBy?: boolean
    metadata?: boolean
    tags?: boolean
    dependencies?: boolean
    error?: boolean
    completedAt?: boolean
  }, ExtArgs["result"]["task"]>

  export type TaskSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    type?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    dueDate?: boolean
    assignedTo?: boolean
    createdBy?: boolean
    metadata?: boolean
    tags?: boolean
    dependencies?: boolean
    error?: boolean
    completedAt?: boolean
  }


  type TaskGetPayload<S extends boolean | null | undefined | TaskArgs> = $Types.GetResult<TaskPayload, S>

  type TaskCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<TaskFindManyArgs, 'select' | 'include'> & {
      select?: TaskCountAggregateInputType | true
    }

  export interface TaskDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Task'], meta: { name: 'Task' } }
    /**
     * Find zero or one Task that matches the filter.
     * @param {TaskFindUniqueArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends TaskFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, TaskFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'Task'> extends True ? Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one Task that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {TaskFindUniqueOrThrowArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends TaskFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, TaskFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first Task that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindFirstArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends TaskFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, TaskFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'Task'> extends True ? Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first Task that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindFirstOrThrowArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends TaskFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, TaskFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more Tasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tasks
     * const tasks = await prisma.task.findMany()
     * 
     * // Get first 10 Tasks
     * const tasks = await prisma.task.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const taskWithIdOnly = await prisma.task.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends TaskFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, TaskFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<TaskPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a Task.
     * @param {TaskCreateArgs} args - Arguments to create a Task.
     * @example
     * // Create one Task
     * const Task = await prisma.task.create({
     *   data: {
     *     // ... data to create a Task
     *   }
     * })
     * 
    **/
    create<T extends TaskCreateArgs<ExtArgs>>(
      args: SelectSubset<T, TaskCreateArgs<ExtArgs>>
    ): Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many Tasks.
     *     @param {TaskCreateManyArgs} args - Arguments to create many Tasks.
     *     @example
     *     // Create many Tasks
     *     const task = await prisma.task.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends TaskCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, TaskCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Task.
     * @param {TaskDeleteArgs} args - Arguments to delete one Task.
     * @example
     * // Delete one Task
     * const Task = await prisma.task.delete({
     *   where: {
     *     // ... filter to delete one Task
     *   }
     * })
     * 
    **/
    delete<T extends TaskDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, TaskDeleteArgs<ExtArgs>>
    ): Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one Task.
     * @param {TaskUpdateArgs} args - Arguments to update one Task.
     * @example
     * // Update one Task
     * const task = await prisma.task.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends TaskUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, TaskUpdateArgs<ExtArgs>>
    ): Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more Tasks.
     * @param {TaskDeleteManyArgs} args - Arguments to filter Tasks to delete.
     * @example
     * // Delete a few Tasks
     * const { count } = await prisma.task.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends TaskDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, TaskDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tasks
     * const task = await prisma.task.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends TaskUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, TaskUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Task.
     * @param {TaskUpsertArgs} args - Arguments to update or create a Task.
     * @example
     * // Update or create a Task
     * const task = await prisma.task.upsert({
     *   create: {
     *     // ... data to create a Task
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Task we want to update
     *   }
     * })
    **/
    upsert<T extends TaskUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, TaskUpsertArgs<ExtArgs>>
    ): Prisma__TaskClient<$Types.GetResult<TaskPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of Tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskCountArgs} args - Arguments to filter Tasks to count.
     * @example
     * // Count the number of Tasks
     * const count = await prisma.task.count({
     *   where: {
     *     // ... the filter for the Tasks we want to count
     *   }
     * })
    **/
    count<T extends TaskCountArgs>(
      args?: Subset<T, TaskCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TaskCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Task.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TaskAggregateArgs>(args: Subset<T, TaskAggregateArgs>): Prisma.PrismaPromise<GetTaskAggregateType<T>>

    /**
     * Group by Task.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TaskGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TaskGroupByArgs['orderBy'] }
        : { orderBy?: TaskGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TaskGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTaskGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for Task.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__TaskClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);


    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * Task base type for findUnique actions
   */
  export type TaskFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task findUnique
   */
  export interface TaskFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends TaskFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Task findUniqueOrThrow
   */
  export type TaskFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where: TaskWhereUniqueInput
  }


  /**
   * Task base type for findFirst actions
   */
  export type TaskFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: Enumerable<TaskOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: Enumerable<TaskScalarFieldEnum>
  }

  /**
   * Task findFirst
   */
  export interface TaskFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends TaskFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Task findFirstOrThrow
   */
  export type TaskFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: Enumerable<TaskOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: Enumerable<TaskScalarFieldEnum>
  }


  /**
   * Task findMany
   */
  export type TaskFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Filter, which Tasks to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: Enumerable<TaskOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    distinct?: Enumerable<TaskScalarFieldEnum>
  }


  /**
   * Task create
   */
  export type TaskCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * The data needed to create a Task.
     */
    data: XOR<TaskCreateInput, TaskUncheckedCreateInput>
  }


  /**
   * Task createMany
   */
  export type TaskCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tasks.
     */
    data: Enumerable<TaskCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * Task update
   */
  export type TaskUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * The data needed to update a Task.
     */
    data: XOR<TaskUpdateInput, TaskUncheckedUpdateInput>
    /**
     * Choose, which Task to update.
     */
    where: TaskWhereUniqueInput
  }


  /**
   * Task updateMany
   */
  export type TaskUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tasks.
     */
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyInput>
    /**
     * Filter which Tasks to update
     */
    where?: TaskWhereInput
  }


  /**
   * Task upsert
   */
  export type TaskUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * The filter to search for the Task to update in case it exists.
     */
    where: TaskWhereUniqueInput
    /**
     * In case the Task found by the `where` argument doesn't exist, create a new Task with this data.
     */
    create: XOR<TaskCreateInput, TaskUncheckedCreateInput>
    /**
     * In case the Task was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TaskUpdateInput, TaskUncheckedUpdateInput>
  }


  /**
   * Task delete
   */
  export type TaskDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Filter which Task to delete.
     */
    where: TaskWhereUniqueInput
  }


  /**
   * Task deleteMany
   */
  export type TaskDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tasks to delete
     */
    where?: TaskWhereInput
  }


  /**
   * Task without action
   */
  export type TaskArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
  }



  /**
   * Model Agent
   */


  export type AggregateAgent = {
    _count: AgentCountAggregateOutputType | null
    _min: AgentMinAggregateOutputType | null
    _max: AgentMaxAggregateOutputType | null
  }

  export type AgentMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    type: AgentType | null
    status: AgentStatus | null
    provider: string | null
    lastActive: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    userId: string | null
  }

  export type AgentMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    type: AgentType | null
    status: AgentStatus | null
    provider: string | null
    lastActive: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    userId: string | null
  }

  export type AgentCountAggregateOutputType = {
    id: number
    name: number
    description: number
    type: number
    status: number
    capabilities: number
    provider: number
    lastActive: number
    metadata: number
    createdAt: number
    updatedAt: number
    userId: number
    _all: number
  }


  export type AgentMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    type?: true
    status?: true
    provider?: true
    lastActive?: true
    createdAt?: true
    updatedAt?: true
    userId?: true
  }

  export type AgentMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    type?: true
    status?: true
    provider?: true
    lastActive?: true
    createdAt?: true
    updatedAt?: true
    userId?: true
  }

  export type AgentCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    type?: true
    status?: true
    capabilities?: true
    provider?: true
    lastActive?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    userId?: true
    _all?: true
  }

  export type AgentAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which Agent to aggregate.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: Enumerable<AgentOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Agents
    **/
    _count?: true | AgentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgentMaxAggregateInputType
  }

  export type GetAgentAggregateType<T extends AgentAggregateArgs> = {
        [P in keyof T & keyof AggregateAgent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgent[P]>
      : GetScalarType<T[P], AggregateAgent[P]>
  }




  export type AgentGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: AgentWhereInput
    orderBy?: Enumerable<AgentOrderByWithAggregationInput>
    by: AgentScalarFieldEnum[]
    having?: AgentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgentCountAggregateInputType | true
    _min?: AgentMinAggregateInputType
    _max?: AgentMaxAggregateInputType
  }


  export type AgentGroupByOutputType = {
    id: string
    name: string
    description: string | null
    type: AgentType
    status: AgentStatus
    capabilities: string[]
    provider: string
    lastActive: Date
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    userId: string | null
    _count: AgentCountAggregateOutputType | null
    _min: AgentMinAggregateOutputType | null
    _max: AgentMaxAggregateOutputType | null
  }

  type GetAgentGroupByPayload<T extends AgentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<AgentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgentGroupByOutputType[P]>
            : GetScalarType<T[P], AgentGroupByOutputType[P]>
        }
      >
    >


  export type AgentSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    type?: boolean
    status?: boolean
    capabilities?: boolean
    provider?: boolean
    lastActive?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    userId?: boolean
    user?: boolean | UserArgs<ExtArgs>
  }, ExtArgs["result"]["agent"]>

  export type AgentSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    type?: boolean
    status?: boolean
    capabilities?: boolean
    provider?: boolean
    lastActive?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    userId?: boolean
  }

  export type AgentInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    user?: boolean | UserArgs<ExtArgs>
  }


  type AgentGetPayload<S extends boolean | null | undefined | AgentArgs> = $Types.GetResult<AgentPayload, S>

  type AgentCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<AgentFindManyArgs, 'select' | 'include'> & {
      select?: AgentCountAggregateInputType | true
    }

  export interface AgentDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Agent'], meta: { name: 'Agent' } }
    /**
     * Find zero or one Agent that matches the filter.
     * @param {AgentFindUniqueArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends AgentFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, AgentFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'Agent'> extends True ? Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one Agent that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {AgentFindUniqueOrThrowArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends AgentFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, AgentFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first Agent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindFirstArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends AgentFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, AgentFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'Agent'> extends True ? Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first Agent that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindFirstOrThrowArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends AgentFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, AgentFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more Agents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Agents
     * const agents = await prisma.agent.findMany()
     * 
     * // Get first 10 Agents
     * const agents = await prisma.agent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agentWithIdOnly = await prisma.agent.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends AgentFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, AgentFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<AgentPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a Agent.
     * @param {AgentCreateArgs} args - Arguments to create a Agent.
     * @example
     * // Create one Agent
     * const Agent = await prisma.agent.create({
     *   data: {
     *     // ... data to create a Agent
     *   }
     * })
     * 
    **/
    create<T extends AgentCreateArgs<ExtArgs>>(
      args: SelectSubset<T, AgentCreateArgs<ExtArgs>>
    ): Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many Agents.
     *     @param {AgentCreateManyArgs} args - Arguments to create many Agents.
     *     @example
     *     // Create many Agents
     *     const agent = await prisma.agent.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends AgentCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, AgentCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Agent.
     * @param {AgentDeleteArgs} args - Arguments to delete one Agent.
     * @example
     * // Delete one Agent
     * const Agent = await prisma.agent.delete({
     *   where: {
     *     // ... filter to delete one Agent
     *   }
     * })
     * 
    **/
    delete<T extends AgentDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, AgentDeleteArgs<ExtArgs>>
    ): Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one Agent.
     * @param {AgentUpdateArgs} args - Arguments to update one Agent.
     * @example
     * // Update one Agent
     * const agent = await prisma.agent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends AgentUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, AgentUpdateArgs<ExtArgs>>
    ): Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more Agents.
     * @param {AgentDeleteManyArgs} args - Arguments to filter Agents to delete.
     * @example
     * // Delete a few Agents
     * const { count } = await prisma.agent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends AgentDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, AgentDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Agents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Agents
     * const agent = await prisma.agent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends AgentUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, AgentUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Agent.
     * @param {AgentUpsertArgs} args - Arguments to update or create a Agent.
     * @example
     * // Update or create a Agent
     * const agent = await prisma.agent.upsert({
     *   create: {
     *     // ... data to create a Agent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Agent we want to update
     *   }
     * })
    **/
    upsert<T extends AgentUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, AgentUpsertArgs<ExtArgs>>
    ): Prisma__AgentClient<$Types.GetResult<AgentPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of Agents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentCountArgs} args - Arguments to filter Agents to count.
     * @example
     * // Count the number of Agents
     * const count = await prisma.agent.count({
     *   where: {
     *     // ... the filter for the Agents we want to count
     *   }
     * })
    **/
    count<T extends AgentCountArgs>(
      args?: Subset<T, AgentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Agent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgentAggregateArgs>(args: Subset<T, AgentAggregateArgs>): Prisma.PrismaPromise<GetAgentAggregateType<T>>

    /**
     * Group by Agent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgentGroupByArgs['orderBy'] }
        : { orderBy?: AgentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for Agent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__AgentClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    user<T extends UserArgs<ExtArgs> = {}>(args?: Subset<T, UserArgs<ExtArgs>>): Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * Agent base type for findUnique actions
   */
  export type AgentFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent findUnique
   */
  export interface AgentFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends AgentFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Agent findUniqueOrThrow
   */
  export type AgentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where: AgentWhereUniqueInput
  }


  /**
   * Agent base type for findFirst actions
   */
  export type AgentFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: Enumerable<AgentOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Agents.
     */
    distinct?: Enumerable<AgentScalarFieldEnum>
  }

  /**
   * Agent findFirst
   */
  export interface AgentFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends AgentFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Agent findFirstOrThrow
   */
  export type AgentFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: Enumerable<AgentOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Agents.
     */
    distinct?: Enumerable<AgentScalarFieldEnum>
  }


  /**
   * Agent findMany
   */
  export type AgentFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter, which Agents to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: Enumerable<AgentOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    distinct?: Enumerable<AgentScalarFieldEnum>
  }


  /**
   * Agent create
   */
  export type AgentCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * The data needed to create a Agent.
     */
    data: XOR<AgentCreateInput, AgentUncheckedCreateInput>
  }


  /**
   * Agent createMany
   */
  export type AgentCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Agents.
     */
    data: Enumerable<AgentCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * Agent update
   */
  export type AgentUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * The data needed to update a Agent.
     */
    data: XOR<AgentUpdateInput, AgentUncheckedUpdateInput>
    /**
     * Choose, which Agent to update.
     */
    where: AgentWhereUniqueInput
  }


  /**
   * Agent updateMany
   */
  export type AgentUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Agents.
     */
    data: XOR<AgentUpdateManyMutationInput, AgentUncheckedUpdateManyInput>
    /**
     * Filter which Agents to update
     */
    where?: AgentWhereInput
  }


  /**
   * Agent upsert
   */
  export type AgentUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * The filter to search for the Agent to update in case it exists.
     */
    where: AgentWhereUniqueInput
    /**
     * In case the Agent found by the `where` argument doesn't exist, create a new Agent with this data.
     */
    create: XOR<AgentCreateInput, AgentUncheckedCreateInput>
    /**
     * In case the Agent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgentUpdateInput, AgentUncheckedUpdateInput>
  }


  /**
   * Agent delete
   */
  export type AgentDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    /**
     * Filter which Agent to delete.
     */
    where: AgentWhereUniqueInput
  }


  /**
   * Agent deleteMany
   */
  export type AgentDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which Agents to delete
     */
    where?: AgentWhereInput
  }


  /**
   * Agent without action
   */
  export type AgentArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
  }



  /**
   * Model RegisteredEntity
   */


  export type AggregateRegisteredEntity = {
    _count: RegisteredEntityCountAggregateOutputType | null
    _min: RegisteredEntityMinAggregateOutputType | null
    _max: RegisteredEntityMaxAggregateOutputType | null
  }

  export type RegisteredEntityMinAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    description: string | null
    status: EntityStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RegisteredEntityMaxAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    description: string | null
    status: EntityStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RegisteredEntityCountAggregateOutputType = {
    id: number
    name: number
    type: number
    description: number
    metadata: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RegisteredEntityMinAggregateInputType = {
    id?: true
    name?: true
    type?: true
    description?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RegisteredEntityMaxAggregateInputType = {
    id?: true
    name?: true
    type?: true
    description?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RegisteredEntityCountAggregateInputType = {
    id?: true
    name?: true
    type?: true
    description?: true
    metadata?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RegisteredEntityAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which RegisteredEntity to aggregate.
     */
    where?: RegisteredEntityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RegisteredEntities to fetch.
     */
    orderBy?: Enumerable<RegisteredEntityOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RegisteredEntityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RegisteredEntities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RegisteredEntities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RegisteredEntities
    **/
    _count?: true | RegisteredEntityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RegisteredEntityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RegisteredEntityMaxAggregateInputType
  }

  export type GetRegisteredEntityAggregateType<T extends RegisteredEntityAggregateArgs> = {
        [P in keyof T & keyof AggregateRegisteredEntity]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRegisteredEntity[P]>
      : GetScalarType<T[P], AggregateRegisteredEntity[P]>
  }




  export type RegisteredEntityGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: RegisteredEntityWhereInput
    orderBy?: Enumerable<RegisteredEntityOrderByWithAggregationInput>
    by: RegisteredEntityScalarFieldEnum[]
    having?: RegisteredEntityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RegisteredEntityCountAggregateInputType | true
    _min?: RegisteredEntityMinAggregateInputType
    _max?: RegisteredEntityMaxAggregateInputType
  }


  export type RegisteredEntityGroupByOutputType = {
    id: string
    name: string
    type: string
    description: string | null
    metadata: JsonValue | null
    status: EntityStatus
    createdAt: Date
    updatedAt: Date
    _count: RegisteredEntityCountAggregateOutputType | null
    _min: RegisteredEntityMinAggregateOutputType | null
    _max: RegisteredEntityMaxAggregateOutputType | null
  }

  type GetRegisteredEntityGroupByPayload<T extends RegisteredEntityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<RegisteredEntityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RegisteredEntityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RegisteredEntityGroupByOutputType[P]>
            : GetScalarType<T[P], RegisteredEntityGroupByOutputType[P]>
        }
      >
    >


  export type RegisteredEntitySelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    description?: boolean
    metadata?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["registeredEntity"]>

  export type RegisteredEntitySelectScalar = {
    id?: boolean
    name?: boolean
    type?: boolean
    description?: boolean
    metadata?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  type RegisteredEntityGetPayload<S extends boolean | null | undefined | RegisteredEntityArgs> = $Types.GetResult<RegisteredEntityPayload, S>

  type RegisteredEntityCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<RegisteredEntityFindManyArgs, 'select' | 'include'> & {
      select?: RegisteredEntityCountAggregateInputType | true
    }

  export interface RegisteredEntityDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RegisteredEntity'], meta: { name: 'RegisteredEntity' } }
    /**
     * Find zero or one RegisteredEntity that matches the filter.
     * @param {RegisteredEntityFindUniqueArgs} args - Arguments to find a RegisteredEntity
     * @example
     * // Get one RegisteredEntity
     * const registeredEntity = await prisma.registeredEntity.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends RegisteredEntityFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, RegisteredEntityFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'RegisteredEntity'> extends True ? Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one RegisteredEntity that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {RegisteredEntityFindUniqueOrThrowArgs} args - Arguments to find a RegisteredEntity
     * @example
     * // Get one RegisteredEntity
     * const registeredEntity = await prisma.registeredEntity.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends RegisteredEntityFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, RegisteredEntityFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first RegisteredEntity that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegisteredEntityFindFirstArgs} args - Arguments to find a RegisteredEntity
     * @example
     * // Get one RegisteredEntity
     * const registeredEntity = await prisma.registeredEntity.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends RegisteredEntityFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, RegisteredEntityFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'RegisteredEntity'> extends True ? Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first RegisteredEntity that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegisteredEntityFindFirstOrThrowArgs} args - Arguments to find a RegisteredEntity
     * @example
     * // Get one RegisteredEntity
     * const registeredEntity = await prisma.registeredEntity.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends RegisteredEntityFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, RegisteredEntityFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more RegisteredEntities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegisteredEntityFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RegisteredEntities
     * const registeredEntities = await prisma.registeredEntity.findMany()
     * 
     * // Get first 10 RegisteredEntities
     * const registeredEntities = await prisma.registeredEntity.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const registeredEntityWithIdOnly = await prisma.registeredEntity.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends RegisteredEntityFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, RegisteredEntityFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a RegisteredEntity.
     * @param {RegisteredEntityCreateArgs} args - Arguments to create a RegisteredEntity.
     * @example
     * // Create one RegisteredEntity
     * const RegisteredEntity = await prisma.registeredEntity.create({
     *   data: {
     *     // ... data to create a RegisteredEntity
     *   }
     * })
     * 
    **/
    create<T extends RegisteredEntityCreateArgs<ExtArgs>>(
      args: SelectSubset<T, RegisteredEntityCreateArgs<ExtArgs>>
    ): Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many RegisteredEntities.
     *     @param {RegisteredEntityCreateManyArgs} args - Arguments to create many RegisteredEntities.
     *     @example
     *     // Create many RegisteredEntities
     *     const registeredEntity = await prisma.registeredEntity.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends RegisteredEntityCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, RegisteredEntityCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a RegisteredEntity.
     * @param {RegisteredEntityDeleteArgs} args - Arguments to delete one RegisteredEntity.
     * @example
     * // Delete one RegisteredEntity
     * const RegisteredEntity = await prisma.registeredEntity.delete({
     *   where: {
     *     // ... filter to delete one RegisteredEntity
     *   }
     * })
     * 
    **/
    delete<T extends RegisteredEntityDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, RegisteredEntityDeleteArgs<ExtArgs>>
    ): Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one RegisteredEntity.
     * @param {RegisteredEntityUpdateArgs} args - Arguments to update one RegisteredEntity.
     * @example
     * // Update one RegisteredEntity
     * const registeredEntity = await prisma.registeredEntity.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends RegisteredEntityUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, RegisteredEntityUpdateArgs<ExtArgs>>
    ): Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more RegisteredEntities.
     * @param {RegisteredEntityDeleteManyArgs} args - Arguments to filter RegisteredEntities to delete.
     * @example
     * // Delete a few RegisteredEntities
     * const { count } = await prisma.registeredEntity.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends RegisteredEntityDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, RegisteredEntityDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RegisteredEntities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegisteredEntityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RegisteredEntities
     * const registeredEntity = await prisma.registeredEntity.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends RegisteredEntityUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, RegisteredEntityUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one RegisteredEntity.
     * @param {RegisteredEntityUpsertArgs} args - Arguments to update or create a RegisteredEntity.
     * @example
     * // Update or create a RegisteredEntity
     * const registeredEntity = await prisma.registeredEntity.upsert({
     *   create: {
     *     // ... data to create a RegisteredEntity
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RegisteredEntity we want to update
     *   }
     * })
    **/
    upsert<T extends RegisteredEntityUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, RegisteredEntityUpsertArgs<ExtArgs>>
    ): Prisma__RegisteredEntityClient<$Types.GetResult<RegisteredEntityPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of RegisteredEntities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegisteredEntityCountArgs} args - Arguments to filter RegisteredEntities to count.
     * @example
     * // Count the number of RegisteredEntities
     * const count = await prisma.registeredEntity.count({
     *   where: {
     *     // ... the filter for the RegisteredEntities we want to count
     *   }
     * })
    **/
    count<T extends RegisteredEntityCountArgs>(
      args?: Subset<T, RegisteredEntityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RegisteredEntityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RegisteredEntity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegisteredEntityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RegisteredEntityAggregateArgs>(args: Subset<T, RegisteredEntityAggregateArgs>): Prisma.PrismaPromise<GetRegisteredEntityAggregateType<T>>

    /**
     * Group by RegisteredEntity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegisteredEntityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RegisteredEntityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RegisteredEntityGroupByArgs['orderBy'] }
        : { orderBy?: RegisteredEntityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RegisteredEntityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRegisteredEntityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for RegisteredEntity.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__RegisteredEntityClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);


    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * RegisteredEntity base type for findUnique actions
   */
  export type RegisteredEntityFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * Filter, which RegisteredEntity to fetch.
     */
    where: RegisteredEntityWhereUniqueInput
  }

  /**
   * RegisteredEntity findUnique
   */
  export interface RegisteredEntityFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends RegisteredEntityFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * RegisteredEntity findUniqueOrThrow
   */
  export type RegisteredEntityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * Filter, which RegisteredEntity to fetch.
     */
    where: RegisteredEntityWhereUniqueInput
  }


  /**
   * RegisteredEntity base type for findFirst actions
   */
  export type RegisteredEntityFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * Filter, which RegisteredEntity to fetch.
     */
    where?: RegisteredEntityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RegisteredEntities to fetch.
     */
    orderBy?: Enumerable<RegisteredEntityOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RegisteredEntities.
     */
    cursor?: RegisteredEntityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RegisteredEntities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RegisteredEntities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RegisteredEntities.
     */
    distinct?: Enumerable<RegisteredEntityScalarFieldEnum>
  }

  /**
   * RegisteredEntity findFirst
   */
  export interface RegisteredEntityFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends RegisteredEntityFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * RegisteredEntity findFirstOrThrow
   */
  export type RegisteredEntityFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * Filter, which RegisteredEntity to fetch.
     */
    where?: RegisteredEntityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RegisteredEntities to fetch.
     */
    orderBy?: Enumerable<RegisteredEntityOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RegisteredEntities.
     */
    cursor?: RegisteredEntityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RegisteredEntities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RegisteredEntities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RegisteredEntities.
     */
    distinct?: Enumerable<RegisteredEntityScalarFieldEnum>
  }


  /**
   * RegisteredEntity findMany
   */
  export type RegisteredEntityFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * Filter, which RegisteredEntities to fetch.
     */
    where?: RegisteredEntityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RegisteredEntities to fetch.
     */
    orderBy?: Enumerable<RegisteredEntityOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RegisteredEntities.
     */
    cursor?: RegisteredEntityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RegisteredEntities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RegisteredEntities.
     */
    skip?: number
    distinct?: Enumerable<RegisteredEntityScalarFieldEnum>
  }


  /**
   * RegisteredEntity create
   */
  export type RegisteredEntityCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * The data needed to create a RegisteredEntity.
     */
    data: XOR<RegisteredEntityCreateInput, RegisteredEntityUncheckedCreateInput>
  }


  /**
   * RegisteredEntity createMany
   */
  export type RegisteredEntityCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RegisteredEntities.
     */
    data: Enumerable<RegisteredEntityCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * RegisteredEntity update
   */
  export type RegisteredEntityUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * The data needed to update a RegisteredEntity.
     */
    data: XOR<RegisteredEntityUpdateInput, RegisteredEntityUncheckedUpdateInput>
    /**
     * Choose, which RegisteredEntity to update.
     */
    where: RegisteredEntityWhereUniqueInput
  }


  /**
   * RegisteredEntity updateMany
   */
  export type RegisteredEntityUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RegisteredEntities.
     */
    data: XOR<RegisteredEntityUpdateManyMutationInput, RegisteredEntityUncheckedUpdateManyInput>
    /**
     * Filter which RegisteredEntities to update
     */
    where?: RegisteredEntityWhereInput
  }


  /**
   * RegisteredEntity upsert
   */
  export type RegisteredEntityUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * The filter to search for the RegisteredEntity to update in case it exists.
     */
    where: RegisteredEntityWhereUniqueInput
    /**
     * In case the RegisteredEntity found by the `where` argument doesn't exist, create a new RegisteredEntity with this data.
     */
    create: XOR<RegisteredEntityCreateInput, RegisteredEntityUncheckedCreateInput>
    /**
     * In case the RegisteredEntity was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RegisteredEntityUpdateInput, RegisteredEntityUncheckedUpdateInput>
  }


  /**
   * RegisteredEntity delete
   */
  export type RegisteredEntityDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
    /**
     * Filter which RegisteredEntity to delete.
     */
    where: RegisteredEntityWhereUniqueInput
  }


  /**
   * RegisteredEntity deleteMany
   */
  export type RegisteredEntityDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which RegisteredEntities to delete
     */
    where?: RegisteredEntityWhereInput
  }


  /**
   * RegisteredEntity without action
   */
  export type RegisteredEntityArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RegisteredEntity
     */
    select?: RegisteredEntitySelect<ExtArgs> | null
  }



  /**
   * Model User
   */


  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    passwordHash: string | null
    role: UserRole | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    passwordHash: string | null
    role: UserRole | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    passwordHash: number
    role: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    passwordHash?: true
    role?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    passwordHash?: true
    role?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    passwordHash?: true
    role?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: Enumerable<UserOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: Enumerable<UserOrderByWithAggregationInput>
    by: UserScalarFieldEnum[]
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }


  export type UserGroupByOutputType = {
    id: string
    email: string
    name: string | null
    passwordHash: string
    role: UserRole
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    passwordHash?: boolean
    role?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    agents?: boolean | User$agentsArgs<ExtArgs>
    chatMessages?: boolean | User$chatMessagesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    passwordHash?: boolean
    role?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    agents?: boolean | User$agentsArgs<ExtArgs>
    chatMessages?: boolean | User$chatMessagesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeArgs<ExtArgs>
  }


  type UserGetPayload<S extends boolean | null | undefined | UserArgs> = $Types.GetResult<UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends UserFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'User'> extends True ? Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends UserFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'User'> extends True ? Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends UserFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<UserPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
    **/
    create<T extends UserCreateArgs<ExtArgs>>(
      args: SelectSubset<T, UserCreateArgs<ExtArgs>>
    ): Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many Users.
     *     @param {UserCreateManyArgs} args - Arguments to create many Users.
     *     @example
     *     // Create many Users
     *     const user = await prisma.user.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends UserCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
    **/
    delete<T extends UserDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, UserDeleteArgs<ExtArgs>>
    ): Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends UserUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, UserUpdateArgs<ExtArgs>>
    ): Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends UserDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends UserUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
    **/
    upsert<T extends UserUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, UserUpsertArgs<ExtArgs>>
    ): Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    agents<T extends User$agentsArgs<ExtArgs> = {}>(args?: Subset<T, User$agentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<AgentPayload<ExtArgs>, T, 'findMany', never>| Null>;

    chatMessages<T extends User$chatMessagesArgs<ExtArgs> = {}>(args?: Subset<T, User$chatMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'findMany', never>| Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * User base type for findUnique actions
   */
  export type UserFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUnique
   */
  export interface UserFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends UserFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }


  /**
   * User base type for findFirst actions
   */
  export type UserFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: Enumerable<UserOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: Enumerable<UserScalarFieldEnum>
  }

  /**
   * User findFirst
   */
  export interface UserFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends UserFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: Enumerable<UserOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: Enumerable<UserScalarFieldEnum>
  }


  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: Enumerable<UserOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: Enumerable<UserScalarFieldEnum>
  }


  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }


  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: Enumerable<UserCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }


  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }


  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }


  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }


  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }


  /**
   * User.agents
   */
  export type User$agentsArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: AgentInclude<ExtArgs> | null
    where?: AgentWhereInput
    orderBy?: Enumerable<AgentOrderByWithRelationInput>
    cursor?: AgentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<AgentScalarFieldEnum>
  }


  /**
   * User.chatMessages
   */
  export type User$chatMessagesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    where?: ChatMessageWhereInput
    orderBy?: Enumerable<ChatMessageOrderByWithRelationInput>
    cursor?: ChatMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<ChatMessageScalarFieldEnum>
  }


  /**
   * User without action
   */
  export type UserArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
  }



  /**
   * Model ChatMessage
   */


  export type AggregateChatMessage = {
    _count: ChatMessageCountAggregateOutputType | null
    _min: ChatMessageMinAggregateOutputType | null
    _max: ChatMessageMaxAggregateOutputType | null
  }

  export type ChatMessageMinAggregateOutputType = {
    id: string | null
    content: string | null
    role: string | null
    userId: string | null
    sessionId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChatMessageMaxAggregateOutputType = {
    id: string | null
    content: string | null
    role: string | null
    userId: string | null
    sessionId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChatMessageCountAggregateOutputType = {
    id: number
    content: number
    role: number
    userId: number
    sessionId: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ChatMessageMinAggregateInputType = {
    id?: true
    content?: true
    role?: true
    userId?: true
    sessionId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChatMessageMaxAggregateInputType = {
    id?: true
    content?: true
    role?: true
    userId?: true
    sessionId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChatMessageCountAggregateInputType = {
    id?: true
    content?: true
    role?: true
    userId?: true
    sessionId?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ChatMessageAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatMessage to aggregate.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: Enumerable<ChatMessageOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChatMessages
    **/
    _count?: true | ChatMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChatMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChatMessageMaxAggregateInputType
  }

  export type GetChatMessageAggregateType<T extends ChatMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateChatMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChatMessage[P]>
      : GetScalarType<T[P], AggregateChatMessage[P]>
  }




  export type ChatMessageGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: ChatMessageWhereInput
    orderBy?: Enumerable<ChatMessageOrderByWithAggregationInput>
    by: ChatMessageScalarFieldEnum[]
    having?: ChatMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChatMessageCountAggregateInputType | true
    _min?: ChatMessageMinAggregateInputType
    _max?: ChatMessageMaxAggregateInputType
  }


  export type ChatMessageGroupByOutputType = {
    id: string
    content: string
    role: string
    userId: string
    sessionId: string | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ChatMessageCountAggregateOutputType | null
    _min: ChatMessageMinAggregateOutputType | null
    _max: ChatMessageMaxAggregateOutputType | null
  }

  type GetChatMessageGroupByPayload<T extends ChatMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<ChatMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChatMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChatMessageGroupByOutputType[P]>
            : GetScalarType<T[P], ChatMessageGroupByOutputType[P]>
        }
      >
    >


  export type ChatMessageSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    role?: boolean
    userId?: boolean
    sessionId?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserArgs<ExtArgs>
  }, ExtArgs["result"]["chatMessage"]>

  export type ChatMessageSelectScalar = {
    id?: boolean
    content?: boolean
    role?: boolean
    userId?: boolean
    sessionId?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ChatMessageInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    user?: boolean | UserArgs<ExtArgs>
  }


  type ChatMessageGetPayload<S extends boolean | null | undefined | ChatMessageArgs> = $Types.GetResult<ChatMessagePayload, S>

  type ChatMessageCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<ChatMessageFindManyArgs, 'select' | 'include'> & {
      select?: ChatMessageCountAggregateInputType | true
    }

  export interface ChatMessageDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChatMessage'], meta: { name: 'ChatMessage' } }
    /**
     * Find zero or one ChatMessage that matches the filter.
     * @param {ChatMessageFindUniqueArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends ChatMessageFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, ChatMessageFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'ChatMessage'> extends True ? Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one ChatMessage that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {ChatMessageFindUniqueOrThrowArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends ChatMessageFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, ChatMessageFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first ChatMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindFirstArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends ChatMessageFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, ChatMessageFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'ChatMessage'> extends True ? Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first ChatMessage that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindFirstOrThrowArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends ChatMessageFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, ChatMessageFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more ChatMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChatMessages
     * const chatMessages = await prisma.chatMessage.findMany()
     * 
     * // Get first 10 ChatMessages
     * const chatMessages = await prisma.chatMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chatMessageWithIdOnly = await prisma.chatMessage.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends ChatMessageFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, ChatMessageFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a ChatMessage.
     * @param {ChatMessageCreateArgs} args - Arguments to create a ChatMessage.
     * @example
     * // Create one ChatMessage
     * const ChatMessage = await prisma.chatMessage.create({
     *   data: {
     *     // ... data to create a ChatMessage
     *   }
     * })
     * 
    **/
    create<T extends ChatMessageCreateArgs<ExtArgs>>(
      args: SelectSubset<T, ChatMessageCreateArgs<ExtArgs>>
    ): Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many ChatMessages.
     *     @param {ChatMessageCreateManyArgs} args - Arguments to create many ChatMessages.
     *     @example
     *     // Create many ChatMessages
     *     const chatMessage = await prisma.chatMessage.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends ChatMessageCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, ChatMessageCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a ChatMessage.
     * @param {ChatMessageDeleteArgs} args - Arguments to delete one ChatMessage.
     * @example
     * // Delete one ChatMessage
     * const ChatMessage = await prisma.chatMessage.delete({
     *   where: {
     *     // ... filter to delete one ChatMessage
     *   }
     * })
     * 
    **/
    delete<T extends ChatMessageDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, ChatMessageDeleteArgs<ExtArgs>>
    ): Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one ChatMessage.
     * @param {ChatMessageUpdateArgs} args - Arguments to update one ChatMessage.
     * @example
     * // Update one ChatMessage
     * const chatMessage = await prisma.chatMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends ChatMessageUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, ChatMessageUpdateArgs<ExtArgs>>
    ): Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more ChatMessages.
     * @param {ChatMessageDeleteManyArgs} args - Arguments to filter ChatMessages to delete.
     * @example
     * // Delete a few ChatMessages
     * const { count } = await prisma.chatMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends ChatMessageDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, ChatMessageDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChatMessages
     * const chatMessage = await prisma.chatMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends ChatMessageUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, ChatMessageUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ChatMessage.
     * @param {ChatMessageUpsertArgs} args - Arguments to update or create a ChatMessage.
     * @example
     * // Update or create a ChatMessage
     * const chatMessage = await prisma.chatMessage.upsert({
     *   create: {
     *     // ... data to create a ChatMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChatMessage we want to update
     *   }
     * })
    **/
    upsert<T extends ChatMessageUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, ChatMessageUpsertArgs<ExtArgs>>
    ): Prisma__ChatMessageClient<$Types.GetResult<ChatMessagePayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of ChatMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageCountArgs} args - Arguments to filter ChatMessages to count.
     * @example
     * // Count the number of ChatMessages
     * const count = await prisma.chatMessage.count({
     *   where: {
     *     // ... the filter for the ChatMessages we want to count
     *   }
     * })
    **/
    count<T extends ChatMessageCountArgs>(
      args?: Subset<T, ChatMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChatMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChatMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChatMessageAggregateArgs>(args: Subset<T, ChatMessageAggregateArgs>): Prisma.PrismaPromise<GetChatMessageAggregateType<T>>

    /**
     * Group by ChatMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChatMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChatMessageGroupByArgs['orderBy'] }
        : { orderBy?: ChatMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChatMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChatMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for ChatMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__ChatMessageClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    user<T extends UserArgs<ExtArgs> = {}>(args?: Subset<T, UserArgs<ExtArgs>>): Prisma__UserClient<$Types.GetResult<UserPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * ChatMessage base type for findUnique actions
   */
  export type ChatMessageFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage findUnique
   */
  export interface ChatMessageFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends ChatMessageFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * ChatMessage findUniqueOrThrow
   */
  export type ChatMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where: ChatMessageWhereUniqueInput
  }


  /**
   * ChatMessage base type for findFirst actions
   */
  export type ChatMessageFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: Enumerable<ChatMessageOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatMessages.
     */
    distinct?: Enumerable<ChatMessageScalarFieldEnum>
  }

  /**
   * ChatMessage findFirst
   */
  export interface ChatMessageFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends ChatMessageFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * ChatMessage findFirstOrThrow
   */
  export type ChatMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: Enumerable<ChatMessageOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatMessages.
     */
    distinct?: Enumerable<ChatMessageScalarFieldEnum>
  }


  /**
   * ChatMessage findMany
   */
  export type ChatMessageFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessages to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: Enumerable<ChatMessageOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    distinct?: Enumerable<ChatMessageScalarFieldEnum>
  }


  /**
   * ChatMessage create
   */
  export type ChatMessageCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a ChatMessage.
     */
    data: XOR<ChatMessageCreateInput, ChatMessageUncheckedCreateInput>
  }


  /**
   * ChatMessage createMany
   */
  export type ChatMessageCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChatMessages.
     */
    data: Enumerable<ChatMessageCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * ChatMessage update
   */
  export type ChatMessageUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a ChatMessage.
     */
    data: XOR<ChatMessageUpdateInput, ChatMessageUncheckedUpdateInput>
    /**
     * Choose, which ChatMessage to update.
     */
    where: ChatMessageWhereUniqueInput
  }


  /**
   * ChatMessage updateMany
   */
  export type ChatMessageUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChatMessages.
     */
    data: XOR<ChatMessageUpdateManyMutationInput, ChatMessageUncheckedUpdateManyInput>
    /**
     * Filter which ChatMessages to update
     */
    where?: ChatMessageWhereInput
  }


  /**
   * ChatMessage upsert
   */
  export type ChatMessageUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the ChatMessage to update in case it exists.
     */
    where: ChatMessageWhereUniqueInput
    /**
     * In case the ChatMessage found by the `where` argument doesn't exist, create a new ChatMessage with this data.
     */
    create: XOR<ChatMessageCreateInput, ChatMessageUncheckedCreateInput>
    /**
     * In case the ChatMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChatMessageUpdateInput, ChatMessageUncheckedUpdateInput>
  }


  /**
   * ChatMessage delete
   */
  export type ChatMessageDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter which ChatMessage to delete.
     */
    where: ChatMessageWhereUniqueInput
  }


  /**
   * ChatMessage deleteMany
   */
  export type ChatMessageDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatMessages to delete
     */
    where?: ChatMessageWhereInput
  }


  /**
   * ChatMessage without action
   */
  export type ChatMessageArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: ChatMessageInclude<ExtArgs> | null
  }



  /**
   * Model A2AAgent
   */


  export type AggregateA2AAgent = {
    _count: A2AAgentCountAggregateOutputType | null
    _min: A2AAgentMinAggregateOutputType | null
    _max: A2AAgentMaxAggregateOutputType | null
  }

  export type A2AAgentMinAggregateOutputType = {
    id: string | null
    agentId: string | null
    name: string | null
    type: string | null
    version: string | null
    description: string | null
    status: A2AAgentStatus | null
    lastHeartbeat: Date | null
    registeredAt: Date | null
    updatedAt: Date | null
  }

  export type A2AAgentMaxAggregateOutputType = {
    id: string | null
    agentId: string | null
    name: string | null
    type: string | null
    version: string | null
    description: string | null
    status: A2AAgentStatus | null
    lastHeartbeat: Date | null
    registeredAt: Date | null
    updatedAt: Date | null
  }

  export type A2AAgentCountAggregateOutputType = {
    id: number
    agentId: number
    name: number
    type: number
    version: number
    description: number
    metadata: number
    endpoints: number
    authentication: number
    status: number
    lastHeartbeat: number
    registeredAt: number
    updatedAt: number
    _all: number
  }


  export type A2AAgentMinAggregateInputType = {
    id?: true
    agentId?: true
    name?: true
    type?: true
    version?: true
    description?: true
    status?: true
    lastHeartbeat?: true
    registeredAt?: true
    updatedAt?: true
  }

  export type A2AAgentMaxAggregateInputType = {
    id?: true
    agentId?: true
    name?: true
    type?: true
    version?: true
    description?: true
    status?: true
    lastHeartbeat?: true
    registeredAt?: true
    updatedAt?: true
  }

  export type A2AAgentCountAggregateInputType = {
    id?: true
    agentId?: true
    name?: true
    type?: true
    version?: true
    description?: true
    metadata?: true
    endpoints?: true
    authentication?: true
    status?: true
    lastHeartbeat?: true
    registeredAt?: true
    updatedAt?: true
    _all?: true
  }

  export type A2AAgentAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AAgent to aggregate.
     */
    where?: A2AAgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AAgents to fetch.
     */
    orderBy?: Enumerable<A2AAgentOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: A2AAgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AAgents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AAgents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned A2AAgents
    **/
    _count?: true | A2AAgentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: A2AAgentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: A2AAgentMaxAggregateInputType
  }

  export type GetA2AAgentAggregateType<T extends A2AAgentAggregateArgs> = {
        [P in keyof T & keyof AggregateA2AAgent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateA2AAgent[P]>
      : GetScalarType<T[P], AggregateA2AAgent[P]>
  }




  export type A2AAgentGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AAgentWhereInput
    orderBy?: Enumerable<A2AAgentOrderByWithAggregationInput>
    by: A2AAgentScalarFieldEnum[]
    having?: A2AAgentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: A2AAgentCountAggregateInputType | true
    _min?: A2AAgentMinAggregateInputType
    _max?: A2AAgentMaxAggregateInputType
  }


  export type A2AAgentGroupByOutputType = {
    id: string
    agentId: string
    name: string
    type: string
    version: string
    description: string | null
    metadata: JsonValue | null
    endpoints: JsonValue | null
    authentication: JsonValue | null
    status: A2AAgentStatus
    lastHeartbeat: Date | null
    registeredAt: Date
    updatedAt: Date
    _count: A2AAgentCountAggregateOutputType | null
    _min: A2AAgentMinAggregateOutputType | null
    _max: A2AAgentMaxAggregateOutputType | null
  }

  type GetA2AAgentGroupByPayload<T extends A2AAgentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<A2AAgentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof A2AAgentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], A2AAgentGroupByOutputType[P]>
            : GetScalarType<T[P], A2AAgentGroupByOutputType[P]>
        }
      >
    >


  export type A2AAgentSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    name?: boolean
    type?: boolean
    version?: boolean
    description?: boolean
    metadata?: boolean
    endpoints?: boolean
    authentication?: boolean
    status?: boolean
    lastHeartbeat?: boolean
    registeredAt?: boolean
    updatedAt?: boolean
    capabilities?: boolean | A2AAgent$capabilitiesArgs<ExtArgs>
    sentMessages?: boolean | A2AAgent$sentMessagesArgs<ExtArgs>
    receivedMessages?: boolean | A2AAgent$receivedMessagesArgs<ExtArgs>
    conversations?: boolean | A2AAgent$conversationsArgs<ExtArgs>
    heartbeats?: boolean | A2AAgent$heartbeatsArgs<ExtArgs>
    _count?: boolean | A2AAgentCountOutputTypeArgs<ExtArgs>
  }, ExtArgs["result"]["a2AAgent"]>

  export type A2AAgentSelectScalar = {
    id?: boolean
    agentId?: boolean
    name?: boolean
    type?: boolean
    version?: boolean
    description?: boolean
    metadata?: boolean
    endpoints?: boolean
    authentication?: boolean
    status?: boolean
    lastHeartbeat?: boolean
    registeredAt?: boolean
    updatedAt?: boolean
  }

  export type A2AAgentInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    capabilities?: boolean | A2AAgent$capabilitiesArgs<ExtArgs>
    sentMessages?: boolean | A2AAgent$sentMessagesArgs<ExtArgs>
    receivedMessages?: boolean | A2AAgent$receivedMessagesArgs<ExtArgs>
    conversations?: boolean | A2AAgent$conversationsArgs<ExtArgs>
    heartbeats?: boolean | A2AAgent$heartbeatsArgs<ExtArgs>
    _count?: boolean | A2AAgentCountOutputTypeArgs<ExtArgs>
  }


  type A2AAgentGetPayload<S extends boolean | null | undefined | A2AAgentArgs> = $Types.GetResult<A2AAgentPayload, S>

  type A2AAgentCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<A2AAgentFindManyArgs, 'select' | 'include'> & {
      select?: A2AAgentCountAggregateInputType | true
    }

  export interface A2AAgentDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['A2AAgent'], meta: { name: 'A2AAgent' } }
    /**
     * Find zero or one A2AAgent that matches the filter.
     * @param {A2AAgentFindUniqueArgs} args - Arguments to find a A2AAgent
     * @example
     * // Get one A2AAgent
     * const a2AAgent = await prisma.a2AAgent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends A2AAgentFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, A2AAgentFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'A2AAgent'> extends True ? Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one A2AAgent that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {A2AAgentFindUniqueOrThrowArgs} args - Arguments to find a A2AAgent
     * @example
     * // Get one A2AAgent
     * const a2AAgent = await prisma.a2AAgent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends A2AAgentFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first A2AAgent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentFindFirstArgs} args - Arguments to find a A2AAgent
     * @example
     * // Get one A2AAgent
     * const a2AAgent = await prisma.a2AAgent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends A2AAgentFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, A2AAgentFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'A2AAgent'> extends True ? Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first A2AAgent that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentFindFirstOrThrowArgs} args - Arguments to find a A2AAgent
     * @example
     * // Get one A2AAgent
     * const a2AAgent = await prisma.a2AAgent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends A2AAgentFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more A2AAgents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all A2AAgents
     * const a2AAgents = await prisma.a2AAgent.findMany()
     * 
     * // Get first 10 A2AAgents
     * const a2AAgents = await prisma.a2AAgent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const a2AAgentWithIdOnly = await prisma.a2AAgent.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends A2AAgentFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a A2AAgent.
     * @param {A2AAgentCreateArgs} args - Arguments to create a A2AAgent.
     * @example
     * // Create one A2AAgent
     * const A2AAgent = await prisma.a2AAgent.create({
     *   data: {
     *     // ... data to create a A2AAgent
     *   }
     * })
     * 
    **/
    create<T extends A2AAgentCreateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentCreateArgs<ExtArgs>>
    ): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many A2AAgents.
     *     @param {A2AAgentCreateManyArgs} args - Arguments to create many A2AAgents.
     *     @example
     *     // Create many A2AAgents
     *     const a2AAgent = await prisma.a2AAgent.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends A2AAgentCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a A2AAgent.
     * @param {A2AAgentDeleteArgs} args - Arguments to delete one A2AAgent.
     * @example
     * // Delete one A2AAgent
     * const A2AAgent = await prisma.a2AAgent.delete({
     *   where: {
     *     // ... filter to delete one A2AAgent
     *   }
     * })
     * 
    **/
    delete<T extends A2AAgentDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentDeleteArgs<ExtArgs>>
    ): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one A2AAgent.
     * @param {A2AAgentUpdateArgs} args - Arguments to update one A2AAgent.
     * @example
     * // Update one A2AAgent
     * const a2AAgent = await prisma.a2AAgent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends A2AAgentUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentUpdateArgs<ExtArgs>>
    ): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more A2AAgents.
     * @param {A2AAgentDeleteManyArgs} args - Arguments to filter A2AAgents to delete.
     * @example
     * // Delete a few A2AAgents
     * const { count } = await prisma.a2AAgent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends A2AAgentDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more A2AAgents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many A2AAgents
     * const a2AAgent = await prisma.a2AAgent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends A2AAgentUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one A2AAgent.
     * @param {A2AAgentUpsertArgs} args - Arguments to update or create a A2AAgent.
     * @example
     * // Update or create a A2AAgent
     * const a2AAgent = await prisma.a2AAgent.upsert({
     *   create: {
     *     // ... data to create a A2AAgent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the A2AAgent we want to update
     *   }
     * })
    **/
    upsert<T extends A2AAgentUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentUpsertArgs<ExtArgs>>
    ): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of A2AAgents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentCountArgs} args - Arguments to filter A2AAgents to count.
     * @example
     * // Count the number of A2AAgents
     * const count = await prisma.a2AAgent.count({
     *   where: {
     *     // ... the filter for the A2AAgents we want to count
     *   }
     * })
    **/
    count<T extends A2AAgentCountArgs>(
      args?: Subset<T, A2AAgentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], A2AAgentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a A2AAgent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends A2AAgentAggregateArgs>(args: Subset<T, A2AAgentAggregateArgs>): Prisma.PrismaPromise<GetA2AAgentAggregateType<T>>

    /**
     * Group by A2AAgent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends A2AAgentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: A2AAgentGroupByArgs['orderBy'] }
        : { orderBy?: A2AAgentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, A2AAgentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetA2AAgentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for A2AAgent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__A2AAgentClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    capabilities<T extends A2AAgent$capabilitiesArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgent$capabilitiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'findMany', never>| Null>;

    sentMessages<T extends A2AAgent$sentMessagesArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgent$sentMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findMany', never>| Null>;

    receivedMessages<T extends A2AAgent$receivedMessagesArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgent$receivedMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findMany', never>| Null>;

    conversations<T extends A2AAgent$conversationsArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgent$conversationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findMany', never>| Null>;

    heartbeats<T extends A2AAgent$heartbeatsArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgent$heartbeatsArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'findMany', never>| Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * A2AAgent base type for findUnique actions
   */
  export type A2AAgentFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgent to fetch.
     */
    where: A2AAgentWhereUniqueInput
  }

  /**
   * A2AAgent findUnique
   */
  export interface A2AAgentFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AAgentFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AAgent findUniqueOrThrow
   */
  export type A2AAgentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgent to fetch.
     */
    where: A2AAgentWhereUniqueInput
  }


  /**
   * A2AAgent base type for findFirst actions
   */
  export type A2AAgentFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgent to fetch.
     */
    where?: A2AAgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AAgents to fetch.
     */
    orderBy?: Enumerable<A2AAgentOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AAgents.
     */
    cursor?: A2AAgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AAgents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AAgents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AAgents.
     */
    distinct?: Enumerable<A2AAgentScalarFieldEnum>
  }

  /**
   * A2AAgent findFirst
   */
  export interface A2AAgentFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AAgentFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AAgent findFirstOrThrow
   */
  export type A2AAgentFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgent to fetch.
     */
    where?: A2AAgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AAgents to fetch.
     */
    orderBy?: Enumerable<A2AAgentOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AAgents.
     */
    cursor?: A2AAgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AAgents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AAgents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AAgents.
     */
    distinct?: Enumerable<A2AAgentScalarFieldEnum>
  }


  /**
   * A2AAgent findMany
   */
  export type A2AAgentFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgents to fetch.
     */
    where?: A2AAgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AAgents to fetch.
     */
    orderBy?: Enumerable<A2AAgentOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing A2AAgents.
     */
    cursor?: A2AAgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AAgents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AAgents.
     */
    skip?: number
    distinct?: Enumerable<A2AAgentScalarFieldEnum>
  }


  /**
   * A2AAgent create
   */
  export type A2AAgentCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * The data needed to create a A2AAgent.
     */
    data: XOR<A2AAgentCreateInput, A2AAgentUncheckedCreateInput>
  }


  /**
   * A2AAgent createMany
   */
  export type A2AAgentCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many A2AAgents.
     */
    data: Enumerable<A2AAgentCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * A2AAgent update
   */
  export type A2AAgentUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * The data needed to update a A2AAgent.
     */
    data: XOR<A2AAgentUpdateInput, A2AAgentUncheckedUpdateInput>
    /**
     * Choose, which A2AAgent to update.
     */
    where: A2AAgentWhereUniqueInput
  }


  /**
   * A2AAgent updateMany
   */
  export type A2AAgentUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update A2AAgents.
     */
    data: XOR<A2AAgentUpdateManyMutationInput, A2AAgentUncheckedUpdateManyInput>
    /**
     * Filter which A2AAgents to update
     */
    where?: A2AAgentWhereInput
  }


  /**
   * A2AAgent upsert
   */
  export type A2AAgentUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * The filter to search for the A2AAgent to update in case it exists.
     */
    where: A2AAgentWhereUniqueInput
    /**
     * In case the A2AAgent found by the `where` argument doesn't exist, create a new A2AAgent with this data.
     */
    create: XOR<A2AAgentCreateInput, A2AAgentUncheckedCreateInput>
    /**
     * In case the A2AAgent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<A2AAgentUpdateInput, A2AAgentUncheckedUpdateInput>
  }


  /**
   * A2AAgent delete
   */
  export type A2AAgentDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
    /**
     * Filter which A2AAgent to delete.
     */
    where: A2AAgentWhereUniqueInput
  }


  /**
   * A2AAgent deleteMany
   */
  export type A2AAgentDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AAgents to delete
     */
    where?: A2AAgentWhereInput
  }


  /**
   * A2AAgent.capabilities
   */
  export type A2AAgent$capabilitiesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    where?: A2AAgentCapabilityWhereInput
    orderBy?: Enumerable<A2AAgentCapabilityOrderByWithRelationInput>
    cursor?: A2AAgentCapabilityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<A2AAgentCapabilityScalarFieldEnum>
  }


  /**
   * A2AAgent.sentMessages
   */
  export type A2AAgent$sentMessagesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    where?: A2AMessageWhereInput
    orderBy?: Enumerable<A2AMessageOrderByWithRelationInput>
    cursor?: A2AMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<A2AMessageScalarFieldEnum>
  }


  /**
   * A2AAgent.receivedMessages
   */
  export type A2AAgent$receivedMessagesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    where?: A2AMessageWhereInput
    orderBy?: Enumerable<A2AMessageOrderByWithRelationInput>
    cursor?: A2AMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<A2AMessageScalarFieldEnum>
  }


  /**
   * A2AAgent.conversations
   */
  export type A2AAgent$conversationsArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    where?: A2AConversationParticipantWhereInput
    orderBy?: Enumerable<A2AConversationParticipantOrderByWithRelationInput>
    cursor?: A2AConversationParticipantWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<A2AConversationParticipantScalarFieldEnum>
  }


  /**
   * A2AAgent.heartbeats
   */
  export type A2AAgent$heartbeatsArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    where?: A2AHeartbeatWhereInput
    orderBy?: Enumerable<A2AHeartbeatOrderByWithRelationInput>
    cursor?: A2AHeartbeatWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<A2AHeartbeatScalarFieldEnum>
  }


  /**
   * A2AAgent without action
   */
  export type A2AAgentArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgent
     */
    select?: A2AAgentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentInclude<ExtArgs> | null
  }



  /**
   * Model A2AAgentCapability
   */


  export type AggregateA2AAgentCapability = {
    _count: A2AAgentCapabilityCountAggregateOutputType | null
    _min: A2AAgentCapabilityMinAggregateOutputType | null
    _max: A2AAgentCapabilityMaxAggregateOutputType | null
  }

  export type A2AAgentCapabilityMinAggregateOutputType = {
    id: string | null
    agentId: string | null
    name: string | null
    description: string | null
    version: string | null
  }

  export type A2AAgentCapabilityMaxAggregateOutputType = {
    id: string | null
    agentId: string | null
    name: string | null
    description: string | null
    version: string | null
  }

  export type A2AAgentCapabilityCountAggregateOutputType = {
    id: number
    agentId: number
    name: number
    description: number
    version: number
    parameters: number
    metadata: number
    _all: number
  }


  export type A2AAgentCapabilityMinAggregateInputType = {
    id?: true
    agentId?: true
    name?: true
    description?: true
    version?: true
  }

  export type A2AAgentCapabilityMaxAggregateInputType = {
    id?: true
    agentId?: true
    name?: true
    description?: true
    version?: true
  }

  export type A2AAgentCapabilityCountAggregateInputType = {
    id?: true
    agentId?: true
    name?: true
    description?: true
    version?: true
    parameters?: true
    metadata?: true
    _all?: true
  }

  export type A2AAgentCapabilityAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AAgentCapability to aggregate.
     */
    where?: A2AAgentCapabilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AAgentCapabilities to fetch.
     */
    orderBy?: Enumerable<A2AAgentCapabilityOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: A2AAgentCapabilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AAgentCapabilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AAgentCapabilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned A2AAgentCapabilities
    **/
    _count?: true | A2AAgentCapabilityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: A2AAgentCapabilityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: A2AAgentCapabilityMaxAggregateInputType
  }

  export type GetA2AAgentCapabilityAggregateType<T extends A2AAgentCapabilityAggregateArgs> = {
        [P in keyof T & keyof AggregateA2AAgentCapability]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateA2AAgentCapability[P]>
      : GetScalarType<T[P], AggregateA2AAgentCapability[P]>
  }




  export type A2AAgentCapabilityGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AAgentCapabilityWhereInput
    orderBy?: Enumerable<A2AAgentCapabilityOrderByWithAggregationInput>
    by: A2AAgentCapabilityScalarFieldEnum[]
    having?: A2AAgentCapabilityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: A2AAgentCapabilityCountAggregateInputType | true
    _min?: A2AAgentCapabilityMinAggregateInputType
    _max?: A2AAgentCapabilityMaxAggregateInputType
  }


  export type A2AAgentCapabilityGroupByOutputType = {
    id: string
    agentId: string
    name: string
    description: string | null
    version: string
    parameters: JsonValue | null
    metadata: JsonValue | null
    _count: A2AAgentCapabilityCountAggregateOutputType | null
    _min: A2AAgentCapabilityMinAggregateOutputType | null
    _max: A2AAgentCapabilityMaxAggregateOutputType | null
  }

  type GetA2AAgentCapabilityGroupByPayload<T extends A2AAgentCapabilityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<A2AAgentCapabilityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof A2AAgentCapabilityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], A2AAgentCapabilityGroupByOutputType[P]>
            : GetScalarType<T[P], A2AAgentCapabilityGroupByOutputType[P]>
        }
      >
    >


  export type A2AAgentCapabilitySelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    name?: boolean
    description?: boolean
    version?: boolean
    parameters?: boolean
    metadata?: boolean
    agent?: boolean | A2AAgentArgs<ExtArgs>
  }, ExtArgs["result"]["a2AAgentCapability"]>

  export type A2AAgentCapabilitySelectScalar = {
    id?: boolean
    agentId?: boolean
    name?: boolean
    description?: boolean
    version?: boolean
    parameters?: boolean
    metadata?: boolean
  }

  export type A2AAgentCapabilityInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    agent?: boolean | A2AAgentArgs<ExtArgs>
  }


  type A2AAgentCapabilityGetPayload<S extends boolean | null | undefined | A2AAgentCapabilityArgs> = $Types.GetResult<A2AAgentCapabilityPayload, S>

  type A2AAgentCapabilityCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<A2AAgentCapabilityFindManyArgs, 'select' | 'include'> & {
      select?: A2AAgentCapabilityCountAggregateInputType | true
    }

  export interface A2AAgentCapabilityDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['A2AAgentCapability'], meta: { name: 'A2AAgentCapability' } }
    /**
     * Find zero or one A2AAgentCapability that matches the filter.
     * @param {A2AAgentCapabilityFindUniqueArgs} args - Arguments to find a A2AAgentCapability
     * @example
     * // Get one A2AAgentCapability
     * const a2AAgentCapability = await prisma.a2AAgentCapability.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends A2AAgentCapabilityFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, A2AAgentCapabilityFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'A2AAgentCapability'> extends True ? Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one A2AAgentCapability that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {A2AAgentCapabilityFindUniqueOrThrowArgs} args - Arguments to find a A2AAgentCapability
     * @example
     * // Get one A2AAgentCapability
     * const a2AAgentCapability = await prisma.a2AAgentCapability.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends A2AAgentCapabilityFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentCapabilityFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first A2AAgentCapability that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentCapabilityFindFirstArgs} args - Arguments to find a A2AAgentCapability
     * @example
     * // Get one A2AAgentCapability
     * const a2AAgentCapability = await prisma.a2AAgentCapability.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends A2AAgentCapabilityFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, A2AAgentCapabilityFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'A2AAgentCapability'> extends True ? Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first A2AAgentCapability that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentCapabilityFindFirstOrThrowArgs} args - Arguments to find a A2AAgentCapability
     * @example
     * // Get one A2AAgentCapability
     * const a2AAgentCapability = await prisma.a2AAgentCapability.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends A2AAgentCapabilityFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentCapabilityFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more A2AAgentCapabilities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentCapabilityFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all A2AAgentCapabilities
     * const a2AAgentCapabilities = await prisma.a2AAgentCapability.findMany()
     * 
     * // Get first 10 A2AAgentCapabilities
     * const a2AAgentCapabilities = await prisma.a2AAgentCapability.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const a2AAgentCapabilityWithIdOnly = await prisma.a2AAgentCapability.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends A2AAgentCapabilityFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentCapabilityFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a A2AAgentCapability.
     * @param {A2AAgentCapabilityCreateArgs} args - Arguments to create a A2AAgentCapability.
     * @example
     * // Create one A2AAgentCapability
     * const A2AAgentCapability = await prisma.a2AAgentCapability.create({
     *   data: {
     *     // ... data to create a A2AAgentCapability
     *   }
     * })
     * 
    **/
    create<T extends A2AAgentCapabilityCreateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentCapabilityCreateArgs<ExtArgs>>
    ): Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many A2AAgentCapabilities.
     *     @param {A2AAgentCapabilityCreateManyArgs} args - Arguments to create many A2AAgentCapabilities.
     *     @example
     *     // Create many A2AAgentCapabilities
     *     const a2AAgentCapability = await prisma.a2AAgentCapability.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends A2AAgentCapabilityCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentCapabilityCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a A2AAgentCapability.
     * @param {A2AAgentCapabilityDeleteArgs} args - Arguments to delete one A2AAgentCapability.
     * @example
     * // Delete one A2AAgentCapability
     * const A2AAgentCapability = await prisma.a2AAgentCapability.delete({
     *   where: {
     *     // ... filter to delete one A2AAgentCapability
     *   }
     * })
     * 
    **/
    delete<T extends A2AAgentCapabilityDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentCapabilityDeleteArgs<ExtArgs>>
    ): Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one A2AAgentCapability.
     * @param {A2AAgentCapabilityUpdateArgs} args - Arguments to update one A2AAgentCapability.
     * @example
     * // Update one A2AAgentCapability
     * const a2AAgentCapability = await prisma.a2AAgentCapability.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends A2AAgentCapabilityUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentCapabilityUpdateArgs<ExtArgs>>
    ): Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more A2AAgentCapabilities.
     * @param {A2AAgentCapabilityDeleteManyArgs} args - Arguments to filter A2AAgentCapabilities to delete.
     * @example
     * // Delete a few A2AAgentCapabilities
     * const { count } = await prisma.a2AAgentCapability.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends A2AAgentCapabilityDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AAgentCapabilityDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more A2AAgentCapabilities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentCapabilityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many A2AAgentCapabilities
     * const a2AAgentCapability = await prisma.a2AAgentCapability.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends A2AAgentCapabilityUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentCapabilityUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one A2AAgentCapability.
     * @param {A2AAgentCapabilityUpsertArgs} args - Arguments to update or create a A2AAgentCapability.
     * @example
     * // Update or create a A2AAgentCapability
     * const a2AAgentCapability = await prisma.a2AAgentCapability.upsert({
     *   create: {
     *     // ... data to create a A2AAgentCapability
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the A2AAgentCapability we want to update
     *   }
     * })
    **/
    upsert<T extends A2AAgentCapabilityUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, A2AAgentCapabilityUpsertArgs<ExtArgs>>
    ): Prisma__A2AAgentCapabilityClient<$Types.GetResult<A2AAgentCapabilityPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of A2AAgentCapabilities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentCapabilityCountArgs} args - Arguments to filter A2AAgentCapabilities to count.
     * @example
     * // Count the number of A2AAgentCapabilities
     * const count = await prisma.a2AAgentCapability.count({
     *   where: {
     *     // ... the filter for the A2AAgentCapabilities we want to count
     *   }
     * })
    **/
    count<T extends A2AAgentCapabilityCountArgs>(
      args?: Subset<T, A2AAgentCapabilityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], A2AAgentCapabilityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a A2AAgentCapability.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentCapabilityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends A2AAgentCapabilityAggregateArgs>(args: Subset<T, A2AAgentCapabilityAggregateArgs>): Prisma.PrismaPromise<GetA2AAgentCapabilityAggregateType<T>>

    /**
     * Group by A2AAgentCapability.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AAgentCapabilityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends A2AAgentCapabilityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: A2AAgentCapabilityGroupByArgs['orderBy'] }
        : { orderBy?: A2AAgentCapabilityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, A2AAgentCapabilityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetA2AAgentCapabilityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for A2AAgentCapability.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__A2AAgentCapabilityClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    agent<T extends A2AAgentArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgentArgs<ExtArgs>>): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * A2AAgentCapability base type for findUnique actions
   */
  export type A2AAgentCapabilityFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgentCapability to fetch.
     */
    where: A2AAgentCapabilityWhereUniqueInput
  }

  /**
   * A2AAgentCapability findUnique
   */
  export interface A2AAgentCapabilityFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AAgentCapabilityFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AAgentCapability findUniqueOrThrow
   */
  export type A2AAgentCapabilityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgentCapability to fetch.
     */
    where: A2AAgentCapabilityWhereUniqueInput
  }


  /**
   * A2AAgentCapability base type for findFirst actions
   */
  export type A2AAgentCapabilityFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgentCapability to fetch.
     */
    where?: A2AAgentCapabilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AAgentCapabilities to fetch.
     */
    orderBy?: Enumerable<A2AAgentCapabilityOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AAgentCapabilities.
     */
    cursor?: A2AAgentCapabilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AAgentCapabilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AAgentCapabilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AAgentCapabilities.
     */
    distinct?: Enumerable<A2AAgentCapabilityScalarFieldEnum>
  }

  /**
   * A2AAgentCapability findFirst
   */
  export interface A2AAgentCapabilityFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AAgentCapabilityFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AAgentCapability findFirstOrThrow
   */
  export type A2AAgentCapabilityFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgentCapability to fetch.
     */
    where?: A2AAgentCapabilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AAgentCapabilities to fetch.
     */
    orderBy?: Enumerable<A2AAgentCapabilityOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AAgentCapabilities.
     */
    cursor?: A2AAgentCapabilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AAgentCapabilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AAgentCapabilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AAgentCapabilities.
     */
    distinct?: Enumerable<A2AAgentCapabilityScalarFieldEnum>
  }


  /**
   * A2AAgentCapability findMany
   */
  export type A2AAgentCapabilityFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * Filter, which A2AAgentCapabilities to fetch.
     */
    where?: A2AAgentCapabilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AAgentCapabilities to fetch.
     */
    orderBy?: Enumerable<A2AAgentCapabilityOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing A2AAgentCapabilities.
     */
    cursor?: A2AAgentCapabilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AAgentCapabilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AAgentCapabilities.
     */
    skip?: number
    distinct?: Enumerable<A2AAgentCapabilityScalarFieldEnum>
  }


  /**
   * A2AAgentCapability create
   */
  export type A2AAgentCapabilityCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * The data needed to create a A2AAgentCapability.
     */
    data: XOR<A2AAgentCapabilityCreateInput, A2AAgentCapabilityUncheckedCreateInput>
  }


  /**
   * A2AAgentCapability createMany
   */
  export type A2AAgentCapabilityCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many A2AAgentCapabilities.
     */
    data: Enumerable<A2AAgentCapabilityCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * A2AAgentCapability update
   */
  export type A2AAgentCapabilityUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * The data needed to update a A2AAgentCapability.
     */
    data: XOR<A2AAgentCapabilityUpdateInput, A2AAgentCapabilityUncheckedUpdateInput>
    /**
     * Choose, which A2AAgentCapability to update.
     */
    where: A2AAgentCapabilityWhereUniqueInput
  }


  /**
   * A2AAgentCapability updateMany
   */
  export type A2AAgentCapabilityUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update A2AAgentCapabilities.
     */
    data: XOR<A2AAgentCapabilityUpdateManyMutationInput, A2AAgentCapabilityUncheckedUpdateManyInput>
    /**
     * Filter which A2AAgentCapabilities to update
     */
    where?: A2AAgentCapabilityWhereInput
  }


  /**
   * A2AAgentCapability upsert
   */
  export type A2AAgentCapabilityUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * The filter to search for the A2AAgentCapability to update in case it exists.
     */
    where: A2AAgentCapabilityWhereUniqueInput
    /**
     * In case the A2AAgentCapability found by the `where` argument doesn't exist, create a new A2AAgentCapability with this data.
     */
    create: XOR<A2AAgentCapabilityCreateInput, A2AAgentCapabilityUncheckedCreateInput>
    /**
     * In case the A2AAgentCapability was found with the provided `where` argument, update it with this data.
     */
    update: XOR<A2AAgentCapabilityUpdateInput, A2AAgentCapabilityUncheckedUpdateInput>
  }


  /**
   * A2AAgentCapability delete
   */
  export type A2AAgentCapabilityDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
    /**
     * Filter which A2AAgentCapability to delete.
     */
    where: A2AAgentCapabilityWhereUniqueInput
  }


  /**
   * A2AAgentCapability deleteMany
   */
  export type A2AAgentCapabilityDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AAgentCapabilities to delete
     */
    where?: A2AAgentCapabilityWhereInput
  }


  /**
   * A2AAgentCapability without action
   */
  export type A2AAgentCapabilityArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AAgentCapability
     */
    select?: A2AAgentCapabilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AAgentCapabilityInclude<ExtArgs> | null
  }



  /**
   * Model A2AMessage
   */


  export type AggregateA2AMessage = {
    _count: A2AMessageCountAggregateOutputType | null
    _avg: A2AMessageAvgAggregateOutputType | null
    _sum: A2AMessageSumAggregateOutputType | null
    _min: A2AMessageMinAggregateOutputType | null
    _max: A2AMessageMaxAggregateOutputType | null
  }

  export type A2AMessageAvgAggregateOutputType = {
    ttl: number | null
  }

  export type A2AMessageSumAggregateOutputType = {
    ttl: number | null
  }

  export type A2AMessageMinAggregateOutputType = {
    id: string | null
    messageId: string | null
    protocolVersion: string | null
    timestamp: Date | null
    fromAgentId: string | null
    toAgentId: string | null
    type: A2AMessageType | null
    priority: A2AMessagePriority | null
    conversationId: string | null
    requestId: string | null
    ttl: number | null
    signature: string | null
    checksum: string | null
    deliveredAt: Date | null
    acknowledgedAt: Date | null
    createdAt: Date | null
  }

  export type A2AMessageMaxAggregateOutputType = {
    id: string | null
    messageId: string | null
    protocolVersion: string | null
    timestamp: Date | null
    fromAgentId: string | null
    toAgentId: string | null
    type: A2AMessageType | null
    priority: A2AMessagePriority | null
    conversationId: string | null
    requestId: string | null
    ttl: number | null
    signature: string | null
    checksum: string | null
    deliveredAt: Date | null
    acknowledgedAt: Date | null
    createdAt: Date | null
  }

  export type A2AMessageCountAggregateOutputType = {
    id: number
    messageId: number
    protocolVersion: number
    timestamp: number
    fromAgentId: number
    toAgentId: number
    type: number
    priority: number
    conversationId: number
    requestId: number
    ttl: number
    payload: number
    routing: number
    signature: number
    checksum: number
    metadata: number
    deliveredAt: number
    acknowledgedAt: number
    createdAt: number
    _all: number
  }


  export type A2AMessageAvgAggregateInputType = {
    ttl?: true
  }

  export type A2AMessageSumAggregateInputType = {
    ttl?: true
  }

  export type A2AMessageMinAggregateInputType = {
    id?: true
    messageId?: true
    protocolVersion?: true
    timestamp?: true
    fromAgentId?: true
    toAgentId?: true
    type?: true
    priority?: true
    conversationId?: true
    requestId?: true
    ttl?: true
    signature?: true
    checksum?: true
    deliveredAt?: true
    acknowledgedAt?: true
    createdAt?: true
  }

  export type A2AMessageMaxAggregateInputType = {
    id?: true
    messageId?: true
    protocolVersion?: true
    timestamp?: true
    fromAgentId?: true
    toAgentId?: true
    type?: true
    priority?: true
    conversationId?: true
    requestId?: true
    ttl?: true
    signature?: true
    checksum?: true
    deliveredAt?: true
    acknowledgedAt?: true
    createdAt?: true
  }

  export type A2AMessageCountAggregateInputType = {
    id?: true
    messageId?: true
    protocolVersion?: true
    timestamp?: true
    fromAgentId?: true
    toAgentId?: true
    type?: true
    priority?: true
    conversationId?: true
    requestId?: true
    ttl?: true
    payload?: true
    routing?: true
    signature?: true
    checksum?: true
    metadata?: true
    deliveredAt?: true
    acknowledgedAt?: true
    createdAt?: true
    _all?: true
  }

  export type A2AMessageAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AMessage to aggregate.
     */
    where?: A2AMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AMessages to fetch.
     */
    orderBy?: Enumerable<A2AMessageOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: A2AMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned A2AMessages
    **/
    _count?: true | A2AMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: A2AMessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: A2AMessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: A2AMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: A2AMessageMaxAggregateInputType
  }

  export type GetA2AMessageAggregateType<T extends A2AMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateA2AMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateA2AMessage[P]>
      : GetScalarType<T[P], AggregateA2AMessage[P]>
  }




  export type A2AMessageGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AMessageWhereInput
    orderBy?: Enumerable<A2AMessageOrderByWithAggregationInput>
    by: A2AMessageScalarFieldEnum[]
    having?: A2AMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: A2AMessageCountAggregateInputType | true
    _avg?: A2AMessageAvgAggregateInputType
    _sum?: A2AMessageSumAggregateInputType
    _min?: A2AMessageMinAggregateInputType
    _max?: A2AMessageMaxAggregateInputType
  }


  export type A2AMessageGroupByOutputType = {
    id: string
    messageId: string
    protocolVersion: string
    timestamp: Date
    fromAgentId: string
    toAgentId: string | null
    type: A2AMessageType
    priority: A2AMessagePriority
    conversationId: string | null
    requestId: string | null
    ttl: number | null
    payload: JsonValue
    routing: JsonValue | null
    signature: string | null
    checksum: string | null
    metadata: JsonValue | null
    deliveredAt: Date | null
    acknowledgedAt: Date | null
    createdAt: Date
    _count: A2AMessageCountAggregateOutputType | null
    _avg: A2AMessageAvgAggregateOutputType | null
    _sum: A2AMessageSumAggregateOutputType | null
    _min: A2AMessageMinAggregateOutputType | null
    _max: A2AMessageMaxAggregateOutputType | null
  }

  type GetA2AMessageGroupByPayload<T extends A2AMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<A2AMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof A2AMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], A2AMessageGroupByOutputType[P]>
            : GetScalarType<T[P], A2AMessageGroupByOutputType[P]>
        }
      >
    >


  export type A2AMessageSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    messageId?: boolean
    protocolVersion?: boolean
    timestamp?: boolean
    fromAgentId?: boolean
    toAgentId?: boolean
    type?: boolean
    priority?: boolean
    conversationId?: boolean
    requestId?: boolean
    ttl?: boolean
    payload?: boolean
    routing?: boolean
    signature?: boolean
    checksum?: boolean
    metadata?: boolean
    deliveredAt?: boolean
    acknowledgedAt?: boolean
    createdAt?: boolean
    fromAgent?: boolean | A2AAgentArgs<ExtArgs>
    toAgent?: boolean | A2AAgentArgs<ExtArgs>
    conversation?: boolean | A2AConversationArgs<ExtArgs>
  }, ExtArgs["result"]["a2AMessage"]>

  export type A2AMessageSelectScalar = {
    id?: boolean
    messageId?: boolean
    protocolVersion?: boolean
    timestamp?: boolean
    fromAgentId?: boolean
    toAgentId?: boolean
    type?: boolean
    priority?: boolean
    conversationId?: boolean
    requestId?: boolean
    ttl?: boolean
    payload?: boolean
    routing?: boolean
    signature?: boolean
    checksum?: boolean
    metadata?: boolean
    deliveredAt?: boolean
    acknowledgedAt?: boolean
    createdAt?: boolean
  }

  export type A2AMessageInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    fromAgent?: boolean | A2AAgentArgs<ExtArgs>
    toAgent?: boolean | A2AAgentArgs<ExtArgs>
    conversation?: boolean | A2AConversationArgs<ExtArgs>
  }


  type A2AMessageGetPayload<S extends boolean | null | undefined | A2AMessageArgs> = $Types.GetResult<A2AMessagePayload, S>

  type A2AMessageCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<A2AMessageFindManyArgs, 'select' | 'include'> & {
      select?: A2AMessageCountAggregateInputType | true
    }

  export interface A2AMessageDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['A2AMessage'], meta: { name: 'A2AMessage' } }
    /**
     * Find zero or one A2AMessage that matches the filter.
     * @param {A2AMessageFindUniqueArgs} args - Arguments to find a A2AMessage
     * @example
     * // Get one A2AMessage
     * const a2AMessage = await prisma.a2AMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends A2AMessageFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, A2AMessageFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'A2AMessage'> extends True ? Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one A2AMessage that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {A2AMessageFindUniqueOrThrowArgs} args - Arguments to find a A2AMessage
     * @example
     * // Get one A2AMessage
     * const a2AMessage = await prisma.a2AMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends A2AMessageFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AMessageFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first A2AMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AMessageFindFirstArgs} args - Arguments to find a A2AMessage
     * @example
     * // Get one A2AMessage
     * const a2AMessage = await prisma.a2AMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends A2AMessageFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, A2AMessageFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'A2AMessage'> extends True ? Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first A2AMessage that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AMessageFindFirstOrThrowArgs} args - Arguments to find a A2AMessage
     * @example
     * // Get one A2AMessage
     * const a2AMessage = await prisma.a2AMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends A2AMessageFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AMessageFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more A2AMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AMessageFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all A2AMessages
     * const a2AMessages = await prisma.a2AMessage.findMany()
     * 
     * // Get first 10 A2AMessages
     * const a2AMessages = await prisma.a2AMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const a2AMessageWithIdOnly = await prisma.a2AMessage.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends A2AMessageFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AMessageFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a A2AMessage.
     * @param {A2AMessageCreateArgs} args - Arguments to create a A2AMessage.
     * @example
     * // Create one A2AMessage
     * const A2AMessage = await prisma.a2AMessage.create({
     *   data: {
     *     // ... data to create a A2AMessage
     *   }
     * })
     * 
    **/
    create<T extends A2AMessageCreateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AMessageCreateArgs<ExtArgs>>
    ): Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many A2AMessages.
     *     @param {A2AMessageCreateManyArgs} args - Arguments to create many A2AMessages.
     *     @example
     *     // Create many A2AMessages
     *     const a2AMessage = await prisma.a2AMessage.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends A2AMessageCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AMessageCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a A2AMessage.
     * @param {A2AMessageDeleteArgs} args - Arguments to delete one A2AMessage.
     * @example
     * // Delete one A2AMessage
     * const A2AMessage = await prisma.a2AMessage.delete({
     *   where: {
     *     // ... filter to delete one A2AMessage
     *   }
     * })
     * 
    **/
    delete<T extends A2AMessageDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, A2AMessageDeleteArgs<ExtArgs>>
    ): Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one A2AMessage.
     * @param {A2AMessageUpdateArgs} args - Arguments to update one A2AMessage.
     * @example
     * // Update one A2AMessage
     * const a2AMessage = await prisma.a2AMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends A2AMessageUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AMessageUpdateArgs<ExtArgs>>
    ): Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more A2AMessages.
     * @param {A2AMessageDeleteManyArgs} args - Arguments to filter A2AMessages to delete.
     * @example
     * // Delete a few A2AMessages
     * const { count } = await prisma.a2AMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends A2AMessageDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AMessageDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more A2AMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many A2AMessages
     * const a2AMessage = await prisma.a2AMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends A2AMessageUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, A2AMessageUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one A2AMessage.
     * @param {A2AMessageUpsertArgs} args - Arguments to update or create a A2AMessage.
     * @example
     * // Update or create a A2AMessage
     * const a2AMessage = await prisma.a2AMessage.upsert({
     *   create: {
     *     // ... data to create a A2AMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the A2AMessage we want to update
     *   }
     * })
    **/
    upsert<T extends A2AMessageUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, A2AMessageUpsertArgs<ExtArgs>>
    ): Prisma__A2AMessageClient<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of A2AMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AMessageCountArgs} args - Arguments to filter A2AMessages to count.
     * @example
     * // Count the number of A2AMessages
     * const count = await prisma.a2AMessage.count({
     *   where: {
     *     // ... the filter for the A2AMessages we want to count
     *   }
     * })
    **/
    count<T extends A2AMessageCountArgs>(
      args?: Subset<T, A2AMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], A2AMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a A2AMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends A2AMessageAggregateArgs>(args: Subset<T, A2AMessageAggregateArgs>): Prisma.PrismaPromise<GetA2AMessageAggregateType<T>>

    /**
     * Group by A2AMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends A2AMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: A2AMessageGroupByArgs['orderBy'] }
        : { orderBy?: A2AMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, A2AMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetA2AMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for A2AMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__A2AMessageClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    fromAgent<T extends A2AAgentArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgentArgs<ExtArgs>>): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    toAgent<T extends A2AAgentArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgentArgs<ExtArgs>>): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    conversation<T extends A2AConversationArgs<ExtArgs> = {}>(args?: Subset<T, A2AConversationArgs<ExtArgs>>): Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * A2AMessage base type for findUnique actions
   */
  export type A2AMessageFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * Filter, which A2AMessage to fetch.
     */
    where: A2AMessageWhereUniqueInput
  }

  /**
   * A2AMessage findUnique
   */
  export interface A2AMessageFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AMessageFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AMessage findUniqueOrThrow
   */
  export type A2AMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * Filter, which A2AMessage to fetch.
     */
    where: A2AMessageWhereUniqueInput
  }


  /**
   * A2AMessage base type for findFirst actions
   */
  export type A2AMessageFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * Filter, which A2AMessage to fetch.
     */
    where?: A2AMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AMessages to fetch.
     */
    orderBy?: Enumerable<A2AMessageOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AMessages.
     */
    cursor?: A2AMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AMessages.
     */
    distinct?: Enumerable<A2AMessageScalarFieldEnum>
  }

  /**
   * A2AMessage findFirst
   */
  export interface A2AMessageFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AMessageFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AMessage findFirstOrThrow
   */
  export type A2AMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * Filter, which A2AMessage to fetch.
     */
    where?: A2AMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AMessages to fetch.
     */
    orderBy?: Enumerable<A2AMessageOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AMessages.
     */
    cursor?: A2AMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AMessages.
     */
    distinct?: Enumerable<A2AMessageScalarFieldEnum>
  }


  /**
   * A2AMessage findMany
   */
  export type A2AMessageFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * Filter, which A2AMessages to fetch.
     */
    where?: A2AMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AMessages to fetch.
     */
    orderBy?: Enumerable<A2AMessageOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing A2AMessages.
     */
    cursor?: A2AMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AMessages.
     */
    skip?: number
    distinct?: Enumerable<A2AMessageScalarFieldEnum>
  }


  /**
   * A2AMessage create
   */
  export type A2AMessageCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a A2AMessage.
     */
    data: XOR<A2AMessageCreateInput, A2AMessageUncheckedCreateInput>
  }


  /**
   * A2AMessage createMany
   */
  export type A2AMessageCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many A2AMessages.
     */
    data: Enumerable<A2AMessageCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * A2AMessage update
   */
  export type A2AMessageUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a A2AMessage.
     */
    data: XOR<A2AMessageUpdateInput, A2AMessageUncheckedUpdateInput>
    /**
     * Choose, which A2AMessage to update.
     */
    where: A2AMessageWhereUniqueInput
  }


  /**
   * A2AMessage updateMany
   */
  export type A2AMessageUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update A2AMessages.
     */
    data: XOR<A2AMessageUpdateManyMutationInput, A2AMessageUncheckedUpdateManyInput>
    /**
     * Filter which A2AMessages to update
     */
    where?: A2AMessageWhereInput
  }


  /**
   * A2AMessage upsert
   */
  export type A2AMessageUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the A2AMessage to update in case it exists.
     */
    where: A2AMessageWhereUniqueInput
    /**
     * In case the A2AMessage found by the `where` argument doesn't exist, create a new A2AMessage with this data.
     */
    create: XOR<A2AMessageCreateInput, A2AMessageUncheckedCreateInput>
    /**
     * In case the A2AMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<A2AMessageUpdateInput, A2AMessageUncheckedUpdateInput>
  }


  /**
   * A2AMessage delete
   */
  export type A2AMessageDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    /**
     * Filter which A2AMessage to delete.
     */
    where: A2AMessageWhereUniqueInput
  }


  /**
   * A2AMessage deleteMany
   */
  export type A2AMessageDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AMessages to delete
     */
    where?: A2AMessageWhereInput
  }


  /**
   * A2AMessage without action
   */
  export type A2AMessageArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
  }



  /**
   * Model A2AConversation
   */


  export type AggregateA2AConversation = {
    _count: A2AConversationCountAggregateOutputType | null
    _min: A2AConversationMinAggregateOutputType | null
    _max: A2AConversationMaxAggregateOutputType | null
  }

  export type A2AConversationMinAggregateOutputType = {
    id: string | null
    conversationId: string | null
    initiatorId: string | null
    topic: string | null
    status: A2AConversationStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type A2AConversationMaxAggregateOutputType = {
    id: string | null
    conversationId: string | null
    initiatorId: string | null
    topic: string | null
    status: A2AConversationStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type A2AConversationCountAggregateOutputType = {
    id: number
    conversationId: number
    initiatorId: number
    topic: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type A2AConversationMinAggregateInputType = {
    id?: true
    conversationId?: true
    initiatorId?: true
    topic?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type A2AConversationMaxAggregateInputType = {
    id?: true
    conversationId?: true
    initiatorId?: true
    topic?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type A2AConversationCountAggregateInputType = {
    id?: true
    conversationId?: true
    initiatorId?: true
    topic?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type A2AConversationAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AConversation to aggregate.
     */
    where?: A2AConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AConversations to fetch.
     */
    orderBy?: Enumerable<A2AConversationOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: A2AConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AConversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AConversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned A2AConversations
    **/
    _count?: true | A2AConversationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: A2AConversationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: A2AConversationMaxAggregateInputType
  }

  export type GetA2AConversationAggregateType<T extends A2AConversationAggregateArgs> = {
        [P in keyof T & keyof AggregateA2AConversation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateA2AConversation[P]>
      : GetScalarType<T[P], AggregateA2AConversation[P]>
  }




  export type A2AConversationGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AConversationWhereInput
    orderBy?: Enumerable<A2AConversationOrderByWithAggregationInput>
    by: A2AConversationScalarFieldEnum[]
    having?: A2AConversationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: A2AConversationCountAggregateInputType | true
    _min?: A2AConversationMinAggregateInputType
    _max?: A2AConversationMaxAggregateInputType
  }


  export type A2AConversationGroupByOutputType = {
    id: string
    conversationId: string
    initiatorId: string
    topic: string | null
    status: A2AConversationStatus
    createdAt: Date
    updatedAt: Date
    _count: A2AConversationCountAggregateOutputType | null
    _min: A2AConversationMinAggregateOutputType | null
    _max: A2AConversationMaxAggregateOutputType | null
  }

  type GetA2AConversationGroupByPayload<T extends A2AConversationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<A2AConversationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof A2AConversationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], A2AConversationGroupByOutputType[P]>
            : GetScalarType<T[P], A2AConversationGroupByOutputType[P]>
        }
      >
    >


  export type A2AConversationSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conversationId?: boolean
    initiatorId?: boolean
    topic?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    participants?: boolean | A2AConversation$participantsArgs<ExtArgs>
    messages?: boolean | A2AConversation$messagesArgs<ExtArgs>
    _count?: boolean | A2AConversationCountOutputTypeArgs<ExtArgs>
  }, ExtArgs["result"]["a2AConversation"]>

  export type A2AConversationSelectScalar = {
    id?: boolean
    conversationId?: boolean
    initiatorId?: boolean
    topic?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type A2AConversationInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    participants?: boolean | A2AConversation$participantsArgs<ExtArgs>
    messages?: boolean | A2AConversation$messagesArgs<ExtArgs>
    _count?: boolean | A2AConversationCountOutputTypeArgs<ExtArgs>
  }


  type A2AConversationGetPayload<S extends boolean | null | undefined | A2AConversationArgs> = $Types.GetResult<A2AConversationPayload, S>

  type A2AConversationCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<A2AConversationFindManyArgs, 'select' | 'include'> & {
      select?: A2AConversationCountAggregateInputType | true
    }

  export interface A2AConversationDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['A2AConversation'], meta: { name: 'A2AConversation' } }
    /**
     * Find zero or one A2AConversation that matches the filter.
     * @param {A2AConversationFindUniqueArgs} args - Arguments to find a A2AConversation
     * @example
     * // Get one A2AConversation
     * const a2AConversation = await prisma.a2AConversation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends A2AConversationFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, A2AConversationFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'A2AConversation'> extends True ? Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one A2AConversation that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {A2AConversationFindUniqueOrThrowArgs} args - Arguments to find a A2AConversation
     * @example
     * // Get one A2AConversation
     * const a2AConversation = await prisma.a2AConversation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends A2AConversationFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first A2AConversation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationFindFirstArgs} args - Arguments to find a A2AConversation
     * @example
     * // Get one A2AConversation
     * const a2AConversation = await prisma.a2AConversation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends A2AConversationFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, A2AConversationFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'A2AConversation'> extends True ? Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first A2AConversation that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationFindFirstOrThrowArgs} args - Arguments to find a A2AConversation
     * @example
     * // Get one A2AConversation
     * const a2AConversation = await prisma.a2AConversation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends A2AConversationFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more A2AConversations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all A2AConversations
     * const a2AConversations = await prisma.a2AConversation.findMany()
     * 
     * // Get first 10 A2AConversations
     * const a2AConversations = await prisma.a2AConversation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const a2AConversationWithIdOnly = await prisma.a2AConversation.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends A2AConversationFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a A2AConversation.
     * @param {A2AConversationCreateArgs} args - Arguments to create a A2AConversation.
     * @example
     * // Create one A2AConversation
     * const A2AConversation = await prisma.a2AConversation.create({
     *   data: {
     *     // ... data to create a A2AConversation
     *   }
     * })
     * 
    **/
    create<T extends A2AConversationCreateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationCreateArgs<ExtArgs>>
    ): Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many A2AConversations.
     *     @param {A2AConversationCreateManyArgs} args - Arguments to create many A2AConversations.
     *     @example
     *     // Create many A2AConversations
     *     const a2AConversation = await prisma.a2AConversation.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends A2AConversationCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a A2AConversation.
     * @param {A2AConversationDeleteArgs} args - Arguments to delete one A2AConversation.
     * @example
     * // Delete one A2AConversation
     * const A2AConversation = await prisma.a2AConversation.delete({
     *   where: {
     *     // ... filter to delete one A2AConversation
     *   }
     * })
     * 
    **/
    delete<T extends A2AConversationDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationDeleteArgs<ExtArgs>>
    ): Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one A2AConversation.
     * @param {A2AConversationUpdateArgs} args - Arguments to update one A2AConversation.
     * @example
     * // Update one A2AConversation
     * const a2AConversation = await prisma.a2AConversation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends A2AConversationUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationUpdateArgs<ExtArgs>>
    ): Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more A2AConversations.
     * @param {A2AConversationDeleteManyArgs} args - Arguments to filter A2AConversations to delete.
     * @example
     * // Delete a few A2AConversations
     * const { count } = await prisma.a2AConversation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends A2AConversationDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more A2AConversations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many A2AConversations
     * const a2AConversation = await prisma.a2AConversation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends A2AConversationUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one A2AConversation.
     * @param {A2AConversationUpsertArgs} args - Arguments to update or create a A2AConversation.
     * @example
     * // Update or create a A2AConversation
     * const a2AConversation = await prisma.a2AConversation.upsert({
     *   create: {
     *     // ... data to create a A2AConversation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the A2AConversation we want to update
     *   }
     * })
    **/
    upsert<T extends A2AConversationUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationUpsertArgs<ExtArgs>>
    ): Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of A2AConversations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationCountArgs} args - Arguments to filter A2AConversations to count.
     * @example
     * // Count the number of A2AConversations
     * const count = await prisma.a2AConversation.count({
     *   where: {
     *     // ... the filter for the A2AConversations we want to count
     *   }
     * })
    **/
    count<T extends A2AConversationCountArgs>(
      args?: Subset<T, A2AConversationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], A2AConversationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a A2AConversation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends A2AConversationAggregateArgs>(args: Subset<T, A2AConversationAggregateArgs>): Prisma.PrismaPromise<GetA2AConversationAggregateType<T>>

    /**
     * Group by A2AConversation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends A2AConversationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: A2AConversationGroupByArgs['orderBy'] }
        : { orderBy?: A2AConversationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, A2AConversationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetA2AConversationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for A2AConversation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__A2AConversationClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    participants<T extends A2AConversation$participantsArgs<ExtArgs> = {}>(args?: Subset<T, A2AConversation$participantsArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findMany', never>| Null>;

    messages<T extends A2AConversation$messagesArgs<ExtArgs> = {}>(args?: Subset<T, A2AConversation$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Types.GetResult<A2AMessagePayload<ExtArgs>, T, 'findMany', never>| Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * A2AConversation base type for findUnique actions
   */
  export type A2AConversationFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversation to fetch.
     */
    where: A2AConversationWhereUniqueInput
  }

  /**
   * A2AConversation findUnique
   */
  export interface A2AConversationFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AConversationFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AConversation findUniqueOrThrow
   */
  export type A2AConversationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversation to fetch.
     */
    where: A2AConversationWhereUniqueInput
  }


  /**
   * A2AConversation base type for findFirst actions
   */
  export type A2AConversationFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversation to fetch.
     */
    where?: A2AConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AConversations to fetch.
     */
    orderBy?: Enumerable<A2AConversationOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AConversations.
     */
    cursor?: A2AConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AConversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AConversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AConversations.
     */
    distinct?: Enumerable<A2AConversationScalarFieldEnum>
  }

  /**
   * A2AConversation findFirst
   */
  export interface A2AConversationFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AConversationFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AConversation findFirstOrThrow
   */
  export type A2AConversationFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversation to fetch.
     */
    where?: A2AConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AConversations to fetch.
     */
    orderBy?: Enumerable<A2AConversationOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AConversations.
     */
    cursor?: A2AConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AConversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AConversations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AConversations.
     */
    distinct?: Enumerable<A2AConversationScalarFieldEnum>
  }


  /**
   * A2AConversation findMany
   */
  export type A2AConversationFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversations to fetch.
     */
    where?: A2AConversationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AConversations to fetch.
     */
    orderBy?: Enumerable<A2AConversationOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing A2AConversations.
     */
    cursor?: A2AConversationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AConversations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AConversations.
     */
    skip?: number
    distinct?: Enumerable<A2AConversationScalarFieldEnum>
  }


  /**
   * A2AConversation create
   */
  export type A2AConversationCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * The data needed to create a A2AConversation.
     */
    data: XOR<A2AConversationCreateInput, A2AConversationUncheckedCreateInput>
  }


  /**
   * A2AConversation createMany
   */
  export type A2AConversationCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many A2AConversations.
     */
    data: Enumerable<A2AConversationCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * A2AConversation update
   */
  export type A2AConversationUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * The data needed to update a A2AConversation.
     */
    data: XOR<A2AConversationUpdateInput, A2AConversationUncheckedUpdateInput>
    /**
     * Choose, which A2AConversation to update.
     */
    where: A2AConversationWhereUniqueInput
  }


  /**
   * A2AConversation updateMany
   */
  export type A2AConversationUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update A2AConversations.
     */
    data: XOR<A2AConversationUpdateManyMutationInput, A2AConversationUncheckedUpdateManyInput>
    /**
     * Filter which A2AConversations to update
     */
    where?: A2AConversationWhereInput
  }


  /**
   * A2AConversation upsert
   */
  export type A2AConversationUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * The filter to search for the A2AConversation to update in case it exists.
     */
    where: A2AConversationWhereUniqueInput
    /**
     * In case the A2AConversation found by the `where` argument doesn't exist, create a new A2AConversation with this data.
     */
    create: XOR<A2AConversationCreateInput, A2AConversationUncheckedCreateInput>
    /**
     * In case the A2AConversation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<A2AConversationUpdateInput, A2AConversationUncheckedUpdateInput>
  }


  /**
   * A2AConversation delete
   */
  export type A2AConversationDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
    /**
     * Filter which A2AConversation to delete.
     */
    where: A2AConversationWhereUniqueInput
  }


  /**
   * A2AConversation deleteMany
   */
  export type A2AConversationDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AConversations to delete
     */
    where?: A2AConversationWhereInput
  }


  /**
   * A2AConversation.participants
   */
  export type A2AConversation$participantsArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    where?: A2AConversationParticipantWhereInput
    orderBy?: Enumerable<A2AConversationParticipantOrderByWithRelationInput>
    cursor?: A2AConversationParticipantWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<A2AConversationParticipantScalarFieldEnum>
  }


  /**
   * A2AConversation.messages
   */
  export type A2AConversation$messagesArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AMessage
     */
    select?: A2AMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AMessageInclude<ExtArgs> | null
    where?: A2AMessageWhereInput
    orderBy?: Enumerable<A2AMessageOrderByWithRelationInput>
    cursor?: A2AMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<A2AMessageScalarFieldEnum>
  }


  /**
   * A2AConversation without action
   */
  export type A2AConversationArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversation
     */
    select?: A2AConversationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationInclude<ExtArgs> | null
  }



  /**
   * Model A2AConversationParticipant
   */


  export type AggregateA2AConversationParticipant = {
    _count: A2AConversationParticipantCountAggregateOutputType | null
    _min: A2AConversationParticipantMinAggregateOutputType | null
    _max: A2AConversationParticipantMaxAggregateOutputType | null
  }

  export type A2AConversationParticipantMinAggregateOutputType = {
    id: string | null
    conversationId: string | null
    agentId: string | null
    joinedAt: Date | null
    leftAt: Date | null
    role: string | null
  }

  export type A2AConversationParticipantMaxAggregateOutputType = {
    id: string | null
    conversationId: string | null
    agentId: string | null
    joinedAt: Date | null
    leftAt: Date | null
    role: string | null
  }

  export type A2AConversationParticipantCountAggregateOutputType = {
    id: number
    conversationId: number
    agentId: number
    joinedAt: number
    leftAt: number
    role: number
    _all: number
  }


  export type A2AConversationParticipantMinAggregateInputType = {
    id?: true
    conversationId?: true
    agentId?: true
    joinedAt?: true
    leftAt?: true
    role?: true
  }

  export type A2AConversationParticipantMaxAggregateInputType = {
    id?: true
    conversationId?: true
    agentId?: true
    joinedAt?: true
    leftAt?: true
    role?: true
  }

  export type A2AConversationParticipantCountAggregateInputType = {
    id?: true
    conversationId?: true
    agentId?: true
    joinedAt?: true
    leftAt?: true
    role?: true
    _all?: true
  }

  export type A2AConversationParticipantAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AConversationParticipant to aggregate.
     */
    where?: A2AConversationParticipantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AConversationParticipants to fetch.
     */
    orderBy?: Enumerable<A2AConversationParticipantOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: A2AConversationParticipantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AConversationParticipants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AConversationParticipants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned A2AConversationParticipants
    **/
    _count?: true | A2AConversationParticipantCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: A2AConversationParticipantMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: A2AConversationParticipantMaxAggregateInputType
  }

  export type GetA2AConversationParticipantAggregateType<T extends A2AConversationParticipantAggregateArgs> = {
        [P in keyof T & keyof AggregateA2AConversationParticipant]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateA2AConversationParticipant[P]>
      : GetScalarType<T[P], AggregateA2AConversationParticipant[P]>
  }




  export type A2AConversationParticipantGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AConversationParticipantWhereInput
    orderBy?: Enumerable<A2AConversationParticipantOrderByWithAggregationInput>
    by: A2AConversationParticipantScalarFieldEnum[]
    having?: A2AConversationParticipantScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: A2AConversationParticipantCountAggregateInputType | true
    _min?: A2AConversationParticipantMinAggregateInputType
    _max?: A2AConversationParticipantMaxAggregateInputType
  }


  export type A2AConversationParticipantGroupByOutputType = {
    id: string
    conversationId: string
    agentId: string
    joinedAt: Date
    leftAt: Date | null
    role: string | null
    _count: A2AConversationParticipantCountAggregateOutputType | null
    _min: A2AConversationParticipantMinAggregateOutputType | null
    _max: A2AConversationParticipantMaxAggregateOutputType | null
  }

  type GetA2AConversationParticipantGroupByPayload<T extends A2AConversationParticipantGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<A2AConversationParticipantGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof A2AConversationParticipantGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], A2AConversationParticipantGroupByOutputType[P]>
            : GetScalarType<T[P], A2AConversationParticipantGroupByOutputType[P]>
        }
      >
    >


  export type A2AConversationParticipantSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    conversationId?: boolean
    agentId?: boolean
    joinedAt?: boolean
    leftAt?: boolean
    role?: boolean
    conversation?: boolean | A2AConversationArgs<ExtArgs>
    agent?: boolean | A2AAgentArgs<ExtArgs>
  }, ExtArgs["result"]["a2AConversationParticipant"]>

  export type A2AConversationParticipantSelectScalar = {
    id?: boolean
    conversationId?: boolean
    agentId?: boolean
    joinedAt?: boolean
    leftAt?: boolean
    role?: boolean
  }

  export type A2AConversationParticipantInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    conversation?: boolean | A2AConversationArgs<ExtArgs>
    agent?: boolean | A2AAgentArgs<ExtArgs>
  }


  type A2AConversationParticipantGetPayload<S extends boolean | null | undefined | A2AConversationParticipantArgs> = $Types.GetResult<A2AConversationParticipantPayload, S>

  type A2AConversationParticipantCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<A2AConversationParticipantFindManyArgs, 'select' | 'include'> & {
      select?: A2AConversationParticipantCountAggregateInputType | true
    }

  export interface A2AConversationParticipantDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['A2AConversationParticipant'], meta: { name: 'A2AConversationParticipant' } }
    /**
     * Find zero or one A2AConversationParticipant that matches the filter.
     * @param {A2AConversationParticipantFindUniqueArgs} args - Arguments to find a A2AConversationParticipant
     * @example
     * // Get one A2AConversationParticipant
     * const a2AConversationParticipant = await prisma.a2AConversationParticipant.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends A2AConversationParticipantFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, A2AConversationParticipantFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'A2AConversationParticipant'> extends True ? Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one A2AConversationParticipant that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {A2AConversationParticipantFindUniqueOrThrowArgs} args - Arguments to find a A2AConversationParticipant
     * @example
     * // Get one A2AConversationParticipant
     * const a2AConversationParticipant = await prisma.a2AConversationParticipant.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends A2AConversationParticipantFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationParticipantFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first A2AConversationParticipant that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationParticipantFindFirstArgs} args - Arguments to find a A2AConversationParticipant
     * @example
     * // Get one A2AConversationParticipant
     * const a2AConversationParticipant = await prisma.a2AConversationParticipant.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends A2AConversationParticipantFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, A2AConversationParticipantFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'A2AConversationParticipant'> extends True ? Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first A2AConversationParticipant that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationParticipantFindFirstOrThrowArgs} args - Arguments to find a A2AConversationParticipant
     * @example
     * // Get one A2AConversationParticipant
     * const a2AConversationParticipant = await prisma.a2AConversationParticipant.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends A2AConversationParticipantFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationParticipantFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more A2AConversationParticipants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationParticipantFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all A2AConversationParticipants
     * const a2AConversationParticipants = await prisma.a2AConversationParticipant.findMany()
     * 
     * // Get first 10 A2AConversationParticipants
     * const a2AConversationParticipants = await prisma.a2AConversationParticipant.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const a2AConversationParticipantWithIdOnly = await prisma.a2AConversationParticipant.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends A2AConversationParticipantFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationParticipantFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a A2AConversationParticipant.
     * @param {A2AConversationParticipantCreateArgs} args - Arguments to create a A2AConversationParticipant.
     * @example
     * // Create one A2AConversationParticipant
     * const A2AConversationParticipant = await prisma.a2AConversationParticipant.create({
     *   data: {
     *     // ... data to create a A2AConversationParticipant
     *   }
     * })
     * 
    **/
    create<T extends A2AConversationParticipantCreateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationParticipantCreateArgs<ExtArgs>>
    ): Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many A2AConversationParticipants.
     *     @param {A2AConversationParticipantCreateManyArgs} args - Arguments to create many A2AConversationParticipants.
     *     @example
     *     // Create many A2AConversationParticipants
     *     const a2AConversationParticipant = await prisma.a2AConversationParticipant.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends A2AConversationParticipantCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationParticipantCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a A2AConversationParticipant.
     * @param {A2AConversationParticipantDeleteArgs} args - Arguments to delete one A2AConversationParticipant.
     * @example
     * // Delete one A2AConversationParticipant
     * const A2AConversationParticipant = await prisma.a2AConversationParticipant.delete({
     *   where: {
     *     // ... filter to delete one A2AConversationParticipant
     *   }
     * })
     * 
    **/
    delete<T extends A2AConversationParticipantDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationParticipantDeleteArgs<ExtArgs>>
    ): Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one A2AConversationParticipant.
     * @param {A2AConversationParticipantUpdateArgs} args - Arguments to update one A2AConversationParticipant.
     * @example
     * // Update one A2AConversationParticipant
     * const a2AConversationParticipant = await prisma.a2AConversationParticipant.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends A2AConversationParticipantUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationParticipantUpdateArgs<ExtArgs>>
    ): Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more A2AConversationParticipants.
     * @param {A2AConversationParticipantDeleteManyArgs} args - Arguments to filter A2AConversationParticipants to delete.
     * @example
     * // Delete a few A2AConversationParticipants
     * const { count } = await prisma.a2AConversationParticipant.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends A2AConversationParticipantDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AConversationParticipantDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more A2AConversationParticipants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationParticipantUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many A2AConversationParticipants
     * const a2AConversationParticipant = await prisma.a2AConversationParticipant.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends A2AConversationParticipantUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationParticipantUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one A2AConversationParticipant.
     * @param {A2AConversationParticipantUpsertArgs} args - Arguments to update or create a A2AConversationParticipant.
     * @example
     * // Update or create a A2AConversationParticipant
     * const a2AConversationParticipant = await prisma.a2AConversationParticipant.upsert({
     *   create: {
     *     // ... data to create a A2AConversationParticipant
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the A2AConversationParticipant we want to update
     *   }
     * })
    **/
    upsert<T extends A2AConversationParticipantUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, A2AConversationParticipantUpsertArgs<ExtArgs>>
    ): Prisma__A2AConversationParticipantClient<$Types.GetResult<A2AConversationParticipantPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of A2AConversationParticipants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationParticipantCountArgs} args - Arguments to filter A2AConversationParticipants to count.
     * @example
     * // Count the number of A2AConversationParticipants
     * const count = await prisma.a2AConversationParticipant.count({
     *   where: {
     *     // ... the filter for the A2AConversationParticipants we want to count
     *   }
     * })
    **/
    count<T extends A2AConversationParticipantCountArgs>(
      args?: Subset<T, A2AConversationParticipantCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], A2AConversationParticipantCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a A2AConversationParticipant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationParticipantAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends A2AConversationParticipantAggregateArgs>(args: Subset<T, A2AConversationParticipantAggregateArgs>): Prisma.PrismaPromise<GetA2AConversationParticipantAggregateType<T>>

    /**
     * Group by A2AConversationParticipant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AConversationParticipantGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends A2AConversationParticipantGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: A2AConversationParticipantGroupByArgs['orderBy'] }
        : { orderBy?: A2AConversationParticipantGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, A2AConversationParticipantGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetA2AConversationParticipantGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for A2AConversationParticipant.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__A2AConversationParticipantClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    conversation<T extends A2AConversationArgs<ExtArgs> = {}>(args?: Subset<T, A2AConversationArgs<ExtArgs>>): Prisma__A2AConversationClient<$Types.GetResult<A2AConversationPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    agent<T extends A2AAgentArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgentArgs<ExtArgs>>): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * A2AConversationParticipant base type for findUnique actions
   */
  export type A2AConversationParticipantFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversationParticipant to fetch.
     */
    where: A2AConversationParticipantWhereUniqueInput
  }

  /**
   * A2AConversationParticipant findUnique
   */
  export interface A2AConversationParticipantFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AConversationParticipantFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AConversationParticipant findUniqueOrThrow
   */
  export type A2AConversationParticipantFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversationParticipant to fetch.
     */
    where: A2AConversationParticipantWhereUniqueInput
  }


  /**
   * A2AConversationParticipant base type for findFirst actions
   */
  export type A2AConversationParticipantFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversationParticipant to fetch.
     */
    where?: A2AConversationParticipantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AConversationParticipants to fetch.
     */
    orderBy?: Enumerable<A2AConversationParticipantOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AConversationParticipants.
     */
    cursor?: A2AConversationParticipantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AConversationParticipants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AConversationParticipants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AConversationParticipants.
     */
    distinct?: Enumerable<A2AConversationParticipantScalarFieldEnum>
  }

  /**
   * A2AConversationParticipant findFirst
   */
  export interface A2AConversationParticipantFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AConversationParticipantFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AConversationParticipant findFirstOrThrow
   */
  export type A2AConversationParticipantFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversationParticipant to fetch.
     */
    where?: A2AConversationParticipantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AConversationParticipants to fetch.
     */
    orderBy?: Enumerable<A2AConversationParticipantOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AConversationParticipants.
     */
    cursor?: A2AConversationParticipantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AConversationParticipants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AConversationParticipants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AConversationParticipants.
     */
    distinct?: Enumerable<A2AConversationParticipantScalarFieldEnum>
  }


  /**
   * A2AConversationParticipant findMany
   */
  export type A2AConversationParticipantFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * Filter, which A2AConversationParticipants to fetch.
     */
    where?: A2AConversationParticipantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AConversationParticipants to fetch.
     */
    orderBy?: Enumerable<A2AConversationParticipantOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing A2AConversationParticipants.
     */
    cursor?: A2AConversationParticipantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AConversationParticipants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AConversationParticipants.
     */
    skip?: number
    distinct?: Enumerable<A2AConversationParticipantScalarFieldEnum>
  }


  /**
   * A2AConversationParticipant create
   */
  export type A2AConversationParticipantCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * The data needed to create a A2AConversationParticipant.
     */
    data: XOR<A2AConversationParticipantCreateInput, A2AConversationParticipantUncheckedCreateInput>
  }


  /**
   * A2AConversationParticipant createMany
   */
  export type A2AConversationParticipantCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many A2AConversationParticipants.
     */
    data: Enumerable<A2AConversationParticipantCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * A2AConversationParticipant update
   */
  export type A2AConversationParticipantUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * The data needed to update a A2AConversationParticipant.
     */
    data: XOR<A2AConversationParticipantUpdateInput, A2AConversationParticipantUncheckedUpdateInput>
    /**
     * Choose, which A2AConversationParticipant to update.
     */
    where: A2AConversationParticipantWhereUniqueInput
  }


  /**
   * A2AConversationParticipant updateMany
   */
  export type A2AConversationParticipantUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update A2AConversationParticipants.
     */
    data: XOR<A2AConversationParticipantUpdateManyMutationInput, A2AConversationParticipantUncheckedUpdateManyInput>
    /**
     * Filter which A2AConversationParticipants to update
     */
    where?: A2AConversationParticipantWhereInput
  }


  /**
   * A2AConversationParticipant upsert
   */
  export type A2AConversationParticipantUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * The filter to search for the A2AConversationParticipant to update in case it exists.
     */
    where: A2AConversationParticipantWhereUniqueInput
    /**
     * In case the A2AConversationParticipant found by the `where` argument doesn't exist, create a new A2AConversationParticipant with this data.
     */
    create: XOR<A2AConversationParticipantCreateInput, A2AConversationParticipantUncheckedCreateInput>
    /**
     * In case the A2AConversationParticipant was found with the provided `where` argument, update it with this data.
     */
    update: XOR<A2AConversationParticipantUpdateInput, A2AConversationParticipantUncheckedUpdateInput>
  }


  /**
   * A2AConversationParticipant delete
   */
  export type A2AConversationParticipantDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
    /**
     * Filter which A2AConversationParticipant to delete.
     */
    where: A2AConversationParticipantWhereUniqueInput
  }


  /**
   * A2AConversationParticipant deleteMany
   */
  export type A2AConversationParticipantDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AConversationParticipants to delete
     */
    where?: A2AConversationParticipantWhereInput
  }


  /**
   * A2AConversationParticipant without action
   */
  export type A2AConversationParticipantArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AConversationParticipant
     */
    select?: A2AConversationParticipantSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AConversationParticipantInclude<ExtArgs> | null
  }



  /**
   * Model A2AHeartbeat
   */


  export type AggregateA2AHeartbeat = {
    _count: A2AHeartbeatCountAggregateOutputType | null
    _avg: A2AHeartbeatAvgAggregateOutputType | null
    _sum: A2AHeartbeatSumAggregateOutputType | null
    _min: A2AHeartbeatMinAggregateOutputType | null
    _max: A2AHeartbeatMaxAggregateOutputType | null
  }

  export type A2AHeartbeatAvgAggregateOutputType = {
    load: number | null
    activeConnections: number | null
  }

  export type A2AHeartbeatSumAggregateOutputType = {
    load: number | null
    activeConnections: number | null
  }

  export type A2AHeartbeatMinAggregateOutputType = {
    id: string | null
    agentId: string | null
    timestamp: Date | null
    status: A2AAgentStatus | null
    load: number | null
    activeConnections: number | null
    lastActivity: Date | null
    createdAt: Date | null
  }

  export type A2AHeartbeatMaxAggregateOutputType = {
    id: string | null
    agentId: string | null
    timestamp: Date | null
    status: A2AAgentStatus | null
    load: number | null
    activeConnections: number | null
    lastActivity: Date | null
    createdAt: Date | null
  }

  export type A2AHeartbeatCountAggregateOutputType = {
    id: number
    agentId: number
    timestamp: number
    status: number
    load: number
    activeConnections: number
    lastActivity: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type A2AHeartbeatAvgAggregateInputType = {
    load?: true
    activeConnections?: true
  }

  export type A2AHeartbeatSumAggregateInputType = {
    load?: true
    activeConnections?: true
  }

  export type A2AHeartbeatMinAggregateInputType = {
    id?: true
    agentId?: true
    timestamp?: true
    status?: true
    load?: true
    activeConnections?: true
    lastActivity?: true
    createdAt?: true
  }

  export type A2AHeartbeatMaxAggregateInputType = {
    id?: true
    agentId?: true
    timestamp?: true
    status?: true
    load?: true
    activeConnections?: true
    lastActivity?: true
    createdAt?: true
  }

  export type A2AHeartbeatCountAggregateInputType = {
    id?: true
    agentId?: true
    timestamp?: true
    status?: true
    load?: true
    activeConnections?: true
    lastActivity?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type A2AHeartbeatAggregateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AHeartbeat to aggregate.
     */
    where?: A2AHeartbeatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AHeartbeats to fetch.
     */
    orderBy?: Enumerable<A2AHeartbeatOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: A2AHeartbeatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AHeartbeats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AHeartbeats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned A2AHeartbeats
    **/
    _count?: true | A2AHeartbeatCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: A2AHeartbeatAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: A2AHeartbeatSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: A2AHeartbeatMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: A2AHeartbeatMaxAggregateInputType
  }

  export type GetA2AHeartbeatAggregateType<T extends A2AHeartbeatAggregateArgs> = {
        [P in keyof T & keyof AggregateA2AHeartbeat]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateA2AHeartbeat[P]>
      : GetScalarType<T[P], AggregateA2AHeartbeat[P]>
  }




  export type A2AHeartbeatGroupByArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    where?: A2AHeartbeatWhereInput
    orderBy?: Enumerable<A2AHeartbeatOrderByWithAggregationInput>
    by: A2AHeartbeatScalarFieldEnum[]
    having?: A2AHeartbeatScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: A2AHeartbeatCountAggregateInputType | true
    _avg?: A2AHeartbeatAvgAggregateInputType
    _sum?: A2AHeartbeatSumAggregateInputType
    _min?: A2AHeartbeatMinAggregateInputType
    _max?: A2AHeartbeatMaxAggregateInputType
  }


  export type A2AHeartbeatGroupByOutputType = {
    id: string
    agentId: string
    timestamp: Date
    status: A2AAgentStatus
    load: number | null
    activeConnections: number | null
    lastActivity: Date | null
    metadata: JsonValue | null
    createdAt: Date
    _count: A2AHeartbeatCountAggregateOutputType | null
    _avg: A2AHeartbeatAvgAggregateOutputType | null
    _sum: A2AHeartbeatSumAggregateOutputType | null
    _min: A2AHeartbeatMinAggregateOutputType | null
    _max: A2AHeartbeatMaxAggregateOutputType | null
  }

  type GetA2AHeartbeatGroupByPayload<T extends A2AHeartbeatGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<A2AHeartbeatGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof A2AHeartbeatGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], A2AHeartbeatGroupByOutputType[P]>
            : GetScalarType<T[P], A2AHeartbeatGroupByOutputType[P]>
        }
      >
    >


  export type A2AHeartbeatSelect<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    agentId?: boolean
    timestamp?: boolean
    status?: boolean
    load?: boolean
    activeConnections?: boolean
    lastActivity?: boolean
    metadata?: boolean
    createdAt?: boolean
    agent?: boolean | A2AAgentArgs<ExtArgs>
  }, ExtArgs["result"]["a2AHeartbeat"]>

  export type A2AHeartbeatSelectScalar = {
    id?: boolean
    agentId?: boolean
    timestamp?: boolean
    status?: boolean
    load?: boolean
    activeConnections?: boolean
    lastActivity?: boolean
    metadata?: boolean
    createdAt?: boolean
  }

  export type A2AHeartbeatInclude<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    agent?: boolean | A2AAgentArgs<ExtArgs>
  }


  type A2AHeartbeatGetPayload<S extends boolean | null | undefined | A2AHeartbeatArgs> = $Types.GetResult<A2AHeartbeatPayload, S>

  type A2AHeartbeatCountArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = 
    Omit<A2AHeartbeatFindManyArgs, 'select' | 'include'> & {
      select?: A2AHeartbeatCountAggregateInputType | true
    }

  export interface A2AHeartbeatDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['A2AHeartbeat'], meta: { name: 'A2AHeartbeat' } }
    /**
     * Find zero or one A2AHeartbeat that matches the filter.
     * @param {A2AHeartbeatFindUniqueArgs} args - Arguments to find a A2AHeartbeat
     * @example
     * // Get one A2AHeartbeat
     * const a2AHeartbeat = await prisma.a2AHeartbeat.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends A2AHeartbeatFindUniqueArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, A2AHeartbeatFindUniqueArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'A2AHeartbeat'> extends True ? Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'findUnique', never>, never, ExtArgs> : Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'findUnique', never> | null, null, ExtArgs>

    /**
     * Find one A2AHeartbeat that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {A2AHeartbeatFindUniqueOrThrowArgs} args - Arguments to find a A2AHeartbeat
     * @example
     * // Get one A2AHeartbeat
     * const a2AHeartbeat = await prisma.a2AHeartbeat.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends A2AHeartbeatFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AHeartbeatFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'findUniqueOrThrow', never>, never, ExtArgs>

    /**
     * Find the first A2AHeartbeat that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AHeartbeatFindFirstArgs} args - Arguments to find a A2AHeartbeat
     * @example
     * // Get one A2AHeartbeat
     * const a2AHeartbeat = await prisma.a2AHeartbeat.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends A2AHeartbeatFindFirstArgs<ExtArgs>, LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, A2AHeartbeatFindFirstArgs<ExtArgs>>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'A2AHeartbeat'> extends True ? Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'findFirst', never>, never, ExtArgs> : Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'findFirst', never> | null, null, ExtArgs>

    /**
     * Find the first A2AHeartbeat that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AHeartbeatFindFirstOrThrowArgs} args - Arguments to find a A2AHeartbeat
     * @example
     * // Get one A2AHeartbeat
     * const a2AHeartbeat = await prisma.a2AHeartbeat.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends A2AHeartbeatFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AHeartbeatFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'findFirstOrThrow', never>, never, ExtArgs>

    /**
     * Find zero or more A2AHeartbeats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AHeartbeatFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all A2AHeartbeats
     * const a2AHeartbeats = await prisma.a2AHeartbeat.findMany()
     * 
     * // Get first 10 A2AHeartbeats
     * const a2AHeartbeats = await prisma.a2AHeartbeat.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const a2AHeartbeatWithIdOnly = await prisma.a2AHeartbeat.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends A2AHeartbeatFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AHeartbeatFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'findMany', never>>

    /**
     * Create a A2AHeartbeat.
     * @param {A2AHeartbeatCreateArgs} args - Arguments to create a A2AHeartbeat.
     * @example
     * // Create one A2AHeartbeat
     * const A2AHeartbeat = await prisma.a2AHeartbeat.create({
     *   data: {
     *     // ... data to create a A2AHeartbeat
     *   }
     * })
     * 
    **/
    create<T extends A2AHeartbeatCreateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AHeartbeatCreateArgs<ExtArgs>>
    ): Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'create', never>, never, ExtArgs>

    /**
     * Create many A2AHeartbeats.
     *     @param {A2AHeartbeatCreateManyArgs} args - Arguments to create many A2AHeartbeats.
     *     @example
     *     // Create many A2AHeartbeats
     *     const a2AHeartbeat = await prisma.a2AHeartbeat.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends A2AHeartbeatCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AHeartbeatCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a A2AHeartbeat.
     * @param {A2AHeartbeatDeleteArgs} args - Arguments to delete one A2AHeartbeat.
     * @example
     * // Delete one A2AHeartbeat
     * const A2AHeartbeat = await prisma.a2AHeartbeat.delete({
     *   where: {
     *     // ... filter to delete one A2AHeartbeat
     *   }
     * })
     * 
    **/
    delete<T extends A2AHeartbeatDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, A2AHeartbeatDeleteArgs<ExtArgs>>
    ): Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'delete', never>, never, ExtArgs>

    /**
     * Update one A2AHeartbeat.
     * @param {A2AHeartbeatUpdateArgs} args - Arguments to update one A2AHeartbeat.
     * @example
     * // Update one A2AHeartbeat
     * const a2AHeartbeat = await prisma.a2AHeartbeat.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends A2AHeartbeatUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, A2AHeartbeatUpdateArgs<ExtArgs>>
    ): Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'update', never>, never, ExtArgs>

    /**
     * Delete zero or more A2AHeartbeats.
     * @param {A2AHeartbeatDeleteManyArgs} args - Arguments to filter A2AHeartbeats to delete.
     * @example
     * // Delete a few A2AHeartbeats
     * const { count } = await prisma.a2AHeartbeat.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends A2AHeartbeatDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, A2AHeartbeatDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more A2AHeartbeats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AHeartbeatUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many A2AHeartbeats
     * const a2AHeartbeat = await prisma.a2AHeartbeat.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends A2AHeartbeatUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, A2AHeartbeatUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one A2AHeartbeat.
     * @param {A2AHeartbeatUpsertArgs} args - Arguments to update or create a A2AHeartbeat.
     * @example
     * // Update or create a A2AHeartbeat
     * const a2AHeartbeat = await prisma.a2AHeartbeat.upsert({
     *   create: {
     *     // ... data to create a A2AHeartbeat
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the A2AHeartbeat we want to update
     *   }
     * })
    **/
    upsert<T extends A2AHeartbeatUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, A2AHeartbeatUpsertArgs<ExtArgs>>
    ): Prisma__A2AHeartbeatClient<$Types.GetResult<A2AHeartbeatPayload<ExtArgs>, T, 'upsert', never>, never, ExtArgs>

    /**
     * Count the number of A2AHeartbeats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AHeartbeatCountArgs} args - Arguments to filter A2AHeartbeats to count.
     * @example
     * // Count the number of A2AHeartbeats
     * const count = await prisma.a2AHeartbeat.count({
     *   where: {
     *     // ... the filter for the A2AHeartbeats we want to count
     *   }
     * })
    **/
    count<T extends A2AHeartbeatCountArgs>(
      args?: Subset<T, A2AHeartbeatCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], A2AHeartbeatCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a A2AHeartbeat.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AHeartbeatAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends A2AHeartbeatAggregateArgs>(args: Subset<T, A2AHeartbeatAggregateArgs>): Prisma.PrismaPromise<GetA2AHeartbeatAggregateType<T>>

    /**
     * Group by A2AHeartbeat.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {A2AHeartbeatGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends A2AHeartbeatGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: A2AHeartbeatGroupByArgs['orderBy'] }
        : { orderBy?: A2AHeartbeatGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, A2AHeartbeatGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetA2AHeartbeatGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for A2AHeartbeat.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__A2AHeartbeatClient<T, Null = never, ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    agent<T extends A2AAgentArgs<ExtArgs> = {}>(args?: Subset<T, A2AAgentArgs<ExtArgs>>): Prisma__A2AAgentClient<$Types.GetResult<A2AAgentPayload<ExtArgs>, T, 'findUnique', never> | Null, never, ExtArgs>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * A2AHeartbeat base type for findUnique actions
   */
  export type A2AHeartbeatFindUniqueArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * Filter, which A2AHeartbeat to fetch.
     */
    where: A2AHeartbeatWhereUniqueInput
  }

  /**
   * A2AHeartbeat findUnique
   */
  export interface A2AHeartbeatFindUniqueArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AHeartbeatFindUniqueArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AHeartbeat findUniqueOrThrow
   */
  export type A2AHeartbeatFindUniqueOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * Filter, which A2AHeartbeat to fetch.
     */
    where: A2AHeartbeatWhereUniqueInput
  }


  /**
   * A2AHeartbeat base type for findFirst actions
   */
  export type A2AHeartbeatFindFirstArgsBase<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * Filter, which A2AHeartbeat to fetch.
     */
    where?: A2AHeartbeatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AHeartbeats to fetch.
     */
    orderBy?: Enumerable<A2AHeartbeatOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AHeartbeats.
     */
    cursor?: A2AHeartbeatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AHeartbeats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AHeartbeats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AHeartbeats.
     */
    distinct?: Enumerable<A2AHeartbeatScalarFieldEnum>
  }

  /**
   * A2AHeartbeat findFirst
   */
  export interface A2AHeartbeatFindFirstArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> extends A2AHeartbeatFindFirstArgsBase<ExtArgs> {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * A2AHeartbeat findFirstOrThrow
   */
  export type A2AHeartbeatFindFirstOrThrowArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * Filter, which A2AHeartbeat to fetch.
     */
    where?: A2AHeartbeatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AHeartbeats to fetch.
     */
    orderBy?: Enumerable<A2AHeartbeatOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for A2AHeartbeats.
     */
    cursor?: A2AHeartbeatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AHeartbeats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AHeartbeats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of A2AHeartbeats.
     */
    distinct?: Enumerable<A2AHeartbeatScalarFieldEnum>
  }


  /**
   * A2AHeartbeat findMany
   */
  export type A2AHeartbeatFindManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * Filter, which A2AHeartbeats to fetch.
     */
    where?: A2AHeartbeatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of A2AHeartbeats to fetch.
     */
    orderBy?: Enumerable<A2AHeartbeatOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing A2AHeartbeats.
     */
    cursor?: A2AHeartbeatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` A2AHeartbeats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` A2AHeartbeats.
     */
    skip?: number
    distinct?: Enumerable<A2AHeartbeatScalarFieldEnum>
  }


  /**
   * A2AHeartbeat create
   */
  export type A2AHeartbeatCreateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * The data needed to create a A2AHeartbeat.
     */
    data: XOR<A2AHeartbeatCreateInput, A2AHeartbeatUncheckedCreateInput>
  }


  /**
   * A2AHeartbeat createMany
   */
  export type A2AHeartbeatCreateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many A2AHeartbeats.
     */
    data: Enumerable<A2AHeartbeatCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * A2AHeartbeat update
   */
  export type A2AHeartbeatUpdateArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * The data needed to update a A2AHeartbeat.
     */
    data: XOR<A2AHeartbeatUpdateInput, A2AHeartbeatUncheckedUpdateInput>
    /**
     * Choose, which A2AHeartbeat to update.
     */
    where: A2AHeartbeatWhereUniqueInput
  }


  /**
   * A2AHeartbeat updateMany
   */
  export type A2AHeartbeatUpdateManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * The data used to update A2AHeartbeats.
     */
    data: XOR<A2AHeartbeatUpdateManyMutationInput, A2AHeartbeatUncheckedUpdateManyInput>
    /**
     * Filter which A2AHeartbeats to update
     */
    where?: A2AHeartbeatWhereInput
  }


  /**
   * A2AHeartbeat upsert
   */
  export type A2AHeartbeatUpsertArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * The filter to search for the A2AHeartbeat to update in case it exists.
     */
    where: A2AHeartbeatWhereUniqueInput
    /**
     * In case the A2AHeartbeat found by the `where` argument doesn't exist, create a new A2AHeartbeat with this data.
     */
    create: XOR<A2AHeartbeatCreateInput, A2AHeartbeatUncheckedCreateInput>
    /**
     * In case the A2AHeartbeat was found with the provided `where` argument, update it with this data.
     */
    update: XOR<A2AHeartbeatUpdateInput, A2AHeartbeatUncheckedUpdateInput>
  }


  /**
   * A2AHeartbeat delete
   */
  export type A2AHeartbeatDeleteArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
    /**
     * Filter which A2AHeartbeat to delete.
     */
    where: A2AHeartbeatWhereUniqueInput
  }


  /**
   * A2AHeartbeat deleteMany
   */
  export type A2AHeartbeatDeleteManyArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Filter which A2AHeartbeats to delete
     */
    where?: A2AHeartbeatWhereInput
  }


  /**
   * A2AHeartbeat without action
   */
  export type A2AHeartbeatArgs<ExtArgs extends $Extensions.Args = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the A2AHeartbeat
     */
    select?: A2AHeartbeatSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: A2AHeartbeatInclude<ExtArgs> | null
  }



  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TaskScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    type: 'type',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    dueDate: 'dueDate',
    assignedTo: 'assignedTo',
    createdBy: 'createdBy',
    metadata: 'metadata',
    tags: 'tags',
    dependencies: 'dependencies',
    error: 'error',
    completedAt: 'completedAt'
  };

  export type TaskScalarFieldEnum = (typeof TaskScalarFieldEnum)[keyof typeof TaskScalarFieldEnum]


  export const AgentScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    type: 'type',
    status: 'status',
    capabilities: 'capabilities',
    provider: 'provider',
    lastActive: 'lastActive',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    userId: 'userId'
  };

  export type AgentScalarFieldEnum = (typeof AgentScalarFieldEnum)[keyof typeof AgentScalarFieldEnum]


  export const RegisteredEntityScalarFieldEnum: {
    id: 'id',
    name: 'name',
    type: 'type',
    description: 'description',
    metadata: 'metadata',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type RegisteredEntityScalarFieldEnum = (typeof RegisteredEntityScalarFieldEnum)[keyof typeof RegisteredEntityScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    passwordHash: 'passwordHash',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ChatMessageScalarFieldEnum: {
    id: 'id',
    content: 'content',
    role: 'role',
    userId: 'userId',
    sessionId: 'sessionId',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ChatMessageScalarFieldEnum = (typeof ChatMessageScalarFieldEnum)[keyof typeof ChatMessageScalarFieldEnum]


  export const A2AAgentScalarFieldEnum: {
    id: 'id',
    agentId: 'agentId',
    name: 'name',
    type: 'type',
    version: 'version',
    description: 'description',
    metadata: 'metadata',
    endpoints: 'endpoints',
    authentication: 'authentication',
    status: 'status',
    lastHeartbeat: 'lastHeartbeat',
    registeredAt: 'registeredAt',
    updatedAt: 'updatedAt'
  };

  export type A2AAgentScalarFieldEnum = (typeof A2AAgentScalarFieldEnum)[keyof typeof A2AAgentScalarFieldEnum]


  export const A2AAgentCapabilityScalarFieldEnum: {
    id: 'id',
    agentId: 'agentId',
    name: 'name',
    description: 'description',
    version: 'version',
    parameters: 'parameters',
    metadata: 'metadata'
  };

  export type A2AAgentCapabilityScalarFieldEnum = (typeof A2AAgentCapabilityScalarFieldEnum)[keyof typeof A2AAgentCapabilityScalarFieldEnum]


  export const A2AMessageScalarFieldEnum: {
    id: 'id',
    messageId: 'messageId',
    protocolVersion: 'protocolVersion',
    timestamp: 'timestamp',
    fromAgentId: 'fromAgentId',
    toAgentId: 'toAgentId',
    type: 'type',
    priority: 'priority',
    conversationId: 'conversationId',
    requestId: 'requestId',
    ttl: 'ttl',
    payload: 'payload',
    routing: 'routing',
    signature: 'signature',
    checksum: 'checksum',
    metadata: 'metadata',
    deliveredAt: 'deliveredAt',
    acknowledgedAt: 'acknowledgedAt',
    createdAt: 'createdAt'
  };

  export type A2AMessageScalarFieldEnum = (typeof A2AMessageScalarFieldEnum)[keyof typeof A2AMessageScalarFieldEnum]


  export const A2AConversationScalarFieldEnum: {
    id: 'id',
    conversationId: 'conversationId',
    initiatorId: 'initiatorId',
    topic: 'topic',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type A2AConversationScalarFieldEnum = (typeof A2AConversationScalarFieldEnum)[keyof typeof A2AConversationScalarFieldEnum]


  export const A2AConversationParticipantScalarFieldEnum: {
    id: 'id',
    conversationId: 'conversationId',
    agentId: 'agentId',
    joinedAt: 'joinedAt',
    leftAt: 'leftAt',
    role: 'role'
  };

  export type A2AConversationParticipantScalarFieldEnum = (typeof A2AConversationParticipantScalarFieldEnum)[keyof typeof A2AConversationParticipantScalarFieldEnum]


  export const A2AHeartbeatScalarFieldEnum: {
    id: 'id',
    agentId: 'agentId',
    timestamp: 'timestamp',
    status: 'status',
    load: 'load',
    activeConnections: 'activeConnections',
    lastActivity: 'lastActivity',
    metadata: 'metadata',
    createdAt: 'createdAt'
  };

  export type A2AHeartbeatScalarFieldEnum = (typeof A2AHeartbeatScalarFieldEnum)[keyof typeof A2AHeartbeatScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Deep Input Types
   */


  export type TaskWhereInput = {
    AND?: Enumerable<TaskWhereInput>
    OR?: Enumerable<TaskWhereInput>
    NOT?: Enumerable<TaskWhereInput>
    id?: StringFilter | string
    title?: StringFilter | string
    description?: StringNullableFilter | string | null
    status?: EnumTaskStatusFilter | TaskStatus
    priority?: EnumTaskPriorityFilter | TaskPriority
    type?: StringFilter | string
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    dueDate?: DateTimeNullableFilter | Date | string | null
    assignedTo?: StringNullableFilter | string | null
    createdBy?: StringFilter | string
    metadata?: JsonNullableFilter
    tags?: StringNullableListFilter
    dependencies?: StringNullableListFilter
    error?: StringNullableFilter | string | null
    completedAt?: DateTimeNullableFilter | Date | string | null
  }

  export type TaskOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    priority?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    assignedTo?: SortOrderInput | SortOrder
    createdBy?: SortOrder
    metadata?: SortOrderInput | SortOrder
    tags?: SortOrder
    dependencies?: SortOrder
    error?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
  }

  export type TaskWhereUniqueInput = {
    id?: string
  }

  export type TaskOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    priority?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    assignedTo?: SortOrderInput | SortOrder
    createdBy?: SortOrder
    metadata?: SortOrderInput | SortOrder
    tags?: SortOrder
    dependencies?: SortOrder
    error?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    _count?: TaskCountOrderByAggregateInput
    _max?: TaskMaxOrderByAggregateInput
    _min?: TaskMinOrderByAggregateInput
  }

  export type TaskScalarWhereWithAggregatesInput = {
    AND?: Enumerable<TaskScalarWhereWithAggregatesInput>
    OR?: Enumerable<TaskScalarWhereWithAggregatesInput>
    NOT?: Enumerable<TaskScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    title?: StringWithAggregatesFilter | string
    description?: StringNullableWithAggregatesFilter | string | null
    status?: EnumTaskStatusWithAggregatesFilter | TaskStatus
    priority?: EnumTaskPriorityWithAggregatesFilter | TaskPriority
    type?: StringWithAggregatesFilter | string
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
    dueDate?: DateTimeNullableWithAggregatesFilter | Date | string | null
    assignedTo?: StringNullableWithAggregatesFilter | string | null
    createdBy?: StringWithAggregatesFilter | string
    metadata?: JsonNullableWithAggregatesFilter
    tags?: StringNullableListFilter
    dependencies?: StringNullableListFilter
    error?: StringNullableWithAggregatesFilter | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter | Date | string | null
  }

  export type AgentWhereInput = {
    AND?: Enumerable<AgentWhereInput>
    OR?: Enumerable<AgentWhereInput>
    NOT?: Enumerable<AgentWhereInput>
    id?: StringFilter | string
    name?: StringFilter | string
    description?: StringNullableFilter | string | null
    type?: EnumAgentTypeFilter | AgentType
    status?: EnumAgentStatusFilter | AgentStatus
    capabilities?: StringNullableListFilter
    provider?: StringFilter | string
    lastActive?: DateTimeFilter | Date | string
    metadata?: JsonNullableFilter
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    userId?: StringNullableFilter | string | null
    user?: XOR<UserRelationFilter, UserWhereInput> | null
  }

  export type AgentOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    type?: SortOrder
    status?: SortOrder
    capabilities?: SortOrder
    provider?: SortOrder
    lastActive?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    userId?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type AgentWhereUniqueInput = {
    id?: string
  }

  export type AgentOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    type?: SortOrder
    status?: SortOrder
    capabilities?: SortOrder
    provider?: SortOrder
    lastActive?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    userId?: SortOrderInput | SortOrder
    _count?: AgentCountOrderByAggregateInput
    _max?: AgentMaxOrderByAggregateInput
    _min?: AgentMinOrderByAggregateInput
  }

  export type AgentScalarWhereWithAggregatesInput = {
    AND?: Enumerable<AgentScalarWhereWithAggregatesInput>
    OR?: Enumerable<AgentScalarWhereWithAggregatesInput>
    NOT?: Enumerable<AgentScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    name?: StringWithAggregatesFilter | string
    description?: StringNullableWithAggregatesFilter | string | null
    type?: EnumAgentTypeWithAggregatesFilter | AgentType
    status?: EnumAgentStatusWithAggregatesFilter | AgentStatus
    capabilities?: StringNullableListFilter
    provider?: StringWithAggregatesFilter | string
    lastActive?: DateTimeWithAggregatesFilter | Date | string
    metadata?: JsonNullableWithAggregatesFilter
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
    userId?: StringNullableWithAggregatesFilter | string | null
  }

  export type RegisteredEntityWhereInput = {
    AND?: Enumerable<RegisteredEntityWhereInput>
    OR?: Enumerable<RegisteredEntityWhereInput>
    NOT?: Enumerable<RegisteredEntityWhereInput>
    id?: StringFilter | string
    name?: StringFilter | string
    type?: StringFilter | string
    description?: StringNullableFilter | string | null
    metadata?: JsonNullableFilter
    status?: EnumEntityStatusFilter | EntityStatus
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
  }

  export type RegisteredEntityOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    description?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RegisteredEntityWhereUniqueInput = {
    id?: string
  }

  export type RegisteredEntityOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    description?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RegisteredEntityCountOrderByAggregateInput
    _max?: RegisteredEntityMaxOrderByAggregateInput
    _min?: RegisteredEntityMinOrderByAggregateInput
  }

  export type RegisteredEntityScalarWhereWithAggregatesInput = {
    AND?: Enumerable<RegisteredEntityScalarWhereWithAggregatesInput>
    OR?: Enumerable<RegisteredEntityScalarWhereWithAggregatesInput>
    NOT?: Enumerable<RegisteredEntityScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    name?: StringWithAggregatesFilter | string
    type?: StringWithAggregatesFilter | string
    description?: StringNullableWithAggregatesFilter | string | null
    metadata?: JsonNullableWithAggregatesFilter
    status?: EnumEntityStatusWithAggregatesFilter | EntityStatus
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type UserWhereInput = {
    AND?: Enumerable<UserWhereInput>
    OR?: Enumerable<UserWhereInput>
    NOT?: Enumerable<UserWhereInput>
    id?: StringFilter | string
    email?: StringFilter | string
    name?: StringNullableFilter | string | null
    passwordHash?: StringFilter | string
    role?: EnumUserRoleFilter | UserRole
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    agents?: AgentListRelationFilter
    chatMessages?: ChatMessageListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    agents?: AgentOrderByRelationAggregateInput
    chatMessages?: ChatMessageOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = {
    id?: string
    email?: string
  }

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: Enumerable<UserScalarWhereWithAggregatesInput>
    OR?: Enumerable<UserScalarWhereWithAggregatesInput>
    NOT?: Enumerable<UserScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    email?: StringWithAggregatesFilter | string
    name?: StringNullableWithAggregatesFilter | string | null
    passwordHash?: StringWithAggregatesFilter | string
    role?: EnumUserRoleWithAggregatesFilter | UserRole
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type ChatMessageWhereInput = {
    AND?: Enumerable<ChatMessageWhereInput>
    OR?: Enumerable<ChatMessageWhereInput>
    NOT?: Enumerable<ChatMessageWhereInput>
    id?: StringFilter | string
    content?: StringFilter | string
    role?: StringFilter | string
    userId?: StringFilter | string
    sessionId?: StringNullableFilter | string | null
    metadata?: JsonNullableFilter
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type ChatMessageOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type ChatMessageWhereUniqueInput = {
    id?: string
  }

  export type ChatMessageOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ChatMessageCountOrderByAggregateInput
    _max?: ChatMessageMaxOrderByAggregateInput
    _min?: ChatMessageMinOrderByAggregateInput
  }

  export type ChatMessageScalarWhereWithAggregatesInput = {
    AND?: Enumerable<ChatMessageScalarWhereWithAggregatesInput>
    OR?: Enumerable<ChatMessageScalarWhereWithAggregatesInput>
    NOT?: Enumerable<ChatMessageScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    content?: StringWithAggregatesFilter | string
    role?: StringWithAggregatesFilter | string
    userId?: StringWithAggregatesFilter | string
    sessionId?: StringNullableWithAggregatesFilter | string | null
    metadata?: JsonNullableWithAggregatesFilter
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type A2AAgentWhereInput = {
    AND?: Enumerable<A2AAgentWhereInput>
    OR?: Enumerable<A2AAgentWhereInput>
    NOT?: Enumerable<A2AAgentWhereInput>
    id?: StringFilter | string
    agentId?: StringFilter | string
    name?: StringFilter | string
    type?: StringFilter | string
    version?: StringFilter | string
    description?: StringNullableFilter | string | null
    metadata?: JsonNullableFilter
    endpoints?: JsonNullableFilter
    authentication?: JsonNullableFilter
    status?: EnumA2AAgentStatusFilter | A2AAgentStatus
    lastHeartbeat?: DateTimeNullableFilter | Date | string | null
    registeredAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    capabilities?: A2AAgentCapabilityListRelationFilter
    sentMessages?: A2AMessageListRelationFilter
    receivedMessages?: A2AMessageListRelationFilter
    conversations?: A2AConversationParticipantListRelationFilter
    heartbeats?: A2AHeartbeatListRelationFilter
  }

  export type A2AAgentOrderByWithRelationInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    version?: SortOrder
    description?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    endpoints?: SortOrderInput | SortOrder
    authentication?: SortOrderInput | SortOrder
    status?: SortOrder
    lastHeartbeat?: SortOrderInput | SortOrder
    registeredAt?: SortOrder
    updatedAt?: SortOrder
    capabilities?: A2AAgentCapabilityOrderByRelationAggregateInput
    sentMessages?: A2AMessageOrderByRelationAggregateInput
    receivedMessages?: A2AMessageOrderByRelationAggregateInput
    conversations?: A2AConversationParticipantOrderByRelationAggregateInput
    heartbeats?: A2AHeartbeatOrderByRelationAggregateInput
  }

  export type A2AAgentWhereUniqueInput = {
    id?: string
    agentId?: string
  }

  export type A2AAgentOrderByWithAggregationInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    version?: SortOrder
    description?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    endpoints?: SortOrderInput | SortOrder
    authentication?: SortOrderInput | SortOrder
    status?: SortOrder
    lastHeartbeat?: SortOrderInput | SortOrder
    registeredAt?: SortOrder
    updatedAt?: SortOrder
    _count?: A2AAgentCountOrderByAggregateInput
    _max?: A2AAgentMaxOrderByAggregateInput
    _min?: A2AAgentMinOrderByAggregateInput
  }

  export type A2AAgentScalarWhereWithAggregatesInput = {
    AND?: Enumerable<A2AAgentScalarWhereWithAggregatesInput>
    OR?: Enumerable<A2AAgentScalarWhereWithAggregatesInput>
    NOT?: Enumerable<A2AAgentScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    agentId?: StringWithAggregatesFilter | string
    name?: StringWithAggregatesFilter | string
    type?: StringWithAggregatesFilter | string
    version?: StringWithAggregatesFilter | string
    description?: StringNullableWithAggregatesFilter | string | null
    metadata?: JsonNullableWithAggregatesFilter
    endpoints?: JsonNullableWithAggregatesFilter
    authentication?: JsonNullableWithAggregatesFilter
    status?: EnumA2AAgentStatusWithAggregatesFilter | A2AAgentStatus
    lastHeartbeat?: DateTimeNullableWithAggregatesFilter | Date | string | null
    registeredAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type A2AAgentCapabilityWhereInput = {
    AND?: Enumerable<A2AAgentCapabilityWhereInput>
    OR?: Enumerable<A2AAgentCapabilityWhereInput>
    NOT?: Enumerable<A2AAgentCapabilityWhereInput>
    id?: StringFilter | string
    agentId?: StringFilter | string
    name?: StringFilter | string
    description?: StringNullableFilter | string | null
    version?: StringFilter | string
    parameters?: JsonNullableFilter
    metadata?: JsonNullableFilter
    agent?: XOR<A2AAgentRelationFilter, A2AAgentWhereInput>
  }

  export type A2AAgentCapabilityOrderByWithRelationInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    version?: SortOrder
    parameters?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    agent?: A2AAgentOrderByWithRelationInput
  }

  export type A2AAgentCapabilityWhereUniqueInput = {
    id?: string
    agentId_name?: A2AAgentCapabilityAgentIdNameCompoundUniqueInput
  }

  export type A2AAgentCapabilityOrderByWithAggregationInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    version?: SortOrder
    parameters?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    _count?: A2AAgentCapabilityCountOrderByAggregateInput
    _max?: A2AAgentCapabilityMaxOrderByAggregateInput
    _min?: A2AAgentCapabilityMinOrderByAggregateInput
  }

  export type A2AAgentCapabilityScalarWhereWithAggregatesInput = {
    AND?: Enumerable<A2AAgentCapabilityScalarWhereWithAggregatesInput>
    OR?: Enumerable<A2AAgentCapabilityScalarWhereWithAggregatesInput>
    NOT?: Enumerable<A2AAgentCapabilityScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    agentId?: StringWithAggregatesFilter | string
    name?: StringWithAggregatesFilter | string
    description?: StringNullableWithAggregatesFilter | string | null
    version?: StringWithAggregatesFilter | string
    parameters?: JsonNullableWithAggregatesFilter
    metadata?: JsonNullableWithAggregatesFilter
  }

  export type A2AMessageWhereInput = {
    AND?: Enumerable<A2AMessageWhereInput>
    OR?: Enumerable<A2AMessageWhereInput>
    NOT?: Enumerable<A2AMessageWhereInput>
    id?: StringFilter | string
    messageId?: StringFilter | string
    protocolVersion?: StringFilter | string
    timestamp?: DateTimeFilter | Date | string
    fromAgentId?: StringFilter | string
    toAgentId?: StringNullableFilter | string | null
    type?: EnumA2AMessageTypeFilter | A2AMessageType
    priority?: EnumA2AMessagePriorityFilter | A2AMessagePriority
    conversationId?: StringNullableFilter | string | null
    requestId?: StringNullableFilter | string | null
    ttl?: IntNullableFilter | number | null
    payload?: JsonFilter
    routing?: JsonNullableFilter
    signature?: StringNullableFilter | string | null
    checksum?: StringNullableFilter | string | null
    metadata?: JsonNullableFilter
    deliveredAt?: DateTimeNullableFilter | Date | string | null
    acknowledgedAt?: DateTimeNullableFilter | Date | string | null
    createdAt?: DateTimeFilter | Date | string
    fromAgent?: XOR<A2AAgentRelationFilter, A2AAgentWhereInput>
    toAgent?: XOR<A2AAgentRelationFilter, A2AAgentWhereInput> | null
    conversation?: XOR<A2AConversationRelationFilter, A2AConversationWhereInput> | null
  }

  export type A2AMessageOrderByWithRelationInput = {
    id?: SortOrder
    messageId?: SortOrder
    protocolVersion?: SortOrder
    timestamp?: SortOrder
    fromAgentId?: SortOrder
    toAgentId?: SortOrderInput | SortOrder
    type?: SortOrder
    priority?: SortOrder
    conversationId?: SortOrderInput | SortOrder
    requestId?: SortOrderInput | SortOrder
    ttl?: SortOrderInput | SortOrder
    payload?: SortOrder
    routing?: SortOrderInput | SortOrder
    signature?: SortOrderInput | SortOrder
    checksum?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    deliveredAt?: SortOrderInput | SortOrder
    acknowledgedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    fromAgent?: A2AAgentOrderByWithRelationInput
    toAgent?: A2AAgentOrderByWithRelationInput
    conversation?: A2AConversationOrderByWithRelationInput
  }

  export type A2AMessageWhereUniqueInput = {
    id?: string
    messageId?: string
  }

  export type A2AMessageOrderByWithAggregationInput = {
    id?: SortOrder
    messageId?: SortOrder
    protocolVersion?: SortOrder
    timestamp?: SortOrder
    fromAgentId?: SortOrder
    toAgentId?: SortOrderInput | SortOrder
    type?: SortOrder
    priority?: SortOrder
    conversationId?: SortOrderInput | SortOrder
    requestId?: SortOrderInput | SortOrder
    ttl?: SortOrderInput | SortOrder
    payload?: SortOrder
    routing?: SortOrderInput | SortOrder
    signature?: SortOrderInput | SortOrder
    checksum?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    deliveredAt?: SortOrderInput | SortOrder
    acknowledgedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: A2AMessageCountOrderByAggregateInput
    _avg?: A2AMessageAvgOrderByAggregateInput
    _max?: A2AMessageMaxOrderByAggregateInput
    _min?: A2AMessageMinOrderByAggregateInput
    _sum?: A2AMessageSumOrderByAggregateInput
  }

  export type A2AMessageScalarWhereWithAggregatesInput = {
    AND?: Enumerable<A2AMessageScalarWhereWithAggregatesInput>
    OR?: Enumerable<A2AMessageScalarWhereWithAggregatesInput>
    NOT?: Enumerable<A2AMessageScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    messageId?: StringWithAggregatesFilter | string
    protocolVersion?: StringWithAggregatesFilter | string
    timestamp?: DateTimeWithAggregatesFilter | Date | string
    fromAgentId?: StringWithAggregatesFilter | string
    toAgentId?: StringNullableWithAggregatesFilter | string | null
    type?: EnumA2AMessageTypeWithAggregatesFilter | A2AMessageType
    priority?: EnumA2AMessagePriorityWithAggregatesFilter | A2AMessagePriority
    conversationId?: StringNullableWithAggregatesFilter | string | null
    requestId?: StringNullableWithAggregatesFilter | string | null
    ttl?: IntNullableWithAggregatesFilter | number | null
    payload?: JsonWithAggregatesFilter
    routing?: JsonNullableWithAggregatesFilter
    signature?: StringNullableWithAggregatesFilter | string | null
    checksum?: StringNullableWithAggregatesFilter | string | null
    metadata?: JsonNullableWithAggregatesFilter
    deliveredAt?: DateTimeNullableWithAggregatesFilter | Date | string | null
    acknowledgedAt?: DateTimeNullableWithAggregatesFilter | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type A2AConversationWhereInput = {
    AND?: Enumerable<A2AConversationWhereInput>
    OR?: Enumerable<A2AConversationWhereInput>
    NOT?: Enumerable<A2AConversationWhereInput>
    id?: StringFilter | string
    conversationId?: StringFilter | string
    initiatorId?: StringFilter | string
    topic?: StringNullableFilter | string | null
    status?: EnumA2AConversationStatusFilter | A2AConversationStatus
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    participants?: A2AConversationParticipantListRelationFilter
    messages?: A2AMessageListRelationFilter
  }

  export type A2AConversationOrderByWithRelationInput = {
    id?: SortOrder
    conversationId?: SortOrder
    initiatorId?: SortOrder
    topic?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    participants?: A2AConversationParticipantOrderByRelationAggregateInput
    messages?: A2AMessageOrderByRelationAggregateInput
  }

  export type A2AConversationWhereUniqueInput = {
    id?: string
    conversationId?: string
  }

  export type A2AConversationOrderByWithAggregationInput = {
    id?: SortOrder
    conversationId?: SortOrder
    initiatorId?: SortOrder
    topic?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: A2AConversationCountOrderByAggregateInput
    _max?: A2AConversationMaxOrderByAggregateInput
    _min?: A2AConversationMinOrderByAggregateInput
  }

  export type A2AConversationScalarWhereWithAggregatesInput = {
    AND?: Enumerable<A2AConversationScalarWhereWithAggregatesInput>
    OR?: Enumerable<A2AConversationScalarWhereWithAggregatesInput>
    NOT?: Enumerable<A2AConversationScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    conversationId?: StringWithAggregatesFilter | string
    initiatorId?: StringWithAggregatesFilter | string
    topic?: StringNullableWithAggregatesFilter | string | null
    status?: EnumA2AConversationStatusWithAggregatesFilter | A2AConversationStatus
    createdAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type A2AConversationParticipantWhereInput = {
    AND?: Enumerable<A2AConversationParticipantWhereInput>
    OR?: Enumerable<A2AConversationParticipantWhereInput>
    NOT?: Enumerable<A2AConversationParticipantWhereInput>
    id?: StringFilter | string
    conversationId?: StringFilter | string
    agentId?: StringFilter | string
    joinedAt?: DateTimeFilter | Date | string
    leftAt?: DateTimeNullableFilter | Date | string | null
    role?: StringNullableFilter | string | null
    conversation?: XOR<A2AConversationRelationFilter, A2AConversationWhereInput>
    agent?: XOR<A2AAgentRelationFilter, A2AAgentWhereInput>
  }

  export type A2AConversationParticipantOrderByWithRelationInput = {
    id?: SortOrder
    conversationId?: SortOrder
    agentId?: SortOrder
    joinedAt?: SortOrder
    leftAt?: SortOrderInput | SortOrder
    role?: SortOrderInput | SortOrder
    conversation?: A2AConversationOrderByWithRelationInput
    agent?: A2AAgentOrderByWithRelationInput
  }

  export type A2AConversationParticipantWhereUniqueInput = {
    id?: string
    conversationId_agentId?: A2AConversationParticipantConversationIdAgentIdCompoundUniqueInput
  }

  export type A2AConversationParticipantOrderByWithAggregationInput = {
    id?: SortOrder
    conversationId?: SortOrder
    agentId?: SortOrder
    joinedAt?: SortOrder
    leftAt?: SortOrderInput | SortOrder
    role?: SortOrderInput | SortOrder
    _count?: A2AConversationParticipantCountOrderByAggregateInput
    _max?: A2AConversationParticipantMaxOrderByAggregateInput
    _min?: A2AConversationParticipantMinOrderByAggregateInput
  }

  export type A2AConversationParticipantScalarWhereWithAggregatesInput = {
    AND?: Enumerable<A2AConversationParticipantScalarWhereWithAggregatesInput>
    OR?: Enumerable<A2AConversationParticipantScalarWhereWithAggregatesInput>
    NOT?: Enumerable<A2AConversationParticipantScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    conversationId?: StringWithAggregatesFilter | string
    agentId?: StringWithAggregatesFilter | string
    joinedAt?: DateTimeWithAggregatesFilter | Date | string
    leftAt?: DateTimeNullableWithAggregatesFilter | Date | string | null
    role?: StringNullableWithAggregatesFilter | string | null
  }

  export type A2AHeartbeatWhereInput = {
    AND?: Enumerable<A2AHeartbeatWhereInput>
    OR?: Enumerable<A2AHeartbeatWhereInput>
    NOT?: Enumerable<A2AHeartbeatWhereInput>
    id?: StringFilter | string
    agentId?: StringFilter | string
    timestamp?: DateTimeFilter | Date | string
    status?: EnumA2AAgentStatusFilter | A2AAgentStatus
    load?: FloatNullableFilter | number | null
    activeConnections?: IntNullableFilter | number | null
    lastActivity?: DateTimeNullableFilter | Date | string | null
    metadata?: JsonNullableFilter
    createdAt?: DateTimeFilter | Date | string
    agent?: XOR<A2AAgentRelationFilter, A2AAgentWhereInput>
  }

  export type A2AHeartbeatOrderByWithRelationInput = {
    id?: SortOrder
    agentId?: SortOrder
    timestamp?: SortOrder
    status?: SortOrder
    load?: SortOrderInput | SortOrder
    activeConnections?: SortOrderInput | SortOrder
    lastActivity?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    agent?: A2AAgentOrderByWithRelationInput
  }

  export type A2AHeartbeatWhereUniqueInput = {
    id?: string
  }

  export type A2AHeartbeatOrderByWithAggregationInput = {
    id?: SortOrder
    agentId?: SortOrder
    timestamp?: SortOrder
    status?: SortOrder
    load?: SortOrderInput | SortOrder
    activeConnections?: SortOrderInput | SortOrder
    lastActivity?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: A2AHeartbeatCountOrderByAggregateInput
    _avg?: A2AHeartbeatAvgOrderByAggregateInput
    _max?: A2AHeartbeatMaxOrderByAggregateInput
    _min?: A2AHeartbeatMinOrderByAggregateInput
    _sum?: A2AHeartbeatSumOrderByAggregateInput
  }

  export type A2AHeartbeatScalarWhereWithAggregatesInput = {
    AND?: Enumerable<A2AHeartbeatScalarWhereWithAggregatesInput>
    OR?: Enumerable<A2AHeartbeatScalarWhereWithAggregatesInput>
    NOT?: Enumerable<A2AHeartbeatScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    agentId?: StringWithAggregatesFilter | string
    timestamp?: DateTimeWithAggregatesFilter | Date | string
    status?: EnumA2AAgentStatusWithAggregatesFilter | A2AAgentStatus
    load?: FloatNullableWithAggregatesFilter | number | null
    activeConnections?: IntNullableWithAggregatesFilter | number | null
    lastActivity?: DateTimeNullableWithAggregatesFilter | Date | string | null
    metadata?: JsonNullableWithAggregatesFilter
    createdAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type TaskCreateInput = {
    id?: string
    title: string
    description?: string | null
    status?: TaskStatus
    priority?: TaskPriority
    type: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dueDate?: Date | string | null
    assignedTo?: string | null
    createdBy: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    tags?: TaskCreatetagsInput | Enumerable<string>
    dependencies?: TaskCreatedependenciesInput | Enumerable<string>
    error?: string | null
    completedAt?: Date | string | null
  }

  export type TaskUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    status?: TaskStatus
    priority?: TaskPriority
    type: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dueDate?: Date | string | null
    assignedTo?: string | null
    createdBy: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    tags?: TaskCreatetagsInput | Enumerable<string>
    dependencies?: TaskCreatedependenciesInput | Enumerable<string>
    error?: string | null
    completedAt?: Date | string | null
  }

  export type TaskUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumTaskStatusFieldUpdateOperationsInput | TaskStatus
    priority?: EnumTaskPriorityFieldUpdateOperationsInput | TaskPriority
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    tags?: TaskUpdatetagsInput | Enumerable<string>
    dependencies?: TaskUpdatedependenciesInput | Enumerable<string>
    error?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumTaskStatusFieldUpdateOperationsInput | TaskStatus
    priority?: EnumTaskPriorityFieldUpdateOperationsInput | TaskPriority
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    tags?: TaskUpdatetagsInput | Enumerable<string>
    dependencies?: TaskUpdatedependenciesInput | Enumerable<string>
    error?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    status?: TaskStatus
    priority?: TaskPriority
    type: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dueDate?: Date | string | null
    assignedTo?: string | null
    createdBy: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    tags?: TaskCreatetagsInput | Enumerable<string>
    dependencies?: TaskCreatedependenciesInput | Enumerable<string>
    error?: string | null
    completedAt?: Date | string | null
  }

  export type TaskUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumTaskStatusFieldUpdateOperationsInput | TaskStatus
    priority?: EnumTaskPriorityFieldUpdateOperationsInput | TaskPriority
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    tags?: TaskUpdatetagsInput | Enumerable<string>
    dependencies?: TaskUpdatedependenciesInput | Enumerable<string>
    error?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumTaskStatusFieldUpdateOperationsInput | TaskStatus
    priority?: EnumTaskPriorityFieldUpdateOperationsInput | TaskPriority
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    tags?: TaskUpdatetagsInput | Enumerable<string>
    dependencies?: TaskUpdatedependenciesInput | Enumerable<string>
    error?: NullableStringFieldUpdateOperationsInput | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AgentCreateInput = {
    id?: string
    name: string
    description?: string | null
    type?: AgentType
    status?: AgentStatus
    capabilities?: AgentCreatecapabilitiesInput | Enumerable<string>
    provider: string
    lastActive?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    user?: UserCreateNestedOneWithoutAgentsInput
  }

  export type AgentUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    type?: AgentType
    status?: AgentStatus
    capabilities?: AgentCreatecapabilitiesInput | Enumerable<string>
    provider: string
    lastActive?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    userId?: string | null
  }

  export type AgentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumAgentTypeFieldUpdateOperationsInput | AgentType
    status?: EnumAgentStatusFieldUpdateOperationsInput | AgentStatus
    capabilities?: AgentUpdatecapabilitiesInput | Enumerable<string>
    provider?: StringFieldUpdateOperationsInput | string
    lastActive?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneWithoutAgentsNestedInput
  }

  export type AgentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumAgentTypeFieldUpdateOperationsInput | AgentType
    status?: EnumAgentStatusFieldUpdateOperationsInput | AgentStatus
    capabilities?: AgentUpdatecapabilitiesInput | Enumerable<string>
    provider?: StringFieldUpdateOperationsInput | string
    lastActive?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AgentCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    type?: AgentType
    status?: AgentStatus
    capabilities?: AgentCreatecapabilitiesInput | Enumerable<string>
    provider: string
    lastActive?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    userId?: string | null
  }

  export type AgentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumAgentTypeFieldUpdateOperationsInput | AgentType
    status?: EnumAgentStatusFieldUpdateOperationsInput | AgentStatus
    capabilities?: AgentUpdatecapabilitiesInput | Enumerable<string>
    provider?: StringFieldUpdateOperationsInput | string
    lastActive?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumAgentTypeFieldUpdateOperationsInput | AgentType
    status?: EnumAgentStatusFieldUpdateOperationsInput | AgentStatus
    capabilities?: AgentUpdatecapabilitiesInput | Enumerable<string>
    provider?: StringFieldUpdateOperationsInput | string
    lastActive?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RegisteredEntityCreateInput = {
    id?: string
    name: string
    type: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    status?: EntityStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RegisteredEntityUncheckedCreateInput = {
    id?: string
    name: string
    type: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    status?: EntityStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RegisteredEntityUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumEntityStatusFieldUpdateOperationsInput | EntityStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RegisteredEntityUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumEntityStatusFieldUpdateOperationsInput | EntityStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RegisteredEntityCreateManyInput = {
    id?: string
    name: string
    type: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    status?: EntityStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RegisteredEntityUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumEntityStatusFieldUpdateOperationsInput | EntityStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RegisteredEntityUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumEntityStatusFieldUpdateOperationsInput | EntityStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    name?: string | null
    passwordHash: string
    role?: UserRole
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentCreateNestedManyWithoutUserInput
    chatMessages?: ChatMessageCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    name?: string | null
    passwordHash: string
    role?: UserRole
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentUncheckedCreateNestedManyWithoutUserInput
    chatMessages?: ChatMessageUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | UserRole
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUpdateManyWithoutUserNestedInput
    chatMessages?: ChatMessageUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | UserRole
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUncheckedUpdateManyWithoutUserNestedInput
    chatMessages?: ChatMessageUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    name?: string | null
    passwordHash: string
    role?: UserRole
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | UserRole
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | UserRole
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageCreateInput = {
    id?: string
    content: string
    role: string
    sessionId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutChatMessagesInput
  }

  export type ChatMessageUncheckedCreateInput = {
    id?: string
    content: string
    role: string
    userId: string
    sessionId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChatMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutChatMessagesNestedInput
  }

  export type ChatMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageCreateManyInput = {
    id?: string
    content: string
    role: string
    userId: string
    sessionId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChatMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AAgentCreateInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityCreateNestedManyWithoutAgentInput
    sentMessages?: A2AMessageCreateNestedManyWithoutFromAgentInput
    receivedMessages?: A2AMessageCreateNestedManyWithoutToAgentInput
    conversations?: A2AConversationParticipantCreateNestedManyWithoutAgentInput
    heartbeats?: A2AHeartbeatCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentUncheckedCreateInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityUncheckedCreateNestedManyWithoutAgentInput
    sentMessages?: A2AMessageUncheckedCreateNestedManyWithoutFromAgentInput
    receivedMessages?: A2AMessageUncheckedCreateNestedManyWithoutToAgentInput
    conversations?: A2AConversationParticipantUncheckedCreateNestedManyWithoutAgentInput
    heartbeats?: A2AHeartbeatUncheckedCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUpdateManyWithoutAgentNestedInput
    sentMessages?: A2AMessageUpdateManyWithoutFromAgentNestedInput
    receivedMessages?: A2AMessageUpdateManyWithoutToAgentNestedInput
    conversations?: A2AConversationParticipantUpdateManyWithoutAgentNestedInput
    heartbeats?: A2AHeartbeatUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUncheckedUpdateManyWithoutAgentNestedInput
    sentMessages?: A2AMessageUncheckedUpdateManyWithoutFromAgentNestedInput
    receivedMessages?: A2AMessageUncheckedUpdateManyWithoutToAgentNestedInput
    conversations?: A2AConversationParticipantUncheckedUpdateManyWithoutAgentNestedInput
    heartbeats?: A2AHeartbeatUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentCreateManyInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
  }

  export type A2AAgentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AAgentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AAgentCapabilityCreateInput = {
    id?: string
    name: string
    description?: string | null
    version: string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    agent: A2AAgentCreateNestedOneWithoutCapabilitiesInput
  }

  export type A2AAgentCapabilityUncheckedCreateInput = {
    id?: string
    agentId: string
    name: string
    description?: string | null
    version: string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AAgentCapabilityUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    version?: StringFieldUpdateOperationsInput | string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    agent?: A2AAgentUpdateOneRequiredWithoutCapabilitiesNestedInput
  }

  export type A2AAgentCapabilityUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    version?: StringFieldUpdateOperationsInput | string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AAgentCapabilityCreateManyInput = {
    id?: string
    agentId: string
    name: string
    description?: string | null
    version: string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AAgentCapabilityUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    version?: StringFieldUpdateOperationsInput | string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AAgentCapabilityUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    version?: StringFieldUpdateOperationsInput | string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AMessageCreateInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    type: A2AMessageType
    priority?: A2AMessagePriority
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
    fromAgent: A2AAgentCreateNestedOneWithoutSentMessagesInput
    toAgent?: A2AAgentCreateNestedOneWithoutReceivedMessagesInput
    conversation?: A2AConversationCreateNestedOneWithoutMessagesInput
  }

  export type A2AMessageUncheckedCreateInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    fromAgentId: string
    toAgentId?: string | null
    type: A2AMessageType
    priority?: A2AMessagePriority
    conversationId?: string | null
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type A2AMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgent?: A2AAgentUpdateOneRequiredWithoutSentMessagesNestedInput
    toAgent?: A2AAgentUpdateOneWithoutReceivedMessagesNestedInput
    conversation?: A2AConversationUpdateOneWithoutMessagesNestedInput
  }

  export type A2AMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgentId?: StringFieldUpdateOperationsInput | string
    toAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AMessageCreateManyInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    fromAgentId: string
    toAgentId?: string | null
    type: A2AMessageType
    priority?: A2AMessagePriority
    conversationId?: string | null
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type A2AMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgentId?: StringFieldUpdateOperationsInput | string
    toAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AConversationCreateInput = {
    id?: string
    conversationId: string
    initiatorId: string
    topic?: string | null
    status?: A2AConversationStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    participants?: A2AConversationParticipantCreateNestedManyWithoutConversationInput
    messages?: A2AMessageCreateNestedManyWithoutConversationInput
  }

  export type A2AConversationUncheckedCreateInput = {
    id?: string
    conversationId: string
    initiatorId: string
    topic?: string | null
    status?: A2AConversationStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    participants?: A2AConversationParticipantUncheckedCreateNestedManyWithoutConversationInput
    messages?: A2AMessageUncheckedCreateNestedManyWithoutConversationInput
  }

  export type A2AConversationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    initiatorId?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumA2AConversationStatusFieldUpdateOperationsInput | A2AConversationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    participants?: A2AConversationParticipantUpdateManyWithoutConversationNestedInput
    messages?: A2AMessageUpdateManyWithoutConversationNestedInput
  }

  export type A2AConversationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    initiatorId?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumA2AConversationStatusFieldUpdateOperationsInput | A2AConversationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    participants?: A2AConversationParticipantUncheckedUpdateManyWithoutConversationNestedInput
    messages?: A2AMessageUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type A2AConversationCreateManyInput = {
    id?: string
    conversationId: string
    initiatorId: string
    topic?: string | null
    status?: A2AConversationStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type A2AConversationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    initiatorId?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumA2AConversationStatusFieldUpdateOperationsInput | A2AConversationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AConversationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    initiatorId?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumA2AConversationStatusFieldUpdateOperationsInput | A2AConversationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AConversationParticipantCreateInput = {
    id?: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
    conversation: A2AConversationCreateNestedOneWithoutParticipantsInput
    agent: A2AAgentCreateNestedOneWithoutConversationsInput
  }

  export type A2AConversationParticipantUncheckedCreateInput = {
    id?: string
    conversationId: string
    agentId: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
  }

  export type A2AConversationParticipantUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    conversation?: A2AConversationUpdateOneRequiredWithoutParticipantsNestedInput
    agent?: A2AAgentUpdateOneRequiredWithoutConversationsNestedInput
  }

  export type A2AConversationParticipantUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type A2AConversationParticipantCreateManyInput = {
    id?: string
    conversationId: string
    agentId: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
  }

  export type A2AConversationParticipantUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type A2AConversationParticipantUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type A2AHeartbeatCreateInput = {
    id?: string
    timestamp: Date | string
    status: A2AAgentStatus
    load?: number | null
    activeConnections?: number | null
    lastActivity?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    agent: A2AAgentCreateNestedOneWithoutHeartbeatsInput
  }

  export type A2AHeartbeatUncheckedCreateInput = {
    id?: string
    agentId: string
    timestamp: Date | string
    status: A2AAgentStatus
    load?: number | null
    activeConnections?: number | null
    lastActivity?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type A2AHeartbeatUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    load?: NullableFloatFieldUpdateOperationsInput | number | null
    activeConnections?: NullableIntFieldUpdateOperationsInput | number | null
    lastActivity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agent?: A2AAgentUpdateOneRequiredWithoutHeartbeatsNestedInput
  }

  export type A2AHeartbeatUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    load?: NullableFloatFieldUpdateOperationsInput | number | null
    activeConnections?: NullableIntFieldUpdateOperationsInput | number | null
    lastActivity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AHeartbeatCreateManyInput = {
    id?: string
    agentId: string
    timestamp: Date | string
    status: A2AAgentStatus
    load?: number | null
    activeConnections?: number | null
    lastActivity?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type A2AHeartbeatUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    load?: NullableFloatFieldUpdateOperationsInput | number | null
    activeConnections?: NullableIntFieldUpdateOperationsInput | number | null
    lastActivity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AHeartbeatUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    load?: NullableFloatFieldUpdateOperationsInput | number | null
    activeConnections?: NullableIntFieldUpdateOperationsInput | number | null
    lastActivity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter = {
    equals?: string
    in?: Enumerable<string> | string
    notIn?: Enumerable<string> | string
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    mode?: QueryMode
    not?: NestedStringFilter | string
  }

  export type StringNullableFilter = {
    equals?: string | null
    in?: Enumerable<string> | string | null
    notIn?: Enumerable<string> | string | null
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    mode?: QueryMode
    not?: NestedStringNullableFilter | string | null
  }

  export type EnumTaskStatusFilter = {
    equals?: TaskStatus
    in?: Enumerable<TaskStatus>
    notIn?: Enumerable<TaskStatus>
    not?: NestedEnumTaskStatusFilter | TaskStatus
  }

  export type EnumTaskPriorityFilter = {
    equals?: TaskPriority
    in?: Enumerable<TaskPriority>
    notIn?: Enumerable<TaskPriority>
    not?: NestedEnumTaskPriorityFilter | TaskPriority
  }

  export type DateTimeFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string> | Date | string
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeFilter | Date | string
  }

  export type DateTimeNullableFilter = {
    equals?: Date | string | null
    in?: Enumerable<Date> | Enumerable<string> | Date | string | null
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string | null
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeNullableFilter | Date | string | null
  }
  export type JsonNullableFilter = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase>, Exclude<keyof Required<JsonNullableFilterBase>, 'path'>>,
        Required<JsonNullableFilterBase>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase>, 'path'>>

  export type JsonNullableFilterBase = {
    equals?: InputJsonValue | JsonNullValueFilter
    path?: string[]
    string_contains?: string
    string_starts_with?: string
    string_ends_with?: string
    array_contains?: InputJsonValue | null
    array_starts_with?: InputJsonValue | null
    array_ends_with?: InputJsonValue | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonNullValueFilter
  }

  export type StringNullableListFilter = {
    equals?: Enumerable<string> | null
    has?: string | null
    hasEvery?: Enumerable<string>
    hasSome?: Enumerable<string>
    isEmpty?: boolean
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TaskCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dueDate?: SortOrder
    assignedTo?: SortOrder
    createdBy?: SortOrder
    metadata?: SortOrder
    tags?: SortOrder
    dependencies?: SortOrder
    error?: SortOrder
    completedAt?: SortOrder
  }

  export type TaskMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dueDate?: SortOrder
    assignedTo?: SortOrder
    createdBy?: SortOrder
    error?: SortOrder
    completedAt?: SortOrder
  }

  export type TaskMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dueDate?: SortOrder
    assignedTo?: SortOrder
    createdBy?: SortOrder
    error?: SortOrder
    completedAt?: SortOrder
  }

  export type StringWithAggregatesFilter = {
    equals?: string
    in?: Enumerable<string> | string
    notIn?: Enumerable<string> | string
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter | string
    _count?: NestedIntFilter
    _min?: NestedStringFilter
    _max?: NestedStringFilter
  }

  export type StringNullableWithAggregatesFilter = {
    equals?: string | null
    in?: Enumerable<string> | string | null
    notIn?: Enumerable<string> | string | null
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter | string | null
    _count?: NestedIntNullableFilter
    _min?: NestedStringNullableFilter
    _max?: NestedStringNullableFilter
  }

  export type EnumTaskStatusWithAggregatesFilter = {
    equals?: TaskStatus
    in?: Enumerable<TaskStatus>
    notIn?: Enumerable<TaskStatus>
    not?: NestedEnumTaskStatusWithAggregatesFilter | TaskStatus
    _count?: NestedIntFilter
    _min?: NestedEnumTaskStatusFilter
    _max?: NestedEnumTaskStatusFilter
  }

  export type EnumTaskPriorityWithAggregatesFilter = {
    equals?: TaskPriority
    in?: Enumerable<TaskPriority>
    notIn?: Enumerable<TaskPriority>
    not?: NestedEnumTaskPriorityWithAggregatesFilter | TaskPriority
    _count?: NestedIntFilter
    _min?: NestedEnumTaskPriorityFilter
    _max?: NestedEnumTaskPriorityFilter
  }

  export type DateTimeWithAggregatesFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string> | Date | string
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeWithAggregatesFilter | Date | string
    _count?: NestedIntFilter
    _min?: NestedDateTimeFilter
    _max?: NestedDateTimeFilter
  }

  export type DateTimeNullableWithAggregatesFilter = {
    equals?: Date | string | null
    in?: Enumerable<Date> | Enumerable<string> | Date | string | null
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string | null
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeNullableWithAggregatesFilter | Date | string | null
    _count?: NestedIntNullableFilter
    _min?: NestedDateTimeNullableFilter
    _max?: NestedDateTimeNullableFilter
  }
  export type JsonNullableWithAggregatesFilter = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase = {
    equals?: InputJsonValue | JsonNullValueFilter
    path?: string[]
    string_contains?: string
    string_starts_with?: string
    string_ends_with?: string
    array_contains?: InputJsonValue | null
    array_starts_with?: InputJsonValue | null
    array_ends_with?: InputJsonValue | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonNullValueFilter
    _count?: NestedIntNullableFilter
    _min?: NestedJsonNullableFilter
    _max?: NestedJsonNullableFilter
  }

  export type EnumAgentTypeFilter = {
    equals?: AgentType
    in?: Enumerable<AgentType>
    notIn?: Enumerable<AgentType>
    not?: NestedEnumAgentTypeFilter | AgentType
  }

  export type EnumAgentStatusFilter = {
    equals?: AgentStatus
    in?: Enumerable<AgentStatus>
    notIn?: Enumerable<AgentStatus>
    not?: NestedEnumAgentStatusFilter | AgentStatus
  }

  export type UserRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type AgentCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    type?: SortOrder
    status?: SortOrder
    capabilities?: SortOrder
    provider?: SortOrder
    lastActive?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    userId?: SortOrder
  }

  export type AgentMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    type?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    lastActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    userId?: SortOrder
  }

  export type AgentMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    type?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    lastActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    userId?: SortOrder
  }

  export type EnumAgentTypeWithAggregatesFilter = {
    equals?: AgentType
    in?: Enumerable<AgentType>
    notIn?: Enumerable<AgentType>
    not?: NestedEnumAgentTypeWithAggregatesFilter | AgentType
    _count?: NestedIntFilter
    _min?: NestedEnumAgentTypeFilter
    _max?: NestedEnumAgentTypeFilter
  }

  export type EnumAgentStatusWithAggregatesFilter = {
    equals?: AgentStatus
    in?: Enumerable<AgentStatus>
    notIn?: Enumerable<AgentStatus>
    not?: NestedEnumAgentStatusWithAggregatesFilter | AgentStatus
    _count?: NestedIntFilter
    _min?: NestedEnumAgentStatusFilter
    _max?: NestedEnumAgentStatusFilter
  }

  export type EnumEntityStatusFilter = {
    equals?: EntityStatus
    in?: Enumerable<EntityStatus>
    notIn?: Enumerable<EntityStatus>
    not?: NestedEnumEntityStatusFilter | EntityStatus
  }

  export type RegisteredEntityCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    description?: SortOrder
    metadata?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RegisteredEntityMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    description?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RegisteredEntityMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    description?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumEntityStatusWithAggregatesFilter = {
    equals?: EntityStatus
    in?: Enumerable<EntityStatus>
    notIn?: Enumerable<EntityStatus>
    not?: NestedEnumEntityStatusWithAggregatesFilter | EntityStatus
    _count?: NestedIntFilter
    _min?: NestedEnumEntityStatusFilter
    _max?: NestedEnumEntityStatusFilter
  }

  export type EnumUserRoleFilter = {
    equals?: UserRole
    in?: Enumerable<UserRole>
    notIn?: Enumerable<UserRole>
    not?: NestedEnumUserRoleFilter | UserRole
  }

  export type AgentListRelationFilter = {
    every?: AgentWhereInput
    some?: AgentWhereInput
    none?: AgentWhereInput
  }

  export type ChatMessageListRelationFilter = {
    every?: ChatMessageWhereInput
    some?: ChatMessageWhereInput
    none?: ChatMessageWhereInput
  }

  export type AgentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChatMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumUserRoleWithAggregatesFilter = {
    equals?: UserRole
    in?: Enumerable<UserRole>
    notIn?: Enumerable<UserRole>
    not?: NestedEnumUserRoleWithAggregatesFilter | UserRole
    _count?: NestedIntFilter
    _min?: NestedEnumUserRoleFilter
    _max?: NestedEnumUserRoleFilter
  }

  export type ChatMessageCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChatMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChatMessageMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    role?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumA2AAgentStatusFilter = {
    equals?: A2AAgentStatus
    in?: Enumerable<A2AAgentStatus>
    notIn?: Enumerable<A2AAgentStatus>
    not?: NestedEnumA2AAgentStatusFilter | A2AAgentStatus
  }

  export type A2AAgentCapabilityListRelationFilter = {
    every?: A2AAgentCapabilityWhereInput
    some?: A2AAgentCapabilityWhereInput
    none?: A2AAgentCapabilityWhereInput
  }

  export type A2AMessageListRelationFilter = {
    every?: A2AMessageWhereInput
    some?: A2AMessageWhereInput
    none?: A2AMessageWhereInput
  }

  export type A2AConversationParticipantListRelationFilter = {
    every?: A2AConversationParticipantWhereInput
    some?: A2AConversationParticipantWhereInput
    none?: A2AConversationParticipantWhereInput
  }

  export type A2AHeartbeatListRelationFilter = {
    every?: A2AHeartbeatWhereInput
    some?: A2AHeartbeatWhereInput
    none?: A2AHeartbeatWhereInput
  }

  export type A2AAgentCapabilityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type A2AMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type A2AConversationParticipantOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type A2AHeartbeatOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type A2AAgentCountOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    version?: SortOrder
    description?: SortOrder
    metadata?: SortOrder
    endpoints?: SortOrder
    authentication?: SortOrder
    status?: SortOrder
    lastHeartbeat?: SortOrder
    registeredAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type A2AAgentMaxOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    version?: SortOrder
    description?: SortOrder
    status?: SortOrder
    lastHeartbeat?: SortOrder
    registeredAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type A2AAgentMinOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    type?: SortOrder
    version?: SortOrder
    description?: SortOrder
    status?: SortOrder
    lastHeartbeat?: SortOrder
    registeredAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumA2AAgentStatusWithAggregatesFilter = {
    equals?: A2AAgentStatus
    in?: Enumerable<A2AAgentStatus>
    notIn?: Enumerable<A2AAgentStatus>
    not?: NestedEnumA2AAgentStatusWithAggregatesFilter | A2AAgentStatus
    _count?: NestedIntFilter
    _min?: NestedEnumA2AAgentStatusFilter
    _max?: NestedEnumA2AAgentStatusFilter
  }

  export type A2AAgentRelationFilter = {
    is?: A2AAgentWhereInput | null
    isNot?: A2AAgentWhereInput | null
  }

  export type A2AAgentCapabilityAgentIdNameCompoundUniqueInput = {
    agentId: string
    name: string
  }

  export type A2AAgentCapabilityCountOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    version?: SortOrder
    parameters?: SortOrder
    metadata?: SortOrder
  }

  export type A2AAgentCapabilityMaxOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    version?: SortOrder
  }

  export type A2AAgentCapabilityMinOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    version?: SortOrder
  }

  export type EnumA2AMessageTypeFilter = {
    equals?: A2AMessageType
    in?: Enumerable<A2AMessageType>
    notIn?: Enumerable<A2AMessageType>
    not?: NestedEnumA2AMessageTypeFilter | A2AMessageType
  }

  export type EnumA2AMessagePriorityFilter = {
    equals?: A2AMessagePriority
    in?: Enumerable<A2AMessagePriority>
    notIn?: Enumerable<A2AMessagePriority>
    not?: NestedEnumA2AMessagePriorityFilter | A2AMessagePriority
  }

  export type IntNullableFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntNullableFilter | number | null
  }
  export type JsonFilter = 
    | PatchUndefined<
        Either<Required<JsonFilterBase>, Exclude<keyof Required<JsonFilterBase>, 'path'>>,
        Required<JsonFilterBase>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase>, 'path'>>

  export type JsonFilterBase = {
    equals?: InputJsonValue | JsonNullValueFilter
    path?: string[]
    string_contains?: string
    string_starts_with?: string
    string_ends_with?: string
    array_contains?: InputJsonValue | null
    array_starts_with?: InputJsonValue | null
    array_ends_with?: InputJsonValue | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonNullValueFilter
  }

  export type A2AConversationRelationFilter = {
    is?: A2AConversationWhereInput | null
    isNot?: A2AConversationWhereInput | null
  }

  export type A2AMessageCountOrderByAggregateInput = {
    id?: SortOrder
    messageId?: SortOrder
    protocolVersion?: SortOrder
    timestamp?: SortOrder
    fromAgentId?: SortOrder
    toAgentId?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    conversationId?: SortOrder
    requestId?: SortOrder
    ttl?: SortOrder
    payload?: SortOrder
    routing?: SortOrder
    signature?: SortOrder
    checksum?: SortOrder
    metadata?: SortOrder
    deliveredAt?: SortOrder
    acknowledgedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type A2AMessageAvgOrderByAggregateInput = {
    ttl?: SortOrder
  }

  export type A2AMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    messageId?: SortOrder
    protocolVersion?: SortOrder
    timestamp?: SortOrder
    fromAgentId?: SortOrder
    toAgentId?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    conversationId?: SortOrder
    requestId?: SortOrder
    ttl?: SortOrder
    signature?: SortOrder
    checksum?: SortOrder
    deliveredAt?: SortOrder
    acknowledgedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type A2AMessageMinOrderByAggregateInput = {
    id?: SortOrder
    messageId?: SortOrder
    protocolVersion?: SortOrder
    timestamp?: SortOrder
    fromAgentId?: SortOrder
    toAgentId?: SortOrder
    type?: SortOrder
    priority?: SortOrder
    conversationId?: SortOrder
    requestId?: SortOrder
    ttl?: SortOrder
    signature?: SortOrder
    checksum?: SortOrder
    deliveredAt?: SortOrder
    acknowledgedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type A2AMessageSumOrderByAggregateInput = {
    ttl?: SortOrder
  }

  export type EnumA2AMessageTypeWithAggregatesFilter = {
    equals?: A2AMessageType
    in?: Enumerable<A2AMessageType>
    notIn?: Enumerable<A2AMessageType>
    not?: NestedEnumA2AMessageTypeWithAggregatesFilter | A2AMessageType
    _count?: NestedIntFilter
    _min?: NestedEnumA2AMessageTypeFilter
    _max?: NestedEnumA2AMessageTypeFilter
  }

  export type EnumA2AMessagePriorityWithAggregatesFilter = {
    equals?: A2AMessagePriority
    in?: Enumerable<A2AMessagePriority>
    notIn?: Enumerable<A2AMessagePriority>
    not?: NestedEnumA2AMessagePriorityWithAggregatesFilter | A2AMessagePriority
    _count?: NestedIntFilter
    _min?: NestedEnumA2AMessagePriorityFilter
    _max?: NestedEnumA2AMessagePriorityFilter
  }

  export type IntNullableWithAggregatesFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntNullableWithAggregatesFilter | number | null
    _count?: NestedIntNullableFilter
    _avg?: NestedFloatNullableFilter
    _sum?: NestedIntNullableFilter
    _min?: NestedIntNullableFilter
    _max?: NestedIntNullableFilter
  }
  export type JsonWithAggregatesFilter = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase>, Exclude<keyof Required<JsonWithAggregatesFilterBase>, 'path'>>,
        Required<JsonWithAggregatesFilterBase>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase>, 'path'>>

  export type JsonWithAggregatesFilterBase = {
    equals?: InputJsonValue | JsonNullValueFilter
    path?: string[]
    string_contains?: string
    string_starts_with?: string
    string_ends_with?: string
    array_contains?: InputJsonValue | null
    array_starts_with?: InputJsonValue | null
    array_ends_with?: InputJsonValue | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonNullValueFilter
    _count?: NestedIntFilter
    _min?: NestedJsonFilter
    _max?: NestedJsonFilter
  }

  export type EnumA2AConversationStatusFilter = {
    equals?: A2AConversationStatus
    in?: Enumerable<A2AConversationStatus>
    notIn?: Enumerable<A2AConversationStatus>
    not?: NestedEnumA2AConversationStatusFilter | A2AConversationStatus
  }

  export type A2AConversationCountOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    initiatorId?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type A2AConversationMaxOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    initiatorId?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type A2AConversationMinOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    initiatorId?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumA2AConversationStatusWithAggregatesFilter = {
    equals?: A2AConversationStatus
    in?: Enumerable<A2AConversationStatus>
    notIn?: Enumerable<A2AConversationStatus>
    not?: NestedEnumA2AConversationStatusWithAggregatesFilter | A2AConversationStatus
    _count?: NestedIntFilter
    _min?: NestedEnumA2AConversationStatusFilter
    _max?: NestedEnumA2AConversationStatusFilter
  }

  export type A2AConversationParticipantConversationIdAgentIdCompoundUniqueInput = {
    conversationId: string
    agentId: string
  }

  export type A2AConversationParticipantCountOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    agentId?: SortOrder
    joinedAt?: SortOrder
    leftAt?: SortOrder
    role?: SortOrder
  }

  export type A2AConversationParticipantMaxOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    agentId?: SortOrder
    joinedAt?: SortOrder
    leftAt?: SortOrder
    role?: SortOrder
  }

  export type A2AConversationParticipantMinOrderByAggregateInput = {
    id?: SortOrder
    conversationId?: SortOrder
    agentId?: SortOrder
    joinedAt?: SortOrder
    leftAt?: SortOrder
    role?: SortOrder
  }

  export type FloatNullableFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatNullableFilter | number | null
  }

  export type A2AHeartbeatCountOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    timestamp?: SortOrder
    status?: SortOrder
    load?: SortOrder
    activeConnections?: SortOrder
    lastActivity?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type A2AHeartbeatAvgOrderByAggregateInput = {
    load?: SortOrder
    activeConnections?: SortOrder
  }

  export type A2AHeartbeatMaxOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    timestamp?: SortOrder
    status?: SortOrder
    load?: SortOrder
    activeConnections?: SortOrder
    lastActivity?: SortOrder
    createdAt?: SortOrder
  }

  export type A2AHeartbeatMinOrderByAggregateInput = {
    id?: SortOrder
    agentId?: SortOrder
    timestamp?: SortOrder
    status?: SortOrder
    load?: SortOrder
    activeConnections?: SortOrder
    lastActivity?: SortOrder
    createdAt?: SortOrder
  }

  export type A2AHeartbeatSumOrderByAggregateInput = {
    load?: SortOrder
    activeConnections?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatNullableWithAggregatesFilter | number | null
    _count?: NestedIntNullableFilter
    _avg?: NestedFloatNullableFilter
    _sum?: NestedFloatNullableFilter
    _min?: NestedFloatNullableFilter
    _max?: NestedFloatNullableFilter
  }

  export type TaskCreatetagsInput = {
    set: Enumerable<string>
  }

  export type TaskCreatedependenciesInput = {
    set: Enumerable<string>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumTaskStatusFieldUpdateOperationsInput = {
    set?: TaskStatus
  }

  export type EnumTaskPriorityFieldUpdateOperationsInput = {
    set?: TaskPriority
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type TaskUpdatetagsInput = {
    set?: Enumerable<string>
    push?: string | Enumerable<string>
  }

  export type TaskUpdatedependenciesInput = {
    set?: Enumerable<string>
    push?: string | Enumerable<string>
  }

  export type AgentCreatecapabilitiesInput = {
    set: Enumerable<string>
  }

  export type UserCreateNestedOneWithoutAgentsInput = {
    create?: XOR<UserCreateWithoutAgentsInput, UserUncheckedCreateWithoutAgentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAgentsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumAgentTypeFieldUpdateOperationsInput = {
    set?: AgentType
  }

  export type EnumAgentStatusFieldUpdateOperationsInput = {
    set?: AgentStatus
  }

  export type AgentUpdatecapabilitiesInput = {
    set?: Enumerable<string>
    push?: string | Enumerable<string>
  }

  export type UserUpdateOneWithoutAgentsNestedInput = {
    create?: XOR<UserCreateWithoutAgentsInput, UserUncheckedCreateWithoutAgentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAgentsInput
    upsert?: UserUpsertWithoutAgentsInput
    disconnect?: boolean
    delete?: boolean
    connect?: UserWhereUniqueInput
    update?: XOR<UserUpdateWithoutAgentsInput, UserUncheckedUpdateWithoutAgentsInput>
  }

  export type EnumEntityStatusFieldUpdateOperationsInput = {
    set?: EntityStatus
  }

  export type AgentCreateNestedManyWithoutUserInput = {
    create?: XOR<Enumerable<AgentCreateWithoutUserInput>, Enumerable<AgentUncheckedCreateWithoutUserInput>>
    connectOrCreate?: Enumerable<AgentCreateOrConnectWithoutUserInput>
    createMany?: AgentCreateManyUserInputEnvelope
    connect?: Enumerable<AgentWhereUniqueInput>
  }

  export type ChatMessageCreateNestedManyWithoutUserInput = {
    create?: XOR<Enumerable<ChatMessageCreateWithoutUserInput>, Enumerable<ChatMessageUncheckedCreateWithoutUserInput>>
    connectOrCreate?: Enumerable<ChatMessageCreateOrConnectWithoutUserInput>
    createMany?: ChatMessageCreateManyUserInputEnvelope
    connect?: Enumerable<ChatMessageWhereUniqueInput>
  }

  export type AgentUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<Enumerable<AgentCreateWithoutUserInput>, Enumerable<AgentUncheckedCreateWithoutUserInput>>
    connectOrCreate?: Enumerable<AgentCreateOrConnectWithoutUserInput>
    createMany?: AgentCreateManyUserInputEnvelope
    connect?: Enumerable<AgentWhereUniqueInput>
  }

  export type ChatMessageUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<Enumerable<ChatMessageCreateWithoutUserInput>, Enumerable<ChatMessageUncheckedCreateWithoutUserInput>>
    connectOrCreate?: Enumerable<ChatMessageCreateOrConnectWithoutUserInput>
    createMany?: ChatMessageCreateManyUserInputEnvelope
    connect?: Enumerable<ChatMessageWhereUniqueInput>
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: UserRole
  }

  export type AgentUpdateManyWithoutUserNestedInput = {
    create?: XOR<Enumerable<AgentCreateWithoutUserInput>, Enumerable<AgentUncheckedCreateWithoutUserInput>>
    connectOrCreate?: Enumerable<AgentCreateOrConnectWithoutUserInput>
    upsert?: Enumerable<AgentUpsertWithWhereUniqueWithoutUserInput>
    createMany?: AgentCreateManyUserInputEnvelope
    set?: Enumerable<AgentWhereUniqueInput>
    disconnect?: Enumerable<AgentWhereUniqueInput>
    delete?: Enumerable<AgentWhereUniqueInput>
    connect?: Enumerable<AgentWhereUniqueInput>
    update?: Enumerable<AgentUpdateWithWhereUniqueWithoutUserInput>
    updateMany?: Enumerable<AgentUpdateManyWithWhereWithoutUserInput>
    deleteMany?: Enumerable<AgentScalarWhereInput>
  }

  export type ChatMessageUpdateManyWithoutUserNestedInput = {
    create?: XOR<Enumerable<ChatMessageCreateWithoutUserInput>, Enumerable<ChatMessageUncheckedCreateWithoutUserInput>>
    connectOrCreate?: Enumerable<ChatMessageCreateOrConnectWithoutUserInput>
    upsert?: Enumerable<ChatMessageUpsertWithWhereUniqueWithoutUserInput>
    createMany?: ChatMessageCreateManyUserInputEnvelope
    set?: Enumerable<ChatMessageWhereUniqueInput>
    disconnect?: Enumerable<ChatMessageWhereUniqueInput>
    delete?: Enumerable<ChatMessageWhereUniqueInput>
    connect?: Enumerable<ChatMessageWhereUniqueInput>
    update?: Enumerable<ChatMessageUpdateWithWhereUniqueWithoutUserInput>
    updateMany?: Enumerable<ChatMessageUpdateManyWithWhereWithoutUserInput>
    deleteMany?: Enumerable<ChatMessageScalarWhereInput>
  }

  export type AgentUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<Enumerable<AgentCreateWithoutUserInput>, Enumerable<AgentUncheckedCreateWithoutUserInput>>
    connectOrCreate?: Enumerable<AgentCreateOrConnectWithoutUserInput>
    upsert?: Enumerable<AgentUpsertWithWhereUniqueWithoutUserInput>
    createMany?: AgentCreateManyUserInputEnvelope
    set?: Enumerable<AgentWhereUniqueInput>
    disconnect?: Enumerable<AgentWhereUniqueInput>
    delete?: Enumerable<AgentWhereUniqueInput>
    connect?: Enumerable<AgentWhereUniqueInput>
    update?: Enumerable<AgentUpdateWithWhereUniqueWithoutUserInput>
    updateMany?: Enumerable<AgentUpdateManyWithWhereWithoutUserInput>
    deleteMany?: Enumerable<AgentScalarWhereInput>
  }

  export type ChatMessageUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<Enumerable<ChatMessageCreateWithoutUserInput>, Enumerable<ChatMessageUncheckedCreateWithoutUserInput>>
    connectOrCreate?: Enumerable<ChatMessageCreateOrConnectWithoutUserInput>
    upsert?: Enumerable<ChatMessageUpsertWithWhereUniqueWithoutUserInput>
    createMany?: ChatMessageCreateManyUserInputEnvelope
    set?: Enumerable<ChatMessageWhereUniqueInput>
    disconnect?: Enumerable<ChatMessageWhereUniqueInput>
    delete?: Enumerable<ChatMessageWhereUniqueInput>
    connect?: Enumerable<ChatMessageWhereUniqueInput>
    update?: Enumerable<ChatMessageUpdateWithWhereUniqueWithoutUserInput>
    updateMany?: Enumerable<ChatMessageUpdateManyWithWhereWithoutUserInput>
    deleteMany?: Enumerable<ChatMessageScalarWhereInput>
  }

  export type UserCreateNestedOneWithoutChatMessagesInput = {
    create?: XOR<UserCreateWithoutChatMessagesInput, UserUncheckedCreateWithoutChatMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutChatMessagesInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutChatMessagesNestedInput = {
    create?: XOR<UserCreateWithoutChatMessagesInput, UserUncheckedCreateWithoutChatMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutChatMessagesInput
    upsert?: UserUpsertWithoutChatMessagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<UserUpdateWithoutChatMessagesInput, UserUncheckedUpdateWithoutChatMessagesInput>
  }

  export type A2AAgentCapabilityCreateNestedManyWithoutAgentInput = {
    create?: XOR<Enumerable<A2AAgentCapabilityCreateWithoutAgentInput>, Enumerable<A2AAgentCapabilityUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AAgentCapabilityCreateOrConnectWithoutAgentInput>
    createMany?: A2AAgentCapabilityCreateManyAgentInputEnvelope
    connect?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
  }

  export type A2AMessageCreateNestedManyWithoutFromAgentInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutFromAgentInput>, Enumerable<A2AMessageUncheckedCreateWithoutFromAgentInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutFromAgentInput>
    createMany?: A2AMessageCreateManyFromAgentInputEnvelope
    connect?: Enumerable<A2AMessageWhereUniqueInput>
  }

  export type A2AMessageCreateNestedManyWithoutToAgentInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutToAgentInput>, Enumerable<A2AMessageUncheckedCreateWithoutToAgentInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutToAgentInput>
    createMany?: A2AMessageCreateManyToAgentInputEnvelope
    connect?: Enumerable<A2AMessageWhereUniqueInput>
  }

  export type A2AConversationParticipantCreateNestedManyWithoutAgentInput = {
    create?: XOR<Enumerable<A2AConversationParticipantCreateWithoutAgentInput>, Enumerable<A2AConversationParticipantUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AConversationParticipantCreateOrConnectWithoutAgentInput>
    createMany?: A2AConversationParticipantCreateManyAgentInputEnvelope
    connect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
  }

  export type A2AHeartbeatCreateNestedManyWithoutAgentInput = {
    create?: XOR<Enumerable<A2AHeartbeatCreateWithoutAgentInput>, Enumerable<A2AHeartbeatUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AHeartbeatCreateOrConnectWithoutAgentInput>
    createMany?: A2AHeartbeatCreateManyAgentInputEnvelope
    connect?: Enumerable<A2AHeartbeatWhereUniqueInput>
  }

  export type A2AAgentCapabilityUncheckedCreateNestedManyWithoutAgentInput = {
    create?: XOR<Enumerable<A2AAgentCapabilityCreateWithoutAgentInput>, Enumerable<A2AAgentCapabilityUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AAgentCapabilityCreateOrConnectWithoutAgentInput>
    createMany?: A2AAgentCapabilityCreateManyAgentInputEnvelope
    connect?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
  }

  export type A2AMessageUncheckedCreateNestedManyWithoutFromAgentInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutFromAgentInput>, Enumerable<A2AMessageUncheckedCreateWithoutFromAgentInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutFromAgentInput>
    createMany?: A2AMessageCreateManyFromAgentInputEnvelope
    connect?: Enumerable<A2AMessageWhereUniqueInput>
  }

  export type A2AMessageUncheckedCreateNestedManyWithoutToAgentInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutToAgentInput>, Enumerable<A2AMessageUncheckedCreateWithoutToAgentInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutToAgentInput>
    createMany?: A2AMessageCreateManyToAgentInputEnvelope
    connect?: Enumerable<A2AMessageWhereUniqueInput>
  }

  export type A2AConversationParticipantUncheckedCreateNestedManyWithoutAgentInput = {
    create?: XOR<Enumerable<A2AConversationParticipantCreateWithoutAgentInput>, Enumerable<A2AConversationParticipantUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AConversationParticipantCreateOrConnectWithoutAgentInput>
    createMany?: A2AConversationParticipantCreateManyAgentInputEnvelope
    connect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
  }

  export type A2AHeartbeatUncheckedCreateNestedManyWithoutAgentInput = {
    create?: XOR<Enumerable<A2AHeartbeatCreateWithoutAgentInput>, Enumerable<A2AHeartbeatUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AHeartbeatCreateOrConnectWithoutAgentInput>
    createMany?: A2AHeartbeatCreateManyAgentInputEnvelope
    connect?: Enumerable<A2AHeartbeatWhereUniqueInput>
  }

  export type EnumA2AAgentStatusFieldUpdateOperationsInput = {
    set?: A2AAgentStatus
  }

  export type A2AAgentCapabilityUpdateManyWithoutAgentNestedInput = {
    create?: XOR<Enumerable<A2AAgentCapabilityCreateWithoutAgentInput>, Enumerable<A2AAgentCapabilityUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AAgentCapabilityCreateOrConnectWithoutAgentInput>
    upsert?: Enumerable<A2AAgentCapabilityUpsertWithWhereUniqueWithoutAgentInput>
    createMany?: A2AAgentCapabilityCreateManyAgentInputEnvelope
    set?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
    disconnect?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
    delete?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
    connect?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
    update?: Enumerable<A2AAgentCapabilityUpdateWithWhereUniqueWithoutAgentInput>
    updateMany?: Enumerable<A2AAgentCapabilityUpdateManyWithWhereWithoutAgentInput>
    deleteMany?: Enumerable<A2AAgentCapabilityScalarWhereInput>
  }

  export type A2AMessageUpdateManyWithoutFromAgentNestedInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutFromAgentInput>, Enumerable<A2AMessageUncheckedCreateWithoutFromAgentInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutFromAgentInput>
    upsert?: Enumerable<A2AMessageUpsertWithWhereUniqueWithoutFromAgentInput>
    createMany?: A2AMessageCreateManyFromAgentInputEnvelope
    set?: Enumerable<A2AMessageWhereUniqueInput>
    disconnect?: Enumerable<A2AMessageWhereUniqueInput>
    delete?: Enumerable<A2AMessageWhereUniqueInput>
    connect?: Enumerable<A2AMessageWhereUniqueInput>
    update?: Enumerable<A2AMessageUpdateWithWhereUniqueWithoutFromAgentInput>
    updateMany?: Enumerable<A2AMessageUpdateManyWithWhereWithoutFromAgentInput>
    deleteMany?: Enumerable<A2AMessageScalarWhereInput>
  }

  export type A2AMessageUpdateManyWithoutToAgentNestedInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutToAgentInput>, Enumerable<A2AMessageUncheckedCreateWithoutToAgentInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutToAgentInput>
    upsert?: Enumerable<A2AMessageUpsertWithWhereUniqueWithoutToAgentInput>
    createMany?: A2AMessageCreateManyToAgentInputEnvelope
    set?: Enumerable<A2AMessageWhereUniqueInput>
    disconnect?: Enumerable<A2AMessageWhereUniqueInput>
    delete?: Enumerable<A2AMessageWhereUniqueInput>
    connect?: Enumerable<A2AMessageWhereUniqueInput>
    update?: Enumerable<A2AMessageUpdateWithWhereUniqueWithoutToAgentInput>
    updateMany?: Enumerable<A2AMessageUpdateManyWithWhereWithoutToAgentInput>
    deleteMany?: Enumerable<A2AMessageScalarWhereInput>
  }

  export type A2AConversationParticipantUpdateManyWithoutAgentNestedInput = {
    create?: XOR<Enumerable<A2AConversationParticipantCreateWithoutAgentInput>, Enumerable<A2AConversationParticipantUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AConversationParticipantCreateOrConnectWithoutAgentInput>
    upsert?: Enumerable<A2AConversationParticipantUpsertWithWhereUniqueWithoutAgentInput>
    createMany?: A2AConversationParticipantCreateManyAgentInputEnvelope
    set?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    disconnect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    delete?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    connect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    update?: Enumerable<A2AConversationParticipantUpdateWithWhereUniqueWithoutAgentInput>
    updateMany?: Enumerable<A2AConversationParticipantUpdateManyWithWhereWithoutAgentInput>
    deleteMany?: Enumerable<A2AConversationParticipantScalarWhereInput>
  }

  export type A2AHeartbeatUpdateManyWithoutAgentNestedInput = {
    create?: XOR<Enumerable<A2AHeartbeatCreateWithoutAgentInput>, Enumerable<A2AHeartbeatUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AHeartbeatCreateOrConnectWithoutAgentInput>
    upsert?: Enumerable<A2AHeartbeatUpsertWithWhereUniqueWithoutAgentInput>
    createMany?: A2AHeartbeatCreateManyAgentInputEnvelope
    set?: Enumerable<A2AHeartbeatWhereUniqueInput>
    disconnect?: Enumerable<A2AHeartbeatWhereUniqueInput>
    delete?: Enumerable<A2AHeartbeatWhereUniqueInput>
    connect?: Enumerable<A2AHeartbeatWhereUniqueInput>
    update?: Enumerable<A2AHeartbeatUpdateWithWhereUniqueWithoutAgentInput>
    updateMany?: Enumerable<A2AHeartbeatUpdateManyWithWhereWithoutAgentInput>
    deleteMany?: Enumerable<A2AHeartbeatScalarWhereInput>
  }

  export type A2AAgentCapabilityUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: XOR<Enumerable<A2AAgentCapabilityCreateWithoutAgentInput>, Enumerable<A2AAgentCapabilityUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AAgentCapabilityCreateOrConnectWithoutAgentInput>
    upsert?: Enumerable<A2AAgentCapabilityUpsertWithWhereUniqueWithoutAgentInput>
    createMany?: A2AAgentCapabilityCreateManyAgentInputEnvelope
    set?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
    disconnect?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
    delete?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
    connect?: Enumerable<A2AAgentCapabilityWhereUniqueInput>
    update?: Enumerable<A2AAgentCapabilityUpdateWithWhereUniqueWithoutAgentInput>
    updateMany?: Enumerable<A2AAgentCapabilityUpdateManyWithWhereWithoutAgentInput>
    deleteMany?: Enumerable<A2AAgentCapabilityScalarWhereInput>
  }

  export type A2AMessageUncheckedUpdateManyWithoutFromAgentNestedInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutFromAgentInput>, Enumerable<A2AMessageUncheckedCreateWithoutFromAgentInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutFromAgentInput>
    upsert?: Enumerable<A2AMessageUpsertWithWhereUniqueWithoutFromAgentInput>
    createMany?: A2AMessageCreateManyFromAgentInputEnvelope
    set?: Enumerable<A2AMessageWhereUniqueInput>
    disconnect?: Enumerable<A2AMessageWhereUniqueInput>
    delete?: Enumerable<A2AMessageWhereUniqueInput>
    connect?: Enumerable<A2AMessageWhereUniqueInput>
    update?: Enumerable<A2AMessageUpdateWithWhereUniqueWithoutFromAgentInput>
    updateMany?: Enumerable<A2AMessageUpdateManyWithWhereWithoutFromAgentInput>
    deleteMany?: Enumerable<A2AMessageScalarWhereInput>
  }

  export type A2AMessageUncheckedUpdateManyWithoutToAgentNestedInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutToAgentInput>, Enumerable<A2AMessageUncheckedCreateWithoutToAgentInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutToAgentInput>
    upsert?: Enumerable<A2AMessageUpsertWithWhereUniqueWithoutToAgentInput>
    createMany?: A2AMessageCreateManyToAgentInputEnvelope
    set?: Enumerable<A2AMessageWhereUniqueInput>
    disconnect?: Enumerable<A2AMessageWhereUniqueInput>
    delete?: Enumerable<A2AMessageWhereUniqueInput>
    connect?: Enumerable<A2AMessageWhereUniqueInput>
    update?: Enumerable<A2AMessageUpdateWithWhereUniqueWithoutToAgentInput>
    updateMany?: Enumerable<A2AMessageUpdateManyWithWhereWithoutToAgentInput>
    deleteMany?: Enumerable<A2AMessageScalarWhereInput>
  }

  export type A2AConversationParticipantUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: XOR<Enumerable<A2AConversationParticipantCreateWithoutAgentInput>, Enumerable<A2AConversationParticipantUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AConversationParticipantCreateOrConnectWithoutAgentInput>
    upsert?: Enumerable<A2AConversationParticipantUpsertWithWhereUniqueWithoutAgentInput>
    createMany?: A2AConversationParticipantCreateManyAgentInputEnvelope
    set?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    disconnect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    delete?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    connect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    update?: Enumerable<A2AConversationParticipantUpdateWithWhereUniqueWithoutAgentInput>
    updateMany?: Enumerable<A2AConversationParticipantUpdateManyWithWhereWithoutAgentInput>
    deleteMany?: Enumerable<A2AConversationParticipantScalarWhereInput>
  }

  export type A2AHeartbeatUncheckedUpdateManyWithoutAgentNestedInput = {
    create?: XOR<Enumerable<A2AHeartbeatCreateWithoutAgentInput>, Enumerable<A2AHeartbeatUncheckedCreateWithoutAgentInput>>
    connectOrCreate?: Enumerable<A2AHeartbeatCreateOrConnectWithoutAgentInput>
    upsert?: Enumerable<A2AHeartbeatUpsertWithWhereUniqueWithoutAgentInput>
    createMany?: A2AHeartbeatCreateManyAgentInputEnvelope
    set?: Enumerable<A2AHeartbeatWhereUniqueInput>
    disconnect?: Enumerable<A2AHeartbeatWhereUniqueInput>
    delete?: Enumerable<A2AHeartbeatWhereUniqueInput>
    connect?: Enumerable<A2AHeartbeatWhereUniqueInput>
    update?: Enumerable<A2AHeartbeatUpdateWithWhereUniqueWithoutAgentInput>
    updateMany?: Enumerable<A2AHeartbeatUpdateManyWithWhereWithoutAgentInput>
    deleteMany?: Enumerable<A2AHeartbeatScalarWhereInput>
  }

  export type A2AAgentCreateNestedOneWithoutCapabilitiesInput = {
    create?: XOR<A2AAgentCreateWithoutCapabilitiesInput, A2AAgentUncheckedCreateWithoutCapabilitiesInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutCapabilitiesInput
    connect?: A2AAgentWhereUniqueInput
  }

  export type A2AAgentUpdateOneRequiredWithoutCapabilitiesNestedInput = {
    create?: XOR<A2AAgentCreateWithoutCapabilitiesInput, A2AAgentUncheckedCreateWithoutCapabilitiesInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutCapabilitiesInput
    upsert?: A2AAgentUpsertWithoutCapabilitiesInput
    connect?: A2AAgentWhereUniqueInput
    update?: XOR<A2AAgentUpdateWithoutCapabilitiesInput, A2AAgentUncheckedUpdateWithoutCapabilitiesInput>
  }

  export type A2AAgentCreateNestedOneWithoutSentMessagesInput = {
    create?: XOR<A2AAgentCreateWithoutSentMessagesInput, A2AAgentUncheckedCreateWithoutSentMessagesInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutSentMessagesInput
    connect?: A2AAgentWhereUniqueInput
  }

  export type A2AAgentCreateNestedOneWithoutReceivedMessagesInput = {
    create?: XOR<A2AAgentCreateWithoutReceivedMessagesInput, A2AAgentUncheckedCreateWithoutReceivedMessagesInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutReceivedMessagesInput
    connect?: A2AAgentWhereUniqueInput
  }

  export type A2AConversationCreateNestedOneWithoutMessagesInput = {
    create?: XOR<A2AConversationCreateWithoutMessagesInput, A2AConversationUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: A2AConversationCreateOrConnectWithoutMessagesInput
    connect?: A2AConversationWhereUniqueInput
  }

  export type EnumA2AMessageTypeFieldUpdateOperationsInput = {
    set?: A2AMessageType
  }

  export type EnumA2AMessagePriorityFieldUpdateOperationsInput = {
    set?: A2AMessagePriority
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type A2AAgentUpdateOneRequiredWithoutSentMessagesNestedInput = {
    create?: XOR<A2AAgentCreateWithoutSentMessagesInput, A2AAgentUncheckedCreateWithoutSentMessagesInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutSentMessagesInput
    upsert?: A2AAgentUpsertWithoutSentMessagesInput
    connect?: A2AAgentWhereUniqueInput
    update?: XOR<A2AAgentUpdateWithoutSentMessagesInput, A2AAgentUncheckedUpdateWithoutSentMessagesInput>
  }

  export type A2AAgentUpdateOneWithoutReceivedMessagesNestedInput = {
    create?: XOR<A2AAgentCreateWithoutReceivedMessagesInput, A2AAgentUncheckedCreateWithoutReceivedMessagesInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutReceivedMessagesInput
    upsert?: A2AAgentUpsertWithoutReceivedMessagesInput
    disconnect?: boolean
    delete?: boolean
    connect?: A2AAgentWhereUniqueInput
    update?: XOR<A2AAgentUpdateWithoutReceivedMessagesInput, A2AAgentUncheckedUpdateWithoutReceivedMessagesInput>
  }

  export type A2AConversationUpdateOneWithoutMessagesNestedInput = {
    create?: XOR<A2AConversationCreateWithoutMessagesInput, A2AConversationUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: A2AConversationCreateOrConnectWithoutMessagesInput
    upsert?: A2AConversationUpsertWithoutMessagesInput
    disconnect?: boolean
    delete?: boolean
    connect?: A2AConversationWhereUniqueInput
    update?: XOR<A2AConversationUpdateWithoutMessagesInput, A2AConversationUncheckedUpdateWithoutMessagesInput>
  }

  export type A2AConversationParticipantCreateNestedManyWithoutConversationInput = {
    create?: XOR<Enumerable<A2AConversationParticipantCreateWithoutConversationInput>, Enumerable<A2AConversationParticipantUncheckedCreateWithoutConversationInput>>
    connectOrCreate?: Enumerable<A2AConversationParticipantCreateOrConnectWithoutConversationInput>
    createMany?: A2AConversationParticipantCreateManyConversationInputEnvelope
    connect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
  }

  export type A2AMessageCreateNestedManyWithoutConversationInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutConversationInput>, Enumerable<A2AMessageUncheckedCreateWithoutConversationInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutConversationInput>
    createMany?: A2AMessageCreateManyConversationInputEnvelope
    connect?: Enumerable<A2AMessageWhereUniqueInput>
  }

  export type A2AConversationParticipantUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<Enumerable<A2AConversationParticipantCreateWithoutConversationInput>, Enumerable<A2AConversationParticipantUncheckedCreateWithoutConversationInput>>
    connectOrCreate?: Enumerable<A2AConversationParticipantCreateOrConnectWithoutConversationInput>
    createMany?: A2AConversationParticipantCreateManyConversationInputEnvelope
    connect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
  }

  export type A2AMessageUncheckedCreateNestedManyWithoutConversationInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutConversationInput>, Enumerable<A2AMessageUncheckedCreateWithoutConversationInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutConversationInput>
    createMany?: A2AMessageCreateManyConversationInputEnvelope
    connect?: Enumerable<A2AMessageWhereUniqueInput>
  }

  export type EnumA2AConversationStatusFieldUpdateOperationsInput = {
    set?: A2AConversationStatus
  }

  export type A2AConversationParticipantUpdateManyWithoutConversationNestedInput = {
    create?: XOR<Enumerable<A2AConversationParticipantCreateWithoutConversationInput>, Enumerable<A2AConversationParticipantUncheckedCreateWithoutConversationInput>>
    connectOrCreate?: Enumerable<A2AConversationParticipantCreateOrConnectWithoutConversationInput>
    upsert?: Enumerable<A2AConversationParticipantUpsertWithWhereUniqueWithoutConversationInput>
    createMany?: A2AConversationParticipantCreateManyConversationInputEnvelope
    set?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    disconnect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    delete?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    connect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    update?: Enumerable<A2AConversationParticipantUpdateWithWhereUniqueWithoutConversationInput>
    updateMany?: Enumerable<A2AConversationParticipantUpdateManyWithWhereWithoutConversationInput>
    deleteMany?: Enumerable<A2AConversationParticipantScalarWhereInput>
  }

  export type A2AMessageUpdateManyWithoutConversationNestedInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutConversationInput>, Enumerable<A2AMessageUncheckedCreateWithoutConversationInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutConversationInput>
    upsert?: Enumerable<A2AMessageUpsertWithWhereUniqueWithoutConversationInput>
    createMany?: A2AMessageCreateManyConversationInputEnvelope
    set?: Enumerable<A2AMessageWhereUniqueInput>
    disconnect?: Enumerable<A2AMessageWhereUniqueInput>
    delete?: Enumerable<A2AMessageWhereUniqueInput>
    connect?: Enumerable<A2AMessageWhereUniqueInput>
    update?: Enumerable<A2AMessageUpdateWithWhereUniqueWithoutConversationInput>
    updateMany?: Enumerable<A2AMessageUpdateManyWithWhereWithoutConversationInput>
    deleteMany?: Enumerable<A2AMessageScalarWhereInput>
  }

  export type A2AConversationParticipantUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<Enumerable<A2AConversationParticipantCreateWithoutConversationInput>, Enumerable<A2AConversationParticipantUncheckedCreateWithoutConversationInput>>
    connectOrCreate?: Enumerable<A2AConversationParticipantCreateOrConnectWithoutConversationInput>
    upsert?: Enumerable<A2AConversationParticipantUpsertWithWhereUniqueWithoutConversationInput>
    createMany?: A2AConversationParticipantCreateManyConversationInputEnvelope
    set?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    disconnect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    delete?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    connect?: Enumerable<A2AConversationParticipantWhereUniqueInput>
    update?: Enumerable<A2AConversationParticipantUpdateWithWhereUniqueWithoutConversationInput>
    updateMany?: Enumerable<A2AConversationParticipantUpdateManyWithWhereWithoutConversationInput>
    deleteMany?: Enumerable<A2AConversationParticipantScalarWhereInput>
  }

  export type A2AMessageUncheckedUpdateManyWithoutConversationNestedInput = {
    create?: XOR<Enumerable<A2AMessageCreateWithoutConversationInput>, Enumerable<A2AMessageUncheckedCreateWithoutConversationInput>>
    connectOrCreate?: Enumerable<A2AMessageCreateOrConnectWithoutConversationInput>
    upsert?: Enumerable<A2AMessageUpsertWithWhereUniqueWithoutConversationInput>
    createMany?: A2AMessageCreateManyConversationInputEnvelope
    set?: Enumerable<A2AMessageWhereUniqueInput>
    disconnect?: Enumerable<A2AMessageWhereUniqueInput>
    delete?: Enumerable<A2AMessageWhereUniqueInput>
    connect?: Enumerable<A2AMessageWhereUniqueInput>
    update?: Enumerable<A2AMessageUpdateWithWhereUniqueWithoutConversationInput>
    updateMany?: Enumerable<A2AMessageUpdateManyWithWhereWithoutConversationInput>
    deleteMany?: Enumerable<A2AMessageScalarWhereInput>
  }

  export type A2AConversationCreateNestedOneWithoutParticipantsInput = {
    create?: XOR<A2AConversationCreateWithoutParticipantsInput, A2AConversationUncheckedCreateWithoutParticipantsInput>
    connectOrCreate?: A2AConversationCreateOrConnectWithoutParticipantsInput
    connect?: A2AConversationWhereUniqueInput
  }

  export type A2AAgentCreateNestedOneWithoutConversationsInput = {
    create?: XOR<A2AAgentCreateWithoutConversationsInput, A2AAgentUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutConversationsInput
    connect?: A2AAgentWhereUniqueInput
  }

  export type A2AConversationUpdateOneRequiredWithoutParticipantsNestedInput = {
    create?: XOR<A2AConversationCreateWithoutParticipantsInput, A2AConversationUncheckedCreateWithoutParticipantsInput>
    connectOrCreate?: A2AConversationCreateOrConnectWithoutParticipantsInput
    upsert?: A2AConversationUpsertWithoutParticipantsInput
    connect?: A2AConversationWhereUniqueInput
    update?: XOR<A2AConversationUpdateWithoutParticipantsInput, A2AConversationUncheckedUpdateWithoutParticipantsInput>
  }

  export type A2AAgentUpdateOneRequiredWithoutConversationsNestedInput = {
    create?: XOR<A2AAgentCreateWithoutConversationsInput, A2AAgentUncheckedCreateWithoutConversationsInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutConversationsInput
    upsert?: A2AAgentUpsertWithoutConversationsInput
    connect?: A2AAgentWhereUniqueInput
    update?: XOR<A2AAgentUpdateWithoutConversationsInput, A2AAgentUncheckedUpdateWithoutConversationsInput>
  }

  export type A2AAgentCreateNestedOneWithoutHeartbeatsInput = {
    create?: XOR<A2AAgentCreateWithoutHeartbeatsInput, A2AAgentUncheckedCreateWithoutHeartbeatsInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutHeartbeatsInput
    connect?: A2AAgentWhereUniqueInput
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type A2AAgentUpdateOneRequiredWithoutHeartbeatsNestedInput = {
    create?: XOR<A2AAgentCreateWithoutHeartbeatsInput, A2AAgentUncheckedCreateWithoutHeartbeatsInput>
    connectOrCreate?: A2AAgentCreateOrConnectWithoutHeartbeatsInput
    upsert?: A2AAgentUpsertWithoutHeartbeatsInput
    connect?: A2AAgentWhereUniqueInput
    update?: XOR<A2AAgentUpdateWithoutHeartbeatsInput, A2AAgentUncheckedUpdateWithoutHeartbeatsInput>
  }

  export type NestedStringFilter = {
    equals?: string
    in?: Enumerable<string> | string
    notIn?: Enumerable<string> | string
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringFilter | string
  }

  export type NestedStringNullableFilter = {
    equals?: string | null
    in?: Enumerable<string> | string | null
    notIn?: Enumerable<string> | string | null
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringNullableFilter | string | null
  }

  export type NestedEnumTaskStatusFilter = {
    equals?: TaskStatus
    in?: Enumerable<TaskStatus>
    notIn?: Enumerable<TaskStatus>
    not?: NestedEnumTaskStatusFilter | TaskStatus
  }

  export type NestedEnumTaskPriorityFilter = {
    equals?: TaskPriority
    in?: Enumerable<TaskPriority>
    notIn?: Enumerable<TaskPriority>
    not?: NestedEnumTaskPriorityFilter | TaskPriority
  }

  export type NestedDateTimeFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string> | Date | string
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeFilter | Date | string
  }

  export type NestedDateTimeNullableFilter = {
    equals?: Date | string | null
    in?: Enumerable<Date> | Enumerable<string> | Date | string | null
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string | null
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeNullableFilter | Date | string | null
  }

  export type NestedStringWithAggregatesFilter = {
    equals?: string
    in?: Enumerable<string> | string
    notIn?: Enumerable<string> | string
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringWithAggregatesFilter | string
    _count?: NestedIntFilter
    _min?: NestedStringFilter
    _max?: NestedStringFilter
  }

  export type NestedIntFilter = {
    equals?: number
    in?: Enumerable<number> | number
    notIn?: Enumerable<number> | number
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntFilter | number
  }

  export type NestedStringNullableWithAggregatesFilter = {
    equals?: string | null
    in?: Enumerable<string> | string | null
    notIn?: Enumerable<string> | string | null
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringNullableWithAggregatesFilter | string | null
    _count?: NestedIntNullableFilter
    _min?: NestedStringNullableFilter
    _max?: NestedStringNullableFilter
  }

  export type NestedIntNullableFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntNullableFilter | number | null
  }

  export type NestedEnumTaskStatusWithAggregatesFilter = {
    equals?: TaskStatus
    in?: Enumerable<TaskStatus>
    notIn?: Enumerable<TaskStatus>
    not?: NestedEnumTaskStatusWithAggregatesFilter | TaskStatus
    _count?: NestedIntFilter
    _min?: NestedEnumTaskStatusFilter
    _max?: NestedEnumTaskStatusFilter
  }

  export type NestedEnumTaskPriorityWithAggregatesFilter = {
    equals?: TaskPriority
    in?: Enumerable<TaskPriority>
    notIn?: Enumerable<TaskPriority>
    not?: NestedEnumTaskPriorityWithAggregatesFilter | TaskPriority
    _count?: NestedIntFilter
    _min?: NestedEnumTaskPriorityFilter
    _max?: NestedEnumTaskPriorityFilter
  }

  export type NestedDateTimeWithAggregatesFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string> | Date | string
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeWithAggregatesFilter | Date | string
    _count?: NestedIntFilter
    _min?: NestedDateTimeFilter
    _max?: NestedDateTimeFilter
  }

  export type NestedDateTimeNullableWithAggregatesFilter = {
    equals?: Date | string | null
    in?: Enumerable<Date> | Enumerable<string> | Date | string | null
    notIn?: Enumerable<Date> | Enumerable<string> | Date | string | null
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeNullableWithAggregatesFilter | Date | string | null
    _count?: NestedIntNullableFilter
    _min?: NestedDateTimeNullableFilter
    _max?: NestedDateTimeNullableFilter
  }
  export type NestedJsonNullableFilter = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase>, Exclude<keyof Required<NestedJsonNullableFilterBase>, 'path'>>,
        Required<NestedJsonNullableFilterBase>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase>, 'path'>>

  export type NestedJsonNullableFilterBase = {
    equals?: InputJsonValue | JsonNullValueFilter
    path?: string[]
    string_contains?: string
    string_starts_with?: string
    string_ends_with?: string
    array_contains?: InputJsonValue | null
    array_starts_with?: InputJsonValue | null
    array_ends_with?: InputJsonValue | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonNullValueFilter
  }

  export type NestedEnumAgentTypeFilter = {
    equals?: AgentType
    in?: Enumerable<AgentType>
    notIn?: Enumerable<AgentType>
    not?: NestedEnumAgentTypeFilter | AgentType
  }

  export type NestedEnumAgentStatusFilter = {
    equals?: AgentStatus
    in?: Enumerable<AgentStatus>
    notIn?: Enumerable<AgentStatus>
    not?: NestedEnumAgentStatusFilter | AgentStatus
  }

  export type NestedEnumAgentTypeWithAggregatesFilter = {
    equals?: AgentType
    in?: Enumerable<AgentType>
    notIn?: Enumerable<AgentType>
    not?: NestedEnumAgentTypeWithAggregatesFilter | AgentType
    _count?: NestedIntFilter
    _min?: NestedEnumAgentTypeFilter
    _max?: NestedEnumAgentTypeFilter
  }

  export type NestedEnumAgentStatusWithAggregatesFilter = {
    equals?: AgentStatus
    in?: Enumerable<AgentStatus>
    notIn?: Enumerable<AgentStatus>
    not?: NestedEnumAgentStatusWithAggregatesFilter | AgentStatus
    _count?: NestedIntFilter
    _min?: NestedEnumAgentStatusFilter
    _max?: NestedEnumAgentStatusFilter
  }

  export type NestedEnumEntityStatusFilter = {
    equals?: EntityStatus
    in?: Enumerable<EntityStatus>
    notIn?: Enumerable<EntityStatus>
    not?: NestedEnumEntityStatusFilter | EntityStatus
  }

  export type NestedEnumEntityStatusWithAggregatesFilter = {
    equals?: EntityStatus
    in?: Enumerable<EntityStatus>
    notIn?: Enumerable<EntityStatus>
    not?: NestedEnumEntityStatusWithAggregatesFilter | EntityStatus
    _count?: NestedIntFilter
    _min?: NestedEnumEntityStatusFilter
    _max?: NestedEnumEntityStatusFilter
  }

  export type NestedEnumUserRoleFilter = {
    equals?: UserRole
    in?: Enumerable<UserRole>
    notIn?: Enumerable<UserRole>
    not?: NestedEnumUserRoleFilter | UserRole
  }

  export type NestedEnumUserRoleWithAggregatesFilter = {
    equals?: UserRole
    in?: Enumerable<UserRole>
    notIn?: Enumerable<UserRole>
    not?: NestedEnumUserRoleWithAggregatesFilter | UserRole
    _count?: NestedIntFilter
    _min?: NestedEnumUserRoleFilter
    _max?: NestedEnumUserRoleFilter
  }

  export type NestedEnumA2AAgentStatusFilter = {
    equals?: A2AAgentStatus
    in?: Enumerable<A2AAgentStatus>
    notIn?: Enumerable<A2AAgentStatus>
    not?: NestedEnumA2AAgentStatusFilter | A2AAgentStatus
  }

  export type NestedEnumA2AAgentStatusWithAggregatesFilter = {
    equals?: A2AAgentStatus
    in?: Enumerable<A2AAgentStatus>
    notIn?: Enumerable<A2AAgentStatus>
    not?: NestedEnumA2AAgentStatusWithAggregatesFilter | A2AAgentStatus
    _count?: NestedIntFilter
    _min?: NestedEnumA2AAgentStatusFilter
    _max?: NestedEnumA2AAgentStatusFilter
  }

  export type NestedEnumA2AMessageTypeFilter = {
    equals?: A2AMessageType
    in?: Enumerable<A2AMessageType>
    notIn?: Enumerable<A2AMessageType>
    not?: NestedEnumA2AMessageTypeFilter | A2AMessageType
  }

  export type NestedEnumA2AMessagePriorityFilter = {
    equals?: A2AMessagePriority
    in?: Enumerable<A2AMessagePriority>
    notIn?: Enumerable<A2AMessagePriority>
    not?: NestedEnumA2AMessagePriorityFilter | A2AMessagePriority
  }

  export type NestedEnumA2AMessageTypeWithAggregatesFilter = {
    equals?: A2AMessageType
    in?: Enumerable<A2AMessageType>
    notIn?: Enumerable<A2AMessageType>
    not?: NestedEnumA2AMessageTypeWithAggregatesFilter | A2AMessageType
    _count?: NestedIntFilter
    _min?: NestedEnumA2AMessageTypeFilter
    _max?: NestedEnumA2AMessageTypeFilter
  }

  export type NestedEnumA2AMessagePriorityWithAggregatesFilter = {
    equals?: A2AMessagePriority
    in?: Enumerable<A2AMessagePriority>
    notIn?: Enumerable<A2AMessagePriority>
    not?: NestedEnumA2AMessagePriorityWithAggregatesFilter | A2AMessagePriority
    _count?: NestedIntFilter
    _min?: NestedEnumA2AMessagePriorityFilter
    _max?: NestedEnumA2AMessagePriorityFilter
  }

  export type NestedIntNullableWithAggregatesFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntNullableWithAggregatesFilter | number | null
    _count?: NestedIntNullableFilter
    _avg?: NestedFloatNullableFilter
    _sum?: NestedIntNullableFilter
    _min?: NestedIntNullableFilter
    _max?: NestedIntNullableFilter
  }

  export type NestedFloatNullableFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatNullableFilter | number | null
  }
  export type NestedJsonFilter = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase>, Exclude<keyof Required<NestedJsonFilterBase>, 'path'>>,
        Required<NestedJsonFilterBase>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase>, 'path'>>

  export type NestedJsonFilterBase = {
    equals?: InputJsonValue | JsonNullValueFilter
    path?: string[]
    string_contains?: string
    string_starts_with?: string
    string_ends_with?: string
    array_contains?: InputJsonValue | null
    array_starts_with?: InputJsonValue | null
    array_ends_with?: InputJsonValue | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonNullValueFilter
  }

  export type NestedEnumA2AConversationStatusFilter = {
    equals?: A2AConversationStatus
    in?: Enumerable<A2AConversationStatus>
    notIn?: Enumerable<A2AConversationStatus>
    not?: NestedEnumA2AConversationStatusFilter | A2AConversationStatus
  }

  export type NestedEnumA2AConversationStatusWithAggregatesFilter = {
    equals?: A2AConversationStatus
    in?: Enumerable<A2AConversationStatus>
    notIn?: Enumerable<A2AConversationStatus>
    not?: NestedEnumA2AConversationStatusWithAggregatesFilter | A2AConversationStatus
    _count?: NestedIntFilter
    _min?: NestedEnumA2AConversationStatusFilter
    _max?: NestedEnumA2AConversationStatusFilter
  }

  export type NestedFloatNullableWithAggregatesFilter = {
    equals?: number | null
    in?: Enumerable<number> | number | null
    notIn?: Enumerable<number> | number | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatNullableWithAggregatesFilter | number | null
    _count?: NestedIntNullableFilter
    _avg?: NestedFloatNullableFilter
    _sum?: NestedFloatNullableFilter
    _min?: NestedFloatNullableFilter
    _max?: NestedFloatNullableFilter
  }

  export type UserCreateWithoutAgentsInput = {
    id?: string
    email: string
    name?: string | null
    passwordHash: string
    role?: UserRole
    createdAt?: Date | string
    updatedAt?: Date | string
    chatMessages?: ChatMessageCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutAgentsInput = {
    id?: string
    email: string
    name?: string | null
    passwordHash: string
    role?: UserRole
    createdAt?: Date | string
    updatedAt?: Date | string
    chatMessages?: ChatMessageUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutAgentsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAgentsInput, UserUncheckedCreateWithoutAgentsInput>
  }

  export type UserUpsertWithoutAgentsInput = {
    update: XOR<UserUpdateWithoutAgentsInput, UserUncheckedUpdateWithoutAgentsInput>
    create: XOR<UserCreateWithoutAgentsInput, UserUncheckedCreateWithoutAgentsInput>
  }

  export type UserUpdateWithoutAgentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | UserRole
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatMessages?: ChatMessageUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutAgentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | UserRole
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatMessages?: ChatMessageUncheckedUpdateManyWithoutUserNestedInput
  }

  export type AgentCreateWithoutUserInput = {
    id?: string
    name: string
    description?: string | null
    type?: AgentType
    status?: AgentStatus
    capabilities?: AgentCreatecapabilitiesInput | Enumerable<string>
    provider: string
    lastActive?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentUncheckedCreateWithoutUserInput = {
    id?: string
    name: string
    description?: string | null
    type?: AgentType
    status?: AgentStatus
    capabilities?: AgentCreatecapabilitiesInput | Enumerable<string>
    provider: string
    lastActive?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentCreateOrConnectWithoutUserInput = {
    where: AgentWhereUniqueInput
    create: XOR<AgentCreateWithoutUserInput, AgentUncheckedCreateWithoutUserInput>
  }

  export type AgentCreateManyUserInputEnvelope = {
    data: Enumerable<AgentCreateManyUserInput>
    skipDuplicates?: boolean
  }

  export type ChatMessageCreateWithoutUserInput = {
    id?: string
    content: string
    role: string
    sessionId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChatMessageUncheckedCreateWithoutUserInput = {
    id?: string
    content: string
    role: string
    sessionId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChatMessageCreateOrConnectWithoutUserInput = {
    where: ChatMessageWhereUniqueInput
    create: XOR<ChatMessageCreateWithoutUserInput, ChatMessageUncheckedCreateWithoutUserInput>
  }

  export type ChatMessageCreateManyUserInputEnvelope = {
    data: Enumerable<ChatMessageCreateManyUserInput>
    skipDuplicates?: boolean
  }

  export type AgentUpsertWithWhereUniqueWithoutUserInput = {
    where: AgentWhereUniqueInput
    update: XOR<AgentUpdateWithoutUserInput, AgentUncheckedUpdateWithoutUserInput>
    create: XOR<AgentCreateWithoutUserInput, AgentUncheckedCreateWithoutUserInput>
  }

  export type AgentUpdateWithWhereUniqueWithoutUserInput = {
    where: AgentWhereUniqueInput
    data: XOR<AgentUpdateWithoutUserInput, AgentUncheckedUpdateWithoutUserInput>
  }

  export type AgentUpdateManyWithWhereWithoutUserInput = {
    where: AgentScalarWhereInput
    data: XOR<AgentUpdateManyMutationInput, AgentUncheckedUpdateManyWithoutAgentsInput>
  }

  export type AgentScalarWhereInput = {
    AND?: Enumerable<AgentScalarWhereInput>
    OR?: Enumerable<AgentScalarWhereInput>
    NOT?: Enumerable<AgentScalarWhereInput>
    id?: StringFilter | string
    name?: StringFilter | string
    description?: StringNullableFilter | string | null
    type?: EnumAgentTypeFilter | AgentType
    status?: EnumAgentStatusFilter | AgentStatus
    capabilities?: StringNullableListFilter
    provider?: StringFilter | string
    lastActive?: DateTimeFilter | Date | string
    metadata?: JsonNullableFilter
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    userId?: StringNullableFilter | string | null
  }

  export type ChatMessageUpsertWithWhereUniqueWithoutUserInput = {
    where: ChatMessageWhereUniqueInput
    update: XOR<ChatMessageUpdateWithoutUserInput, ChatMessageUncheckedUpdateWithoutUserInput>
    create: XOR<ChatMessageCreateWithoutUserInput, ChatMessageUncheckedCreateWithoutUserInput>
  }

  export type ChatMessageUpdateWithWhereUniqueWithoutUserInput = {
    where: ChatMessageWhereUniqueInput
    data: XOR<ChatMessageUpdateWithoutUserInput, ChatMessageUncheckedUpdateWithoutUserInput>
  }

  export type ChatMessageUpdateManyWithWhereWithoutUserInput = {
    where: ChatMessageScalarWhereInput
    data: XOR<ChatMessageUpdateManyMutationInput, ChatMessageUncheckedUpdateManyWithoutChatMessagesInput>
  }

  export type ChatMessageScalarWhereInput = {
    AND?: Enumerable<ChatMessageScalarWhereInput>
    OR?: Enumerable<ChatMessageScalarWhereInput>
    NOT?: Enumerable<ChatMessageScalarWhereInput>
    id?: StringFilter | string
    content?: StringFilter | string
    role?: StringFilter | string
    userId?: StringFilter | string
    sessionId?: StringNullableFilter | string | null
    metadata?: JsonNullableFilter
    createdAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
  }

  export type UserCreateWithoutChatMessagesInput = {
    id?: string
    email: string
    name?: string | null
    passwordHash: string
    role?: UserRole
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutChatMessagesInput = {
    id?: string
    email: string
    name?: string | null
    passwordHash: string
    role?: UserRole
    createdAt?: Date | string
    updatedAt?: Date | string
    agents?: AgentUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutChatMessagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutChatMessagesInput, UserUncheckedCreateWithoutChatMessagesInput>
  }

  export type UserUpsertWithoutChatMessagesInput = {
    update: XOR<UserUpdateWithoutChatMessagesInput, UserUncheckedUpdateWithoutChatMessagesInput>
    create: XOR<UserCreateWithoutChatMessagesInput, UserUncheckedCreateWithoutChatMessagesInput>
  }

  export type UserUpdateWithoutChatMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | UserRole
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutChatMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | UserRole
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    agents?: AgentUncheckedUpdateManyWithoutUserNestedInput
  }

  export type A2AAgentCapabilityCreateWithoutAgentInput = {
    id?: string
    name: string
    description?: string | null
    version: string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AAgentCapabilityUncheckedCreateWithoutAgentInput = {
    id?: string
    name: string
    description?: string | null
    version: string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AAgentCapabilityCreateOrConnectWithoutAgentInput = {
    where: A2AAgentCapabilityWhereUniqueInput
    create: XOR<A2AAgentCapabilityCreateWithoutAgentInput, A2AAgentCapabilityUncheckedCreateWithoutAgentInput>
  }

  export type A2AAgentCapabilityCreateManyAgentInputEnvelope = {
    data: Enumerable<A2AAgentCapabilityCreateManyAgentInput>
    skipDuplicates?: boolean
  }

  export type A2AMessageCreateWithoutFromAgentInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    type: A2AMessageType
    priority?: A2AMessagePriority
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
    toAgent?: A2AAgentCreateNestedOneWithoutReceivedMessagesInput
    conversation?: A2AConversationCreateNestedOneWithoutMessagesInput
  }

  export type A2AMessageUncheckedCreateWithoutFromAgentInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    toAgentId?: string | null
    type: A2AMessageType
    priority?: A2AMessagePriority
    conversationId?: string | null
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type A2AMessageCreateOrConnectWithoutFromAgentInput = {
    where: A2AMessageWhereUniqueInput
    create: XOR<A2AMessageCreateWithoutFromAgentInput, A2AMessageUncheckedCreateWithoutFromAgentInput>
  }

  export type A2AMessageCreateManyFromAgentInputEnvelope = {
    data: Enumerable<A2AMessageCreateManyFromAgentInput>
    skipDuplicates?: boolean
  }

  export type A2AMessageCreateWithoutToAgentInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    type: A2AMessageType
    priority?: A2AMessagePriority
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
    fromAgent: A2AAgentCreateNestedOneWithoutSentMessagesInput
    conversation?: A2AConversationCreateNestedOneWithoutMessagesInput
  }

  export type A2AMessageUncheckedCreateWithoutToAgentInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    fromAgentId: string
    type: A2AMessageType
    priority?: A2AMessagePriority
    conversationId?: string | null
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type A2AMessageCreateOrConnectWithoutToAgentInput = {
    where: A2AMessageWhereUniqueInput
    create: XOR<A2AMessageCreateWithoutToAgentInput, A2AMessageUncheckedCreateWithoutToAgentInput>
  }

  export type A2AMessageCreateManyToAgentInputEnvelope = {
    data: Enumerable<A2AMessageCreateManyToAgentInput>
    skipDuplicates?: boolean
  }

  export type A2AConversationParticipantCreateWithoutAgentInput = {
    id?: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
    conversation: A2AConversationCreateNestedOneWithoutParticipantsInput
  }

  export type A2AConversationParticipantUncheckedCreateWithoutAgentInput = {
    id?: string
    conversationId: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
  }

  export type A2AConversationParticipantCreateOrConnectWithoutAgentInput = {
    where: A2AConversationParticipantWhereUniqueInput
    create: XOR<A2AConversationParticipantCreateWithoutAgentInput, A2AConversationParticipantUncheckedCreateWithoutAgentInput>
  }

  export type A2AConversationParticipantCreateManyAgentInputEnvelope = {
    data: Enumerable<A2AConversationParticipantCreateManyAgentInput>
    skipDuplicates?: boolean
  }

  export type A2AHeartbeatCreateWithoutAgentInput = {
    id?: string
    timestamp: Date | string
    status: A2AAgentStatus
    load?: number | null
    activeConnections?: number | null
    lastActivity?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type A2AHeartbeatUncheckedCreateWithoutAgentInput = {
    id?: string
    timestamp: Date | string
    status: A2AAgentStatus
    load?: number | null
    activeConnections?: number | null
    lastActivity?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type A2AHeartbeatCreateOrConnectWithoutAgentInput = {
    where: A2AHeartbeatWhereUniqueInput
    create: XOR<A2AHeartbeatCreateWithoutAgentInput, A2AHeartbeatUncheckedCreateWithoutAgentInput>
  }

  export type A2AHeartbeatCreateManyAgentInputEnvelope = {
    data: Enumerable<A2AHeartbeatCreateManyAgentInput>
    skipDuplicates?: boolean
  }

  export type A2AAgentCapabilityUpsertWithWhereUniqueWithoutAgentInput = {
    where: A2AAgentCapabilityWhereUniqueInput
    update: XOR<A2AAgentCapabilityUpdateWithoutAgentInput, A2AAgentCapabilityUncheckedUpdateWithoutAgentInput>
    create: XOR<A2AAgentCapabilityCreateWithoutAgentInput, A2AAgentCapabilityUncheckedCreateWithoutAgentInput>
  }

  export type A2AAgentCapabilityUpdateWithWhereUniqueWithoutAgentInput = {
    where: A2AAgentCapabilityWhereUniqueInput
    data: XOR<A2AAgentCapabilityUpdateWithoutAgentInput, A2AAgentCapabilityUncheckedUpdateWithoutAgentInput>
  }

  export type A2AAgentCapabilityUpdateManyWithWhereWithoutAgentInput = {
    where: A2AAgentCapabilityScalarWhereInput
    data: XOR<A2AAgentCapabilityUpdateManyMutationInput, A2AAgentCapabilityUncheckedUpdateManyWithoutCapabilitiesInput>
  }

  export type A2AAgentCapabilityScalarWhereInput = {
    AND?: Enumerable<A2AAgentCapabilityScalarWhereInput>
    OR?: Enumerable<A2AAgentCapabilityScalarWhereInput>
    NOT?: Enumerable<A2AAgentCapabilityScalarWhereInput>
    id?: StringFilter | string
    agentId?: StringFilter | string
    name?: StringFilter | string
    description?: StringNullableFilter | string | null
    version?: StringFilter | string
    parameters?: JsonNullableFilter
    metadata?: JsonNullableFilter
  }

  export type A2AMessageUpsertWithWhereUniqueWithoutFromAgentInput = {
    where: A2AMessageWhereUniqueInput
    update: XOR<A2AMessageUpdateWithoutFromAgentInput, A2AMessageUncheckedUpdateWithoutFromAgentInput>
    create: XOR<A2AMessageCreateWithoutFromAgentInput, A2AMessageUncheckedCreateWithoutFromAgentInput>
  }

  export type A2AMessageUpdateWithWhereUniqueWithoutFromAgentInput = {
    where: A2AMessageWhereUniqueInput
    data: XOR<A2AMessageUpdateWithoutFromAgentInput, A2AMessageUncheckedUpdateWithoutFromAgentInput>
  }

  export type A2AMessageUpdateManyWithWhereWithoutFromAgentInput = {
    where: A2AMessageScalarWhereInput
    data: XOR<A2AMessageUpdateManyMutationInput, A2AMessageUncheckedUpdateManyWithoutSentMessagesInput>
  }

  export type A2AMessageScalarWhereInput = {
    AND?: Enumerable<A2AMessageScalarWhereInput>
    OR?: Enumerable<A2AMessageScalarWhereInput>
    NOT?: Enumerable<A2AMessageScalarWhereInput>
    id?: StringFilter | string
    messageId?: StringFilter | string
    protocolVersion?: StringFilter | string
    timestamp?: DateTimeFilter | Date | string
    fromAgentId?: StringFilter | string
    toAgentId?: StringNullableFilter | string | null
    type?: EnumA2AMessageTypeFilter | A2AMessageType
    priority?: EnumA2AMessagePriorityFilter | A2AMessagePriority
    conversationId?: StringNullableFilter | string | null
    requestId?: StringNullableFilter | string | null
    ttl?: IntNullableFilter | number | null
    payload?: JsonFilter
    routing?: JsonNullableFilter
    signature?: StringNullableFilter | string | null
    checksum?: StringNullableFilter | string | null
    metadata?: JsonNullableFilter
    deliveredAt?: DateTimeNullableFilter | Date | string | null
    acknowledgedAt?: DateTimeNullableFilter | Date | string | null
    createdAt?: DateTimeFilter | Date | string
  }

  export type A2AMessageUpsertWithWhereUniqueWithoutToAgentInput = {
    where: A2AMessageWhereUniqueInput
    update: XOR<A2AMessageUpdateWithoutToAgentInput, A2AMessageUncheckedUpdateWithoutToAgentInput>
    create: XOR<A2AMessageCreateWithoutToAgentInput, A2AMessageUncheckedCreateWithoutToAgentInput>
  }

  export type A2AMessageUpdateWithWhereUniqueWithoutToAgentInput = {
    where: A2AMessageWhereUniqueInput
    data: XOR<A2AMessageUpdateWithoutToAgentInput, A2AMessageUncheckedUpdateWithoutToAgentInput>
  }

  export type A2AMessageUpdateManyWithWhereWithoutToAgentInput = {
    where: A2AMessageScalarWhereInput
    data: XOR<A2AMessageUpdateManyMutationInput, A2AMessageUncheckedUpdateManyWithoutReceivedMessagesInput>
  }

  export type A2AConversationParticipantUpsertWithWhereUniqueWithoutAgentInput = {
    where: A2AConversationParticipantWhereUniqueInput
    update: XOR<A2AConversationParticipantUpdateWithoutAgentInput, A2AConversationParticipantUncheckedUpdateWithoutAgentInput>
    create: XOR<A2AConversationParticipantCreateWithoutAgentInput, A2AConversationParticipantUncheckedCreateWithoutAgentInput>
  }

  export type A2AConversationParticipantUpdateWithWhereUniqueWithoutAgentInput = {
    where: A2AConversationParticipantWhereUniqueInput
    data: XOR<A2AConversationParticipantUpdateWithoutAgentInput, A2AConversationParticipantUncheckedUpdateWithoutAgentInput>
  }

  export type A2AConversationParticipantUpdateManyWithWhereWithoutAgentInput = {
    where: A2AConversationParticipantScalarWhereInput
    data: XOR<A2AConversationParticipantUpdateManyMutationInput, A2AConversationParticipantUncheckedUpdateManyWithoutConversationsInput>
  }

  export type A2AConversationParticipantScalarWhereInput = {
    AND?: Enumerable<A2AConversationParticipantScalarWhereInput>
    OR?: Enumerable<A2AConversationParticipantScalarWhereInput>
    NOT?: Enumerable<A2AConversationParticipantScalarWhereInput>
    id?: StringFilter | string
    conversationId?: StringFilter | string
    agentId?: StringFilter | string
    joinedAt?: DateTimeFilter | Date | string
    leftAt?: DateTimeNullableFilter | Date | string | null
    role?: StringNullableFilter | string | null
  }

  export type A2AHeartbeatUpsertWithWhereUniqueWithoutAgentInput = {
    where: A2AHeartbeatWhereUniqueInput
    update: XOR<A2AHeartbeatUpdateWithoutAgentInput, A2AHeartbeatUncheckedUpdateWithoutAgentInput>
    create: XOR<A2AHeartbeatCreateWithoutAgentInput, A2AHeartbeatUncheckedCreateWithoutAgentInput>
  }

  export type A2AHeartbeatUpdateWithWhereUniqueWithoutAgentInput = {
    where: A2AHeartbeatWhereUniqueInput
    data: XOR<A2AHeartbeatUpdateWithoutAgentInput, A2AHeartbeatUncheckedUpdateWithoutAgentInput>
  }

  export type A2AHeartbeatUpdateManyWithWhereWithoutAgentInput = {
    where: A2AHeartbeatScalarWhereInput
    data: XOR<A2AHeartbeatUpdateManyMutationInput, A2AHeartbeatUncheckedUpdateManyWithoutHeartbeatsInput>
  }

  export type A2AHeartbeatScalarWhereInput = {
    AND?: Enumerable<A2AHeartbeatScalarWhereInput>
    OR?: Enumerable<A2AHeartbeatScalarWhereInput>
    NOT?: Enumerable<A2AHeartbeatScalarWhereInput>
    id?: StringFilter | string
    agentId?: StringFilter | string
    timestamp?: DateTimeFilter | Date | string
    status?: EnumA2AAgentStatusFilter | A2AAgentStatus
    load?: FloatNullableFilter | number | null
    activeConnections?: IntNullableFilter | number | null
    lastActivity?: DateTimeNullableFilter | Date | string | null
    metadata?: JsonNullableFilter
    createdAt?: DateTimeFilter | Date | string
  }

  export type A2AAgentCreateWithoutCapabilitiesInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    sentMessages?: A2AMessageCreateNestedManyWithoutFromAgentInput
    receivedMessages?: A2AMessageCreateNestedManyWithoutToAgentInput
    conversations?: A2AConversationParticipantCreateNestedManyWithoutAgentInput
    heartbeats?: A2AHeartbeatCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentUncheckedCreateWithoutCapabilitiesInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    sentMessages?: A2AMessageUncheckedCreateNestedManyWithoutFromAgentInput
    receivedMessages?: A2AMessageUncheckedCreateNestedManyWithoutToAgentInput
    conversations?: A2AConversationParticipantUncheckedCreateNestedManyWithoutAgentInput
    heartbeats?: A2AHeartbeatUncheckedCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentCreateOrConnectWithoutCapabilitiesInput = {
    where: A2AAgentWhereUniqueInput
    create: XOR<A2AAgentCreateWithoutCapabilitiesInput, A2AAgentUncheckedCreateWithoutCapabilitiesInput>
  }

  export type A2AAgentUpsertWithoutCapabilitiesInput = {
    update: XOR<A2AAgentUpdateWithoutCapabilitiesInput, A2AAgentUncheckedUpdateWithoutCapabilitiesInput>
    create: XOR<A2AAgentCreateWithoutCapabilitiesInput, A2AAgentUncheckedCreateWithoutCapabilitiesInput>
  }

  export type A2AAgentUpdateWithoutCapabilitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentMessages?: A2AMessageUpdateManyWithoutFromAgentNestedInput
    receivedMessages?: A2AMessageUpdateManyWithoutToAgentNestedInput
    conversations?: A2AConversationParticipantUpdateManyWithoutAgentNestedInput
    heartbeats?: A2AHeartbeatUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentUncheckedUpdateWithoutCapabilitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentMessages?: A2AMessageUncheckedUpdateManyWithoutFromAgentNestedInput
    receivedMessages?: A2AMessageUncheckedUpdateManyWithoutToAgentNestedInput
    conversations?: A2AConversationParticipantUncheckedUpdateManyWithoutAgentNestedInput
    heartbeats?: A2AHeartbeatUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentCreateWithoutSentMessagesInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityCreateNestedManyWithoutAgentInput
    receivedMessages?: A2AMessageCreateNestedManyWithoutToAgentInput
    conversations?: A2AConversationParticipantCreateNestedManyWithoutAgentInput
    heartbeats?: A2AHeartbeatCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentUncheckedCreateWithoutSentMessagesInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityUncheckedCreateNestedManyWithoutAgentInput
    receivedMessages?: A2AMessageUncheckedCreateNestedManyWithoutToAgentInput
    conversations?: A2AConversationParticipantUncheckedCreateNestedManyWithoutAgentInput
    heartbeats?: A2AHeartbeatUncheckedCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentCreateOrConnectWithoutSentMessagesInput = {
    where: A2AAgentWhereUniqueInput
    create: XOR<A2AAgentCreateWithoutSentMessagesInput, A2AAgentUncheckedCreateWithoutSentMessagesInput>
  }

  export type A2AAgentCreateWithoutReceivedMessagesInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityCreateNestedManyWithoutAgentInput
    sentMessages?: A2AMessageCreateNestedManyWithoutFromAgentInput
    conversations?: A2AConversationParticipantCreateNestedManyWithoutAgentInput
    heartbeats?: A2AHeartbeatCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentUncheckedCreateWithoutReceivedMessagesInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityUncheckedCreateNestedManyWithoutAgentInput
    sentMessages?: A2AMessageUncheckedCreateNestedManyWithoutFromAgentInput
    conversations?: A2AConversationParticipantUncheckedCreateNestedManyWithoutAgentInput
    heartbeats?: A2AHeartbeatUncheckedCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentCreateOrConnectWithoutReceivedMessagesInput = {
    where: A2AAgentWhereUniqueInput
    create: XOR<A2AAgentCreateWithoutReceivedMessagesInput, A2AAgentUncheckedCreateWithoutReceivedMessagesInput>
  }

  export type A2AConversationCreateWithoutMessagesInput = {
    id?: string
    conversationId: string
    initiatorId: string
    topic?: string | null
    status?: A2AConversationStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    participants?: A2AConversationParticipantCreateNestedManyWithoutConversationInput
  }

  export type A2AConversationUncheckedCreateWithoutMessagesInput = {
    id?: string
    conversationId: string
    initiatorId: string
    topic?: string | null
    status?: A2AConversationStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    participants?: A2AConversationParticipantUncheckedCreateNestedManyWithoutConversationInput
  }

  export type A2AConversationCreateOrConnectWithoutMessagesInput = {
    where: A2AConversationWhereUniqueInput
    create: XOR<A2AConversationCreateWithoutMessagesInput, A2AConversationUncheckedCreateWithoutMessagesInput>
  }

  export type A2AAgentUpsertWithoutSentMessagesInput = {
    update: XOR<A2AAgentUpdateWithoutSentMessagesInput, A2AAgentUncheckedUpdateWithoutSentMessagesInput>
    create: XOR<A2AAgentCreateWithoutSentMessagesInput, A2AAgentUncheckedCreateWithoutSentMessagesInput>
  }

  export type A2AAgentUpdateWithoutSentMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUpdateManyWithoutAgentNestedInput
    receivedMessages?: A2AMessageUpdateManyWithoutToAgentNestedInput
    conversations?: A2AConversationParticipantUpdateManyWithoutAgentNestedInput
    heartbeats?: A2AHeartbeatUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentUncheckedUpdateWithoutSentMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUncheckedUpdateManyWithoutAgentNestedInput
    receivedMessages?: A2AMessageUncheckedUpdateManyWithoutToAgentNestedInput
    conversations?: A2AConversationParticipantUncheckedUpdateManyWithoutAgentNestedInput
    heartbeats?: A2AHeartbeatUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentUpsertWithoutReceivedMessagesInput = {
    update: XOR<A2AAgentUpdateWithoutReceivedMessagesInput, A2AAgentUncheckedUpdateWithoutReceivedMessagesInput>
    create: XOR<A2AAgentCreateWithoutReceivedMessagesInput, A2AAgentUncheckedCreateWithoutReceivedMessagesInput>
  }

  export type A2AAgentUpdateWithoutReceivedMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUpdateManyWithoutAgentNestedInput
    sentMessages?: A2AMessageUpdateManyWithoutFromAgentNestedInput
    conversations?: A2AConversationParticipantUpdateManyWithoutAgentNestedInput
    heartbeats?: A2AHeartbeatUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentUncheckedUpdateWithoutReceivedMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUncheckedUpdateManyWithoutAgentNestedInput
    sentMessages?: A2AMessageUncheckedUpdateManyWithoutFromAgentNestedInput
    conversations?: A2AConversationParticipantUncheckedUpdateManyWithoutAgentNestedInput
    heartbeats?: A2AHeartbeatUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type A2AConversationUpsertWithoutMessagesInput = {
    update: XOR<A2AConversationUpdateWithoutMessagesInput, A2AConversationUncheckedUpdateWithoutMessagesInput>
    create: XOR<A2AConversationCreateWithoutMessagesInput, A2AConversationUncheckedCreateWithoutMessagesInput>
  }

  export type A2AConversationUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    initiatorId?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumA2AConversationStatusFieldUpdateOperationsInput | A2AConversationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    participants?: A2AConversationParticipantUpdateManyWithoutConversationNestedInput
  }

  export type A2AConversationUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    initiatorId?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumA2AConversationStatusFieldUpdateOperationsInput | A2AConversationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    participants?: A2AConversationParticipantUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type A2AConversationParticipantCreateWithoutConversationInput = {
    id?: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
    agent: A2AAgentCreateNestedOneWithoutConversationsInput
  }

  export type A2AConversationParticipantUncheckedCreateWithoutConversationInput = {
    id?: string
    agentId: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
  }

  export type A2AConversationParticipantCreateOrConnectWithoutConversationInput = {
    where: A2AConversationParticipantWhereUniqueInput
    create: XOR<A2AConversationParticipantCreateWithoutConversationInput, A2AConversationParticipantUncheckedCreateWithoutConversationInput>
  }

  export type A2AConversationParticipantCreateManyConversationInputEnvelope = {
    data: Enumerable<A2AConversationParticipantCreateManyConversationInput>
    skipDuplicates?: boolean
  }

  export type A2AMessageCreateWithoutConversationInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    type: A2AMessageType
    priority?: A2AMessagePriority
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
    fromAgent: A2AAgentCreateNestedOneWithoutSentMessagesInput
    toAgent?: A2AAgentCreateNestedOneWithoutReceivedMessagesInput
  }

  export type A2AMessageUncheckedCreateWithoutConversationInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    fromAgentId: string
    toAgentId?: string | null
    type: A2AMessageType
    priority?: A2AMessagePriority
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type A2AMessageCreateOrConnectWithoutConversationInput = {
    where: A2AMessageWhereUniqueInput
    create: XOR<A2AMessageCreateWithoutConversationInput, A2AMessageUncheckedCreateWithoutConversationInput>
  }

  export type A2AMessageCreateManyConversationInputEnvelope = {
    data: Enumerable<A2AMessageCreateManyConversationInput>
    skipDuplicates?: boolean
  }

  export type A2AConversationParticipantUpsertWithWhereUniqueWithoutConversationInput = {
    where: A2AConversationParticipantWhereUniqueInput
    update: XOR<A2AConversationParticipantUpdateWithoutConversationInput, A2AConversationParticipantUncheckedUpdateWithoutConversationInput>
    create: XOR<A2AConversationParticipantCreateWithoutConversationInput, A2AConversationParticipantUncheckedCreateWithoutConversationInput>
  }

  export type A2AConversationParticipantUpdateWithWhereUniqueWithoutConversationInput = {
    where: A2AConversationParticipantWhereUniqueInput
    data: XOR<A2AConversationParticipantUpdateWithoutConversationInput, A2AConversationParticipantUncheckedUpdateWithoutConversationInput>
  }

  export type A2AConversationParticipantUpdateManyWithWhereWithoutConversationInput = {
    where: A2AConversationParticipantScalarWhereInput
    data: XOR<A2AConversationParticipantUpdateManyMutationInput, A2AConversationParticipantUncheckedUpdateManyWithoutParticipantsInput>
  }

  export type A2AMessageUpsertWithWhereUniqueWithoutConversationInput = {
    where: A2AMessageWhereUniqueInput
    update: XOR<A2AMessageUpdateWithoutConversationInput, A2AMessageUncheckedUpdateWithoutConversationInput>
    create: XOR<A2AMessageCreateWithoutConversationInput, A2AMessageUncheckedCreateWithoutConversationInput>
  }

  export type A2AMessageUpdateWithWhereUniqueWithoutConversationInput = {
    where: A2AMessageWhereUniqueInput
    data: XOR<A2AMessageUpdateWithoutConversationInput, A2AMessageUncheckedUpdateWithoutConversationInput>
  }

  export type A2AMessageUpdateManyWithWhereWithoutConversationInput = {
    where: A2AMessageScalarWhereInput
    data: XOR<A2AMessageUpdateManyMutationInput, A2AMessageUncheckedUpdateManyWithoutMessagesInput>
  }

  export type A2AConversationCreateWithoutParticipantsInput = {
    id?: string
    conversationId: string
    initiatorId: string
    topic?: string | null
    status?: A2AConversationStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: A2AMessageCreateNestedManyWithoutConversationInput
  }

  export type A2AConversationUncheckedCreateWithoutParticipantsInput = {
    id?: string
    conversationId: string
    initiatorId: string
    topic?: string | null
    status?: A2AConversationStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: A2AMessageUncheckedCreateNestedManyWithoutConversationInput
  }

  export type A2AConversationCreateOrConnectWithoutParticipantsInput = {
    where: A2AConversationWhereUniqueInput
    create: XOR<A2AConversationCreateWithoutParticipantsInput, A2AConversationUncheckedCreateWithoutParticipantsInput>
  }

  export type A2AAgentCreateWithoutConversationsInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityCreateNestedManyWithoutAgentInput
    sentMessages?: A2AMessageCreateNestedManyWithoutFromAgentInput
    receivedMessages?: A2AMessageCreateNestedManyWithoutToAgentInput
    heartbeats?: A2AHeartbeatCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentUncheckedCreateWithoutConversationsInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityUncheckedCreateNestedManyWithoutAgentInput
    sentMessages?: A2AMessageUncheckedCreateNestedManyWithoutFromAgentInput
    receivedMessages?: A2AMessageUncheckedCreateNestedManyWithoutToAgentInput
    heartbeats?: A2AHeartbeatUncheckedCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentCreateOrConnectWithoutConversationsInput = {
    where: A2AAgentWhereUniqueInput
    create: XOR<A2AAgentCreateWithoutConversationsInput, A2AAgentUncheckedCreateWithoutConversationsInput>
  }

  export type A2AConversationUpsertWithoutParticipantsInput = {
    update: XOR<A2AConversationUpdateWithoutParticipantsInput, A2AConversationUncheckedUpdateWithoutParticipantsInput>
    create: XOR<A2AConversationCreateWithoutParticipantsInput, A2AConversationUncheckedCreateWithoutParticipantsInput>
  }

  export type A2AConversationUpdateWithoutParticipantsInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    initiatorId?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumA2AConversationStatusFieldUpdateOperationsInput | A2AConversationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: A2AMessageUpdateManyWithoutConversationNestedInput
  }

  export type A2AConversationUncheckedUpdateWithoutParticipantsInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    initiatorId?: StringFieldUpdateOperationsInput | string
    topic?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumA2AConversationStatusFieldUpdateOperationsInput | A2AConversationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: A2AMessageUncheckedUpdateManyWithoutConversationNestedInput
  }

  export type A2AAgentUpsertWithoutConversationsInput = {
    update: XOR<A2AAgentUpdateWithoutConversationsInput, A2AAgentUncheckedUpdateWithoutConversationsInput>
    create: XOR<A2AAgentCreateWithoutConversationsInput, A2AAgentUncheckedCreateWithoutConversationsInput>
  }

  export type A2AAgentUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUpdateManyWithoutAgentNestedInput
    sentMessages?: A2AMessageUpdateManyWithoutFromAgentNestedInput
    receivedMessages?: A2AMessageUpdateManyWithoutToAgentNestedInput
    heartbeats?: A2AHeartbeatUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentUncheckedUpdateWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUncheckedUpdateManyWithoutAgentNestedInput
    sentMessages?: A2AMessageUncheckedUpdateManyWithoutFromAgentNestedInput
    receivedMessages?: A2AMessageUncheckedUpdateManyWithoutToAgentNestedInput
    heartbeats?: A2AHeartbeatUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentCreateWithoutHeartbeatsInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityCreateNestedManyWithoutAgentInput
    sentMessages?: A2AMessageCreateNestedManyWithoutFromAgentInput
    receivedMessages?: A2AMessageCreateNestedManyWithoutToAgentInput
    conversations?: A2AConversationParticipantCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentUncheckedCreateWithoutHeartbeatsInput = {
    id?: string
    agentId: string
    name: string
    type: string
    version: string
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: A2AAgentStatus
    lastHeartbeat?: Date | string | null
    registeredAt?: Date | string
    updatedAt?: Date | string
    capabilities?: A2AAgentCapabilityUncheckedCreateNestedManyWithoutAgentInput
    sentMessages?: A2AMessageUncheckedCreateNestedManyWithoutFromAgentInput
    receivedMessages?: A2AMessageUncheckedCreateNestedManyWithoutToAgentInput
    conversations?: A2AConversationParticipantUncheckedCreateNestedManyWithoutAgentInput
  }

  export type A2AAgentCreateOrConnectWithoutHeartbeatsInput = {
    where: A2AAgentWhereUniqueInput
    create: XOR<A2AAgentCreateWithoutHeartbeatsInput, A2AAgentUncheckedCreateWithoutHeartbeatsInput>
  }

  export type A2AAgentUpsertWithoutHeartbeatsInput = {
    update: XOR<A2AAgentUpdateWithoutHeartbeatsInput, A2AAgentUncheckedUpdateWithoutHeartbeatsInput>
    create: XOR<A2AAgentCreateWithoutHeartbeatsInput, A2AAgentUncheckedCreateWithoutHeartbeatsInput>
  }

  export type A2AAgentUpdateWithoutHeartbeatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUpdateManyWithoutAgentNestedInput
    sentMessages?: A2AMessageUpdateManyWithoutFromAgentNestedInput
    receivedMessages?: A2AMessageUpdateManyWithoutToAgentNestedInput
    conversations?: A2AConversationParticipantUpdateManyWithoutAgentNestedInput
  }

  export type A2AAgentUncheckedUpdateWithoutHeartbeatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    endpoints?: NullableJsonNullValueInput | InputJsonValue
    authentication?: NullableJsonNullValueInput | InputJsonValue
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    lastHeartbeat?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    registeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    capabilities?: A2AAgentCapabilityUncheckedUpdateManyWithoutAgentNestedInput
    sentMessages?: A2AMessageUncheckedUpdateManyWithoutFromAgentNestedInput
    receivedMessages?: A2AMessageUncheckedUpdateManyWithoutToAgentNestedInput
    conversations?: A2AConversationParticipantUncheckedUpdateManyWithoutAgentNestedInput
  }

  export type AgentCreateManyUserInput = {
    id?: string
    name: string
    description?: string | null
    type?: AgentType
    status?: AgentStatus
    capabilities?: AgentCreatecapabilitiesInput | Enumerable<string>
    provider: string
    lastActive?: Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChatMessageCreateManyUserInput = {
    id?: string
    content: string
    role: string
    sessionId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumAgentTypeFieldUpdateOperationsInput | AgentType
    status?: EnumAgentStatusFieldUpdateOperationsInput | AgentStatus
    capabilities?: AgentUpdatecapabilitiesInput | Enumerable<string>
    provider?: StringFieldUpdateOperationsInput | string
    lastActive?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumAgentTypeFieldUpdateOperationsInput | AgentType
    status?: EnumAgentStatusFieldUpdateOperationsInput | AgentStatus
    capabilities?: AgentUpdatecapabilitiesInput | Enumerable<string>
    provider?: StringFieldUpdateOperationsInput | string
    lastActive?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentUncheckedUpdateManyWithoutAgentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumAgentTypeFieldUpdateOperationsInput | AgentType
    status?: EnumAgentStatusFieldUpdateOperationsInput | AgentStatus
    capabilities?: AgentUpdatecapabilitiesInput | Enumerable<string>
    provider?: StringFieldUpdateOperationsInput | string
    lastActive?: DateTimeFieldUpdateOperationsInput | Date | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateManyWithoutChatMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AAgentCapabilityCreateManyAgentInput = {
    id?: string
    name: string
    description?: string | null
    version: string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AMessageCreateManyFromAgentInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    toAgentId?: string | null
    type: A2AMessageType
    priority?: A2AMessagePriority
    conversationId?: string | null
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type A2AMessageCreateManyToAgentInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    fromAgentId: string
    type: A2AMessageType
    priority?: A2AMessagePriority
    conversationId?: string | null
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type A2AConversationParticipantCreateManyAgentInput = {
    id?: string
    conversationId: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
  }

  export type A2AHeartbeatCreateManyAgentInput = {
    id?: string
    timestamp: Date | string
    status: A2AAgentStatus
    load?: number | null
    activeConnections?: number | null
    lastActivity?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type A2AAgentCapabilityUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    version?: StringFieldUpdateOperationsInput | string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AAgentCapabilityUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    version?: StringFieldUpdateOperationsInput | string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AAgentCapabilityUncheckedUpdateManyWithoutCapabilitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    version?: StringFieldUpdateOperationsInput | string
    parameters?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type A2AMessageUpdateWithoutFromAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    toAgent?: A2AAgentUpdateOneWithoutReceivedMessagesNestedInput
    conversation?: A2AConversationUpdateOneWithoutMessagesNestedInput
  }

  export type A2AMessageUncheckedUpdateWithoutFromAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    toAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AMessageUncheckedUpdateManyWithoutSentMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    toAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AMessageUpdateWithoutToAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgent?: A2AAgentUpdateOneRequiredWithoutSentMessagesNestedInput
    conversation?: A2AConversationUpdateOneWithoutMessagesNestedInput
  }

  export type A2AMessageUncheckedUpdateWithoutToAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgentId?: StringFieldUpdateOperationsInput | string
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AMessageUncheckedUpdateManyWithoutReceivedMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgentId?: StringFieldUpdateOperationsInput | string
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    conversationId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AConversationParticipantUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    conversation?: A2AConversationUpdateOneRequiredWithoutParticipantsNestedInput
  }

  export type A2AConversationParticipantUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type A2AConversationParticipantUncheckedUpdateManyWithoutConversationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    conversationId?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type A2AHeartbeatUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    load?: NullableFloatFieldUpdateOperationsInput | number | null
    activeConnections?: NullableIntFieldUpdateOperationsInput | number | null
    lastActivity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AHeartbeatUncheckedUpdateWithoutAgentInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    load?: NullableFloatFieldUpdateOperationsInput | number | null
    activeConnections?: NullableIntFieldUpdateOperationsInput | number | null
    lastActivity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AHeartbeatUncheckedUpdateManyWithoutHeartbeatsInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumA2AAgentStatusFieldUpdateOperationsInput | A2AAgentStatus
    load?: NullableFloatFieldUpdateOperationsInput | number | null
    activeConnections?: NullableIntFieldUpdateOperationsInput | number | null
    lastActivity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AConversationParticipantCreateManyConversationInput = {
    id?: string
    agentId: string
    joinedAt?: Date | string
    leftAt?: Date | string | null
    role?: string | null
  }

  export type A2AMessageCreateManyConversationInput = {
    id?: string
    messageId: string
    protocolVersion?: string
    timestamp: Date | string
    fromAgentId: string
    toAgentId?: string | null
    type: A2AMessageType
    priority?: A2AMessagePriority
    requestId?: string | null
    ttl?: number | null
    payload: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: string | null
    checksum?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: Date | string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type A2AConversationParticipantUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    agent?: A2AAgentUpdateOneRequiredWithoutConversationsNestedInput
  }

  export type A2AConversationParticipantUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type A2AConversationParticipantUncheckedUpdateManyWithoutParticipantsInput = {
    id?: StringFieldUpdateOperationsInput | string
    agentId?: StringFieldUpdateOperationsInput | string
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type A2AMessageUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgent?: A2AAgentUpdateOneRequiredWithoutSentMessagesNestedInput
    toAgent?: A2AAgentUpdateOneWithoutReceivedMessagesNestedInput
  }

  export type A2AMessageUncheckedUpdateWithoutConversationInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgentId?: StringFieldUpdateOperationsInput | string
    toAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type A2AMessageUncheckedUpdateManyWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    protocolVersion?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    fromAgentId?: StringFieldUpdateOperationsInput | string
    toAgentId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumA2AMessageTypeFieldUpdateOperationsInput | A2AMessageType
    priority?: EnumA2AMessagePriorityFieldUpdateOperationsInput | A2AMessagePriority
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    ttl?: NullableIntFieldUpdateOperationsInput | number | null
    payload?: JsonNullValueInput | InputJsonValue
    routing?: NullableJsonNullValueInput | InputJsonValue
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    deliveredAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
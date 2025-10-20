/**
 * Soft delete middleware for Prisma
 * 
 * This middleware intercepts delete operations and converts them to updates
 * that set the deletedAt field instead of actually deleting the record.
 * It also filters out soft-deleted records from find operations.
 */

// Models that support soft delete
const SOFT_DELETE_MODELS = [
  'user',
  'agent',
  'chat',
  'pipeline',
  'task',
  'workflow',
  'llmconfig',
  'registeredentity',
  'organization',
  'chatroom',
] as const;

type SoftDeleteModel = typeof SOFT_DELETE_MODELS[number];

// Query actions that should filter deleted records
const QUERY_ACTIONS = [
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'findFirstOrThrow',
  'findUniqueOrThrow',
] as const;

// Mutation actions that should update timestamps
const UPDATE_ACTIONS = ['update', 'updateMany', 'upsert'] as const;

// Delete actions to convert to soft delete
const DELETE_ACTIONS = ['delete', 'deleteMany'] as const;

/**
 * Checks if a model supports soft delete
 */
function isSoftDeleteModel(model: string | undefined): model is SoftDeleteModel {
  if (!model) return false;
  return SOFT_DELETE_MODELS.includes(model.toLowerCase() as SoftDeleteModel);
}

/**
 * Adds deletedAt: null filter to query parameters
 */
function addSoftDeleteFilter(params: any): void {
  if (params.args.where) {
    // Only add filter if deletedAt is not explicitly set
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  } else {
    params.args.where = { deletedAt: null };
  }
}

/**
 * Adds updatedAt timestamp to update operations
 */
function addUpdatedAtTimestamp(params: any): void {
  if (params.args.data && !params.args.data.updatedAt) {
    params.args.data.updatedAt = new Date();
  }
}

/**
 * Converts delete to soft delete (update with deletedAt)
 */
function convertDeleteToSoftDelete(params: any): void {
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = {
      deletedAt: new Date(),
      updatedAt: new Date(),
    };
  } else if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    params.args.data = {
      deletedAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Main soft delete middleware function
 *
 * Usage in PrismaService:
 * ```typescript
 * async onModuleInit() {
 *   await this.$connect();
 *   this.$use(softDeleteMiddleware);
 * }
 * ```
 */
export const softDeleteMiddleware = async (
  params: any,
  next: any
): Promise<any> => {
  const model = params.model?.toLowerCase();

  if (!isSoftDeleteModel(model)) {
    return next(params);
  }

  // Handle different action types
  if (QUERY_ACTIONS.includes(params.action as any)) {
    addSoftDeleteFilter(params);
  } else if (UPDATE_ACTIONS.includes(params.action as any)) {
    addUpdatedAtTimestamp(params);
  } else if (DELETE_ACTIONS.includes(params.action as any)) {
    convertDeleteToSoftDelete(params);
  }

  const result = await next(params);

  // Log soft delete operations for audit
  if (DELETE_ACTIONS.includes(params.action as any)) {
    console.log(`Soft deleted ${model} with params:`, params.args);
  }

  return result;
};

/**
 * Context-based middleware configuration
 * Allows bypassing soft delete filter in specific contexts
 */
export interface SoftDeleteContext {
  includeDeleted?: boolean;
  hardDelete?: boolean;
}

/**
 * Advanced soft delete middleware with context support
 *
 * Usage:
 * ```typescript
 * const middleware = createSoftDeleteMiddleware();
 * prisma.$use(middleware);
 * ```
 */
export function createSoftDeleteMiddleware(
  defaultContext: SoftDeleteContext = {}
): any {
  return async (params: any, next: any) => {
    // Check for context in params
    const context: SoftDeleteContext = (params as any).__context || defaultContext;

    if (!isSoftDeleteModel(params.model)) {
      return next(params);
    }

    // If includeDeleted is true, skip filtering
    if (context.includeDeleted) {
      return next(params);
    }

    // If hardDelete is true, allow actual delete operations
    if (context.hardDelete && DELETE_ACTIONS.includes(params.action as any)) {
      return next(params);
    }

    // Apply standard soft delete logic
    if (QUERY_ACTIONS.includes(params.action as any)) {
      addSoftDeleteFilter(params);
    }

    if (UPDATE_ACTIONS.includes(params.action as any)) {
      addUpdatedAtTimestamp(params);
    }

    if (DELETE_ACTIONS.includes(params.action as any)) {
      convertDeleteToSoftDelete(params);
    }

    return next(params);
  };
}

/**
 * Helper function to execute queries with deleted records
 *
 * Usage:
 * ```typescript
 * const allUsers = await withDeleted(prisma, async (db) => {
 *   return db.user.findMany();
 * });
 * ```
 */
export async function withDeleted<T>(
  prisma: any,
  callback: (db: any) => Promise<T>
): Promise<T> {
  // Temporarily set context to include deleted
  const originalContext = (prisma as any).__context;
  (prisma as any).__context = { includeDeleted: true };

  try {
    return await callback(prisma);
  } finally {
    (prisma as any).__context = originalContext;
  }
}

/**
 * Helper function to perform hard delete
 *
 * Usage:
 * ```typescript
 * await hardDelete(prisma, async (db) => {
 *   return db.user.delete({ where: { id: userId } });
 * });
 * ```
 */
export async function hardDelete<T>(
  prisma: any,
  callback: (db: any) => Promise<T>
): Promise<T> {
  const originalContext = (prisma as any).__context;
  (prisma as any).__context = { hardDelete: true };

  try {
    return await callback(prisma);
  } finally {
    (prisma as any).__context = originalContext;
  }
}

/**
 * Utility to restore soft-deleted records
 *
 * Usage:
 * ```typescript
 * await restoreRecord(prisma.user, userId);
 * ```
 */
export async function restoreRecord(
  model: any,
  where: any
): Promise<any> {
  return model.update({
    where,
    data: {
      deletedAt: null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Utility to get soft delete statistics
 *
 * Usage:
 * ```typescript
 * const stats = await getSoftDeleteStats(prisma, 'user');
 * // { total: 100, active: 85, deleted: 15 }
 * ```
 */
export async function getSoftDeleteStats(
  prisma: any,
  modelName: string
): Promise<{ total: number; active: number; deleted: number }> {
  const model = (prisma as any)[modelName];

  if (!model) {
    throw new Error(`Model ${modelName} not found`);
  }

  const [total, deleted] = await Promise.all([
    withDeleted(prisma, async (db) => db[modelName].count()),
    model.count({
      where: {
        deletedAt: { not: null },
      },
    }),
  ]);

  return {
    total,
    active: total - deleted,
    deleted,
  };
}

export class BaseRepository {
    prisma;
    model;
    constructor(prisma, model) {
        this.prisma = prisma;
        this.model = model;
    }
    /**
     * Helper method to handle pagination
     */
    getPaginationOptions(page, limit) {
        if (!page || !limit)
            return {};
        const skip = (page - 1) * limit;
        return {
            skip,
            take: limit
        };
    }
    /**
     * Helper method to handle sorting
     */
    getSortOptions(sortBy, sortOrder = 'desc') {
        if (!sortBy)
            return {};
        return {
            orderBy: {
                [sortBy]: sortOrder
            }
        };
    }
    /**
     * Helper method to build where clauses
     */
    buildWhereClause(filters = {}) {
        const where = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (typeof value === 'string' && key.includes('search')) {
                    // Handle search fields
                    where.OR = where.OR || [];
                    where.OR.push({
                        [key.replace('search', '')]: {
                            contains: value,
                            mode: 'insensitive'
                        }
                    });
                }
                else if (Array.isArray(value)) {
                    // Handle array filters (e.g., status in ['active', 'inactive'])
                    where[key] = {
                        in: value
                    };
                }
                else if (typeof value === 'object' && value.from && value.to) {
                    // Handle date ranges
                    where[key] = {
                        gte: value.from,
                        lte: value.to
                    };
                }
                else {
                    // Handle exact matches
                    where[key] = value;
                }
            }
        });
        return where;
    }
    /**
     * Helper method to count total records for pagination
     */
    async countTotal(where) {
        // This should be implemented by subclasses for their specific model
        return this.prisma[this.model].count({ where });
    }
}
//# sourceMappingURL=base.repository.js.map
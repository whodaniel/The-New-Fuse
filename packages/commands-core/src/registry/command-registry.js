"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
/**
 * Registry for command handlers and factories
 */
class CommandRegistry {
    handlers = new Map();
    factories = new Map();
    metadata = new Map();
    /**
     * Register a command handler
     */
    register(commandType, handler) {
        if (this.handlers.has(commandType)) {
            throw new Error(`Handler for command type '${commandType}' is already registered);
    }

    const metadata = handler.getMetadata();
    const registeredHandler: RegisteredHandler = {
      handler,
      metadata,
      registeredAt: new Date()
    };

    this.handlers.set(commandType, registeredHandler);
    this.metadata.set(commandType, metadata);
  }

  /**
   * Register a command handler factory
   */
  public registerFactory<TData, TResult>(
    commandType: string, 
    factory: ICommandHandlerFactory<TData, TResult>
  ): void {
    if (this.factories.has(commandType)) {`);
            throw new Error(`Factory for command type '${commandType}`, ' is already registered););
        }
        const metadata = factory.getMetadata();
        const registeredFactory = {
            factory,
            metadata,
            registeredAt: new Date()
        };
        this.factories.set(commandType, registeredFactory);
        this.metadata.set(commandType, metadata);
    }
    /**
     * Unregister a command handler
     */
    unregister(commandType) {
        const handlerRemoved = this.handlers.delete(commandType);
        const factoryRemoved = this.factories.delete(commandType);
        const metadataRemoved = this.metadata.delete(commandType);
        return handlerRemoved || factoryRemoved || metadataRemoved;
    }
    /**
     * Get a command handler
     */
    getHandler(commandType) {
        const registered = this.handlers.get(commandType);
        return registered?.handler;
    }
    /**
     * Get a command handler factory
     */
    getFactory(commandType) {
        const registered = this.factories.get(commandType);
        return registered?.factory;
    }
    /**
     * Create a handler using a factory
     */
    createHandler(commandType) {
        const factory = this.getFactory(commandType);
        return factory?.create();
    }
    /**
     * Check if a handler is registered for a command type
     */
    hasHandler(commandType) {
        return this.handlers.has(commandType);
    }
    /**
     * Check if a factory is registered for a command type
     */
    hasFactory(commandType) {
        return this.factories.has(commandType);
    }
    /**
     * Check if either a handler or factory is registered for a command type
     */
    has(commandType) {
        return this.hasHandler(commandType) || this.hasFactory(commandType);
    }
    /**
     * Get metadata for a registered handler or factory
     */
    getMetadata(commandType) {
        return this.metadata.get(commandType);
    }
    /**
     * Get all registered command types
     */
    getCommandTypes() {
        const types = new Set();
        for (const commandType of this.handlers.keys()) {
            types.add(commandType);
        }
        for (const commandType of this.factories.keys()) {
            types.add(commandType);
        }
        return Array.from(types);
    }
    /**
     * Get all registered handlers
     */
    getHandlers() {
        return new Map(this.handlers);
    }
    /**
     * Get all registered factories
     */
    getFactories() {
        return new Map(this.factories);
    }
    /**
     * Find handlers by category
     */
    findByCategory(category) {
        const results = [];
        for (const [commandType, metadata] of this.metadata) {
            if ('category' in metadata && metadata.category === category) {
                results.push(commandType);
            }
        }
        return results;
    }
    /**
     * Find handlers by tags
     */
    findByTag(tag) {
        const results = [];
        for (const [commandType, metadata] of this.metadata) {
            if ('tags' in metadata && metadata.tags?.includes(tag)) {
                results.push(commandType);
            }
        }
        return results;
    }
    /**
     * Find handlers by multiple tags (all tags must be present)
     */
    findByTags(tags) {
        const results = [];
        for (const [commandType, metadata] of this.metadata) {
            if ('tags' in metadata && metadata.tags) {
                const hasAllTags = tags.every(tag => metadata.tags.includes(tag));
                if (hasAllTags) {
                    results.push(commandType);
                }
            }
        }
        return results;
    }
    /**
     * Search handlers by name or description
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const [commandType, metadata] of this.metadata) {
            const nameMatch = metadata.name.toLowerCase().includes(lowerQuery);
            const descMatch = metadata.description?.toLowerCase().includes(lowerQuery);
            if (nameMatch || descMatch) {
                results.push(commandType);
            }
        }
        return results;
    }
    /**
     * Get registry statistics
     */
    getStats() {
        const categories = new Map();
        const tags = new Map();
        for (const metadata of this.metadata.values()) {
            // Count categories
            if ('category' in metadata && metadata.category) {
                const count = categories.get(metadata.category) || 0;
                categories.set(metadata.category, count + 1);
            }
            // Count tags
            if ('tags' in metadata && metadata.tags) {
                for (const tag of metadata.tags) {
                    const count = tags.get(tag) || 0;
                    tags.set(tag, count + 1);
                }
            }
        }
        return {
            totalHandlers: this.handlers.size,
            totalFactories: this.factories.size,
            totalCommands: this.getCommandTypes().length,
            categories: Object.fromEntries(categories),
            tags: Object.fromEntries(tags),
            registeredAt: this.getRegistrationTimes()
        };
    }
    /**
     * Clear all registered handlers and factories
     */
    clear() {
        this.handlers.clear();
        this.factories.clear();
        this.metadata.clear();
    }
    /**
     * Get registration times for all registered items
     */
    getRegistrationTimes() {
        const times = {};
        for (const [commandType, handler] of this.handlers) {
            times[handler];
            $;
            {
                commandType;
            }
            handler.registeredAt;
        }
        for (const [commandType, factory] of this.factories) {
            `
      times[factory:${commandType}`;
            factory.registeredAt;
        }
        return times;
    }
    /**
     * Validate registry state
     */
    validate() {
        const errors = [];
        const warnings = [];
        // Check for orphaned metadata
        for (const commandType of this.metadata.keys()) {
            if (!this.has(commandType)) {
                warnings.push(Orphaned, metadata, found);
                for (command; type; )
                    : $;
                {
                    commandType;
                }
                ;
            }
        }
        // Check for duplicate registrations
        const handlerTypes = Array.from(this.handlers.keys());
        const factoryTypes = Array.from(this.factories.keys());
        const duplicates = handlerTypes.filter(type => factoryTypes.includes(type));
        `
    `;
        if (duplicates.length > 0) {
            warnings.push(Command, types);
            with (both)
                handlers;
            and;
            factories: $;
            {
                duplicates.join(', ');
            }
            `);
    }
    
    // Validate handler metadata
    for (const [commandType, registered] of this.handlers) {
      const metadata = registered.metadata;
      
      if (!metadata.name) {
        errors.push(Handler for ${commandType} missing name in metadata);
      }` `
      if (!metadata.version) {
        warnings.push(Handler for ${commandType} missing version in metadata`;
            ;
        }
        if (!metadata.commandTypes || metadata.commandTypes.length === 0) {
            warnings.push(Handler);
            for ($; { commandType }; has)
                no;
            command;
            types;
            specified;
            ;
        }
    }
    // Validate factory metadata
    for(, [commandType, registered], of, factories) {
        const metadata = registered.metadata;
        `
      `;
        if (!metadata.name) {
            errors.push(Factory);
            for ($; { commandType } ` missing name in metadata);
      }
      
      if (!metadata.version) {
        warnings.push(Factory for ${commandType} missing version in metadata`;)
                ;
        }
        if (!metadata.commandTypes || metadata.commandTypes.length === 0) {
            warnings.push(Factory);
            for ($; { commandType }; has)
                no;
            command;
            types;
            specified `);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Registered handler information
 */
export interface RegisteredHandler {
  readonly handler: ICommandHandler;
  readonly metadata: HandlerMetadata;
  readonly registeredAt: Date;
}

/**
 * Registered factory information
 */
export interface RegisteredFactory {
  readonly factory: ICommandHandlerFactory;
  readonly metadata: FactoryMetadata;
  readonly registeredAt: Date;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  readonly totalHandlers: number;
  readonly totalFactories: number;
  readonly totalCommands: number;
  readonly categories: Record<string, number>;
  readonly tags: Record<string, number>;
  readonly registeredAt: Record<string, Date>;
}

/**
 * Registry validation result
 */
export interface RegistryValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
};
        }
    }
}
exports.CommandRegistry = CommandRegistry;
//# sourceMappingURL=command-registry.js.map
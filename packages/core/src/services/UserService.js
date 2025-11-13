"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const LoggingService_1 = require("./LoggingService");
const MetricsService_1 = require("./MetricsService");
let UserService = class UserService {
    loggingService;
    metricsService;
    eventEmitter;
    users = new Map();
    usernameIndex = new Map();
    emailIndex = new Map();
    constructor(loggingService, metricsService, eventEmitter) {
        this.loggingService = loggingService;
        this.metricsService = metricsService;
        this.eventEmitter = eventEmitter;
        this.initializeDefaultUsers();
    }
    initializeDefaultUsers() {
        // Create default admin user if none exists
        const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@agency.local';
        const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
        if (!this.emailIndex.has(defaultAdminEmail)) {
            this.createUser({
                username: 'admin',
                email: defaultAdminEmail,
                password: defaultAdminPassword,
                role: 'admin',
                profile: {
                    firstName: 'System',
                    lastName: 'Administrator',
                },
            }).catch(error => {
                this.loggingService.error('Failed to create default admin user', error);
            });
        }
    }
    async createUser(createUserDto) {
        const { username, email, password, role = 'user', profile, preferences } = createUserDto;
        // Validate uniqueness
        if (this.usernameIndex.has(username)) {
            throw new common_1.ConflictException(`Username ${username} already exists);
    }
    if (this.emailIndex.has(email)) {`);
            throw new common_1.ConflictException(`Email ${email}`, already, exists);
        }
        // Hash password (in a real implementation, use bcrypt or similar)
        const passwordHash = await this.hashPassword(password);
        const user = {
            id: this.generateId(),
            username,
            email,
            passwordHash,
            role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            profile: this.mergeProfile(profile),
            preferences: this.mergePreferences(preferences),
        };
        // Store user
        this.users.set(user.id, user);
        this.usernameIndex.set(username, user.id);
        this.emailIndex.set(email, user.id);
        // Record metrics
        this.metricsService.incrementCounter('users.created', 1, { labels: { role } });
        // Log activity
        this.loggingService.log(user_types_1.User, created, $, { username }($, { email }), 'UserService');
        // Emit event
        this.eventEmitter.emit('user.created', {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
        return this.sanitizeUser(user);
    }
    async updateUser(id, updateUserDto) {
        const user = this.users.get(id);
        if (!user) {
            `
      throw new NotFoundException(User with ID ${id}`;
            not;
            found;
            ;
        }
        const { username, email, password, role, isActive, profile, preferences } = updateUserDto;
        // Handle username change
        if (username && username !== user.username) {
            if (this.usernameIndex.has(username)) {
                throw new common_1.ConflictException(Username, $, { username }, already, exists `);
      }
      this.usernameIndex.delete(user.username);
      this.usernameIndex.set(username, user.id);
      user.username = username;
    }

    // Handle email change
    if (email && email !== user.email) {
      if (this.emailIndex.has(email)) {
        throw new ConflictException(Email ${email} already exists);
      }
      this.emailIndex.delete(user.email);
      this.emailIndex.set(email, user.id);
      user.email = email;
    }

    // Handle password change
    if (password) {
      user.passwordHash = await this.hashPassword(password);
    }

    // Update other fields
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (profile) user.profile = this.mergeProfile(profile, user.profile);
    if (preferences) user.preferences = this.mergePreferences(preferences, user.preferences);

    user.updatedAt = new Date();

    // Record metrics
    this.metricsService.incrementCounter('users.updated', 1, { labels: { role: user.role } });
`
                // Log activity`
                , 
                // Log activity`
                this.loggingService.log(`User updated: ${user.username}, 'UserService');

    // Emit event
    this.eventEmitter.emit('user.updated', {
      userId: user.id,
      username: user.username,
      changes: Object.keys(updateUserDto),
    });

    return this.sanitizeUser(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) {`));
                throw new common_1.NotFoundException(user_types_1.User);
                with (ID)
                    $;
                {
                    id;
                }
                not;
                found `);
    }

    // Remove from indexes
    this.usernameIndex.delete(user.username);
    this.emailIndex.delete(user.email);

    // Remove user
    this.users.delete(id);

    // Record metrics
    this.metricsService.incrementCounter('users.deleted', 1, { labels: { role: user.role } });

    // Log activity
    this.loggingService.log(User deleted: ${user.username}`, 'UserService';
                ;
                // Emit event
                this.eventEmitter.emit('user.deleted', {
                    userId: id,
                    username: user.username,
                    email: user.email,
                });
            }
            async;
            findById(id, string);
            Promise < user_types_1.SafeUser | null > {
                const: user = this.users.get(id),
                return: user ? this.sanitizeUser(user) : null
            };
            async;
            findByUsername(username, string);
            Promise < user_types_1.SafeUser | null > {
                const: userId = this.usernameIndex.get(username),
                if(, userId) { }, return: null,
                const: user = this.users.get(userId),
                return: user ? this.sanitizeUser(user) : null
            };
            async;
            findByEmail(email, string);
            Promise < user_types_1.SafeUser | null > {
                const: userId = this.emailIndex.get(email),
                if(, userId) { }, return: null,
                const: user = this.users.get(userId),
                return: user ? this.sanitizeUser(user) : null
            };
            async;
            findAll(filter ?  : UserFilter);
            Promise < user_types_1.SafeUser[] > {
                let, users = Array.from(this.users.values()),
                if(filter) {
                    if (filter.role) {
                        users = users.filter(user => user.role === filter.role);
                    }
                    if (filter.isActive !== undefined) {
                        users = users.filter(user => user.isActive === filter.isActive);
                    }
                    if (filter.search) {
                        const searchLower = filter.search.toLowerCase();
                        users = users.filter(user => user.username.toLowerCase().includes(searchLower) ||
                            user.email.toLowerCase().includes(searchLower) ||
                            (user.profile?.firstName && user.profile.firstName.toLowerCase().includes(searchLower)) ||
                            (user.profile?.lastName && user.profile.lastName.toLowerCase().includes(searchLower)));
                    }
                    if (filter.createdAfter) {
                        users = users.filter(user => user.createdAt >= filter.createdAfter);
                    }
                    if (filter.createdBefore) {
                        users = users.filter(user => user.createdAt <= filter.createdBefore);
                    }
                },
                return: users.map(user => this.sanitizeUser(user))
            };
            async;
            validateUserCredentials(username, string, password, string);
            Promise < user_types_1.SafeUser | null > {
                // Get userId from username index
                const: userId = this.usernameIndex.get(username),
                if(, userId) {
                    this.metricsService.incrementCounter('users.login_failed', 1, { labels: { reason: 'user_not_found' } });
                    return null;
                }
                // Get full user (with passwordHash) from internal map
                ,
                // Get full user (with passwordHash) from internal map
                const: fullUser = this.users.get(userId),
                if(, fullUser) {
                    this.metricsService.incrementCounter('users.login_failed', 1, { labels: { reason: 'user_not_found' } });
                    return null;
                },
                if(, fullUser) { }, : .isActive
            };
            {
                this.metricsService.incrementCounter('users.login_failed', 1, { labels: { reason: 'inactive_user' } });
                throw new common_1.UnauthorizedException('User account is inactive');
            }
            const isValid = await this.verifyPassword(password, fullUser.passwordHash);
            if (!isValid) {
                this.metricsService.incrementCounter('users.login_failed', 1, { labels: { reason: 'invalid_password' } });
                return null;
            }
            // Update last login
            fullUser.lastLoginAt = new Date();
            fullUser.updatedAt = new Date();
            // Record metrics
            this.metricsService.incrementCounter('users.login_success', 1, { labels: { role: fullUser.role } });
            // Log activity
            this.loggingService.log(user_types_1.User, login, $, { username }, 'UserService');
            // Emit event
            this.eventEmitter.emit('user.login', {
                userId: fullUser.id,
                username: fullUser.username,
                timestamp: new Date(),
            });
            return this.sanitizeUser(fullUser);
        }
        async;
        changePassword(userId, string, currentPassword, string, newPassword, string);
        Promise < void  > {
            const: user = this.users.get(userId),
            if(, user) {
                `
      throw new NotFoundException(User with ID ${userId}` ` not found);
    }

    const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      this.metricsService.incrementCounter('users.password_change_failed', 1, { labels: { reason: 'invalid_current_password');
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await this.hashPassword(newPassword);
    user.updatedAt = new Date();

    // Record metrics
    this.metricsService.incrementCounter('users.password_changed', 1, { labels: { role: user.role } });

    // Log activity
    this.loggingService.log(Password changed for user: ${user.username}, 'UserService');

    // Emit event
    this.eventEmitter.emit('user.password_changed', {
      userId: user.id,
      username: user.username,
      timestamp: new Date(),
    });
  }

  getUserStats(): UserStats {
    const users = Array.from(this.users.values());
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: UserStats = {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.isActive).length,
      newUsersThisMonth: users.filter(user => user.createdAt >= startOfMonth).length,
      usersByRole: {},
    };

    // Count users by role
    users.forEach(user => {
      stats.usersByRole[user.role] = (stats.usersByRole[user.role] || 0) + 1;
    });

    return stats;
  }

  // Helper methods
  private generateId(): string {`;
                return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` `;
  }

  private async hashPassword(password: string): Promise<string> {
    // In a real implementation, use bcrypt or similar
    // This is a placeholder implementation
    return Buffer.from(password).toString('base64');
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // In a real implementation, use bcrypt or similar
    // This is a placeholder implementation
    return Buffer.from(password).toString('base64') === hash;
  }

  private mergeProfile(newProfile?: Partial<UserProfile>, existingProfile?: UserProfile): UserProfile {
    return {
      firstName: newProfile?.firstName ?? existingProfile?.firstName,
      lastName: newProfile?.lastName ?? existingProfile?.lastName,
      avatar: newProfile?.avatar ?? existingProfile?.avatar,
      bio: newProfile?.bio ?? existingProfile?.bio,
      phone: newProfile?.phone ?? existingProfile?.phone,
      timezone: newProfile?.timezone ?? existingProfile?.timezone ?? 'UTC',
      language: newProfile?.language ?? existingProfile?.language ?? 'en',
    };
  }

  private mergePreferences(newPreferences?: Partial<UserPreferences>, existingPreferences?: UserPreferences): UserPreferences {
    return {
      theme: newPreferences?.theme ?? existingPreferences?.theme ?? 'auto',
      notifications: {
        email: newPreferences?.notifications?.email ?? existingPreferences?.notifications?.email ?? true,
        push: newPreferences?.notifications?.push ?? existingPreferences?.notifications?.push ?? true,
        sms: newPreferences?.notifications?.sms ?? existingPreferences?.notifications?.sms ?? false,
      },
      privacy: {
        profileVisible: newPreferences?.privacy?.profileVisible ?? existingPreferences?.privacy?.profileVisible ?? true,
        activityVisible: newPreferences?.privacy?.activityVisible ?? existingPreferences?.privacy?.activityVisible ?? true,
      },
      dashboard: {
        widgets: newPreferences?.dashboard?.widgets ?? existingPreferences?.dashboard?.widgets ?? [],
        layout: newPreferences?.dashboard?.layout ?? existingPreferences?.dashboard?.layout ?? 'grid',
      },
    };
  }

  private sanitizeUser(user: User): SafeUser {
    // Remove password hash from returned user object
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}

export default UserService;;
            }
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService,
        event_emitter_1.EventEmitter2])
], UserService);
//# sourceMappingURL=UserService.js.map
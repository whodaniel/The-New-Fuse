import { getCustomRepository } from 'typeorm';
import { UserRepository } from '../database/repositories/UserRepository.js';
import { SessionRepository } from '../database/repositories/SessionRepository.js';
import { User } from '../database/entities/User.js';
import { Session } from '../database/entities/Session.js';
import * as bcrypt from 'bcrypt';
import { validate } from 'class-validator';
import { sessionManager } from '@your-org/security';
import { DatabaseService } from '../database.js';
import { Logger } from '../logging.js';
import { UserCreateDTO, UserUpdateDTO } from '../types.js';

export class UserService {
    private userRepository: UserRepository;
    private sessionRepository: SessionRepository;

    constructor(
        private readonly db: DatabaseService,
        private readonly logger: Logger
    ) {
        this.userRepository = getCustomRepository(UserRepository);
    }

    async createUser(data: {
        username: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<User> {
        // Validate unique constraints
        const existingUser = await this.userRepository.findOne({
            where: [
                { username: data.username },
                { email: data.email }
            ]
        });

        if(existingUser) {
            throw new Error('Username or email already exists');
        }

        return await this.userRepository.createUser(data);
    }

    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        const user = await this.userRepository.findByEmail(email);

        if(!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await user.validatePassword(password);
        if(!isValid) {
            throw new Error('Invalid credentials');
        }

        const session = await this.sessionRepository.createSession(user.id);
        return { user, token: session.token };
    }

    async getUserProfile(userId: string): Promise<User> {
        return this.userRepository.findOneOrFail({ where: { id: userId } });
    }

    async updateUserProfile(
        userId: string,
        data: Partial<Pick<User, 'username' | 'email'>>
    ): Promise<User> {
        if (data.username || data.email) {
            const existingUser = await this.userRepository.findOne({
                where: [
                    { username: data.username },
                    { email: data.email }
                ]
            });

            if (existingUser) {
                throw new Error('Username or email already exists');
            }
        }

        await this.userRepository.update({ id: userId }, data);
        return this.userRepository.findOneOrFail({ where: { id: userId } });
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<boolean> {
        const user = await this.userRepository.findOneOrFail({
            where: { id: userId }
        });

        const isValid = await user.validatePassword(currentPassword);
        if(!isValid) {
            throw new Error('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.setUserPassword(userId, hashedPassword);
        return true;
    }

    async invalidateAllUserSessions(userId: string): Promise<boolean> {
        await this.sessionRepository.invalidateUserSessions(userId);
        return true;
    }

    async getUserSessions(userId: string): Promise<Session[]> {
        return await sessionManager.getUserSessions(userId);
    }

    async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
        await sessionManager.revokeAllUserSessions(userId, exceptSessionId);
    }

    async updateUserLastActive(userId: string): Promise<void> {
        try {
            await this.db.users.update({
                where: { id: userId },
                data: { lastActiveAt: new Date() }
            });
        } catch (error) {
            this.logger.error('Failed to update user last active:', error);
        }
    }

    async invalidateSession(token: string): Promise<boolean> {
        return this.sessionRepository.invalidateSession(token);
    }

    async invalidateUserSessions(userId: string): Promise<boolean> {
        return this.sessionRepository.invalidateUserSessions(userId);
    }

    async findUserByUsername(username: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { username } });
    }

    async findUserById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async setUserPassword(userId: string, hashedPassword: string): Promise<void> {
        await this.userRepository.update({ id: userId }, { hashPassword: hashedPassword });
    }
}

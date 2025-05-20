import { EntityRepository, MoreThan, LessThan } from 'typeorm';
import { BaseRepository } from './BaseRepository.js';
import { Session } from '../entities/Session.js';

@EntityRepository(Session)
export class SessionRepository extends BaseRepository<Session> {
    async createSession(userId: string, expiresIn: number = 24 * 60 * 60 * 1000): Promise<Session> {
        const session = new Session();
        session.userId = userId;
        session.expiresAt = new Date(Date.now() + expiresIn);
        return this.save(session);
    }

    async findValidSession(token: string): Promise<Session | undefined> {
        return this.findOne({
            where: {
                token,
                expiresAt: MoreThan(new Date())
            }
        });
    }

    async invalidateUserSessions(userId: string): Promise<boolean> {
        const result = await this.update(
            { userId },
            { expiresAt: new Date() }
        );
        return result.affected > 0;
    }

    async cleanExpiredSessions(): Promise<number> {
        const result = await this.delete({
            expiresAt: LessThan(new Date())
        });
        return result.affected || 0;
    }

    async getUserSessions(userId: string): Promise<Session[]> {
        return this.find({
            where: {
                userId,
                expiresAt: MoreThan(new Date())
            },
            order: {
                createdAt: 'DESC'
            }
        });
    }
}

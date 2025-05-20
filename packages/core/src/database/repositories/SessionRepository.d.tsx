import { BaseRepository } from './BaseRepository.js';
import { Session } from '../entities/Session.js';
export declare class SessionRepository extends BaseRepository<Session> {
    createSession(): Promise<void>;
}

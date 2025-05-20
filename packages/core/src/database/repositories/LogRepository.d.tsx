import { BaseRepository } from './BaseRepository.js';
import { Log } from '../entities/Log.js';
export declare class LogRepository extends BaseRepository<Log> {
    createLog(): Promise<void>;
}

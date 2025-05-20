import { Repository } from 'typeorm';
import { TaskComment } from '../entities/TaskComment.js';
import { TaskActivityService } from './TaskActivityService.js';
import { NotificationService } from '../../notification/NotificationService.js';
import { MentionParser } from '../../shared/utils/MentionParser.js';
export declare class TaskCommentService {
    private commentRepository;
    private taskActivityService;
    private notificationService;
    private mentionParser;
    constructor(commentRepository: Repository<TaskComment>, taskActivityService: TaskActivityService, notificationService: NotificationService, mentionParser: MentionParser);
    createComment(): Promise<void>;
}

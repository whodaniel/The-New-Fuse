import { OnModuleInit } from '@nestjs/common';
import { LearningSystem } from './LearningSystem.js';
export declare class LearningModule implements OnModuleInit {
    private readonly learningSystem;
    constructor(learningSystem: LearningSystem);
    onModuleInit(): Promise<void>;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const User_1 = require("../entities/User");
const Agent_1 = require("../entities/Agent");
const Pipeline_1 = require("../entities/Pipeline");
const Task_1 = require("../entities/Task");
const TaskExecution_1 = require("../entities/TaskExecution");
const AuthSession_1 = require("../entities/AuthSession");
const LoginAttempt_1 = require("../entities/LoginAttempt");
const AuthEvent_1 = require("../entities/AuthEvent");
const getDatabaseConfig = (configService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', 'the_new_fuse'),
    entities: [
        User_1.User,
        Agent_1.Agent,
        Pipeline_1.Pipeline,
        Task_1.Task,
        TaskExecution_1.TaskExecution,
        AuthSession_1.AuthSession,
        LoginAttempt_1.LoginAttempt,
        AuthEvent_1.AuthEvent
    ],
    synchronize: configService.get('NODE_ENV') === 'development', // Only for development
    logging: configService.get('NODE_ENV') === 'development',
});
exports.getDatabaseConfig = getDatabaseConfig;

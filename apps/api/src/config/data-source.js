"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const dotenv_1 = require("dotenv");
const User_1 = require("../entities/User");
(0, dotenv_1.config)();
const configService = new config_1.ConfigService();
const databaseUrl = configService.get('DATABASE_URL', 'postgresql://postgres:postgres@postgres:5432/fuse');
const [, , credentials, hostPort, database] = databaseUrl.match(/^postgresql:\/\/(.*):(.*)@(.*?)\/(.*)$/);
const [host, port] = hostPort.split(':');
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host,
    port: parseInt(port, 10),
    username: 'postgres',
    password: 'postgres',
    database,
    entities: [User_1.User],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: configService.get('NODE_ENV') === 'development',
});

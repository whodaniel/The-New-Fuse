"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const config_1 = require("./config");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: config_1.config.database.host,
    port: config_1.config.database.port,
    username: config_1.config.database.username,
    password: config_1.config.database.password,
    database: config_1.config.database.name,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
    entities: [User_1.User],
    migrations: [],
    subscribers: [],
});

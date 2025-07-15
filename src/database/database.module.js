var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseService } from './database.service.tsx';
const getDatabaseConfig = () => ({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "thefuse",
    entities: [__dirname + "/../**/*.entity{.ts,.js}"],
    synchronize: process.env.NODE_ENV !== "production",
});
let DatabaseModule = class DatabaseModule {
};
DatabaseModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forRoot(getDatabaseConfig())
        ],
        providers: [DatabaseService],
        exports: [DatabaseService]
    })
], DatabaseModule);
export { DatabaseModule };

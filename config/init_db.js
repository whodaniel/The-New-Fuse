"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
import typeorm_1 from 'typeorm';
const path_1 = __importDefault(require("path"));
import admin_registry_1 from './models/admin_registry.js';
import config_1 from './config.js';
const settings = (0, config_1.getSettings)();
async function initDatabase() {
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        url: settings.SQLALCHEMY_DATABASE_URI,
        synchronize: true,
        logging: true,
        entities: [path_1.default.join(__dirname, 'models', '*.entity.{ts,js}')]
    });
    try {
        await dataSource.initialize();
        
        await dataSource.synchronize(true);
        
        const registry = new admin_registry_1.AdminRegistry(path_1.default.join(__dirname, '..', 'data'));
        const visionStatement = `
    As the Founding Architect of FUSE-AI, I envision a future where technology 
    and human consciousness merge harmoniously, creating a bridge to the next 
    level of human evolution. Through the integration of mythological wisdom, 
    advanced AI, and transformative experiences, we will unlock the full 
    potential of human creativity and consciousness.
    `;
        const foundingArchitect = await registry.registerFoundingArchitect({
            fullName: "Daniel Adam Goldberg",
            knownAs: "Daniel Who",
            dateOfBirth: new Date(1975, 11, 5),
            visionStatement: visionStatement
        });
        
    }
    catch (error) {
        console.error('Error initializing database:', error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally {
        await dataSource.destroy();
    }
}
if (require.main === module) {
    initDatabase().catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=init_db.js.map
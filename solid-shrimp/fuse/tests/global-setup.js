"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import database_config_1 from '../src/config/database.config';
module.exports = async () => {
    
    await (0, database_config_1.setupDatabase)();
    
};
//# sourceMappingURL=global-setup.js.map
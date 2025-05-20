/**
 * Base configuration for the AI Communication System.
 */
import * as path from 'path';
import * as crypto from 'crypto';

export class BaseConfig {
    /**
     * Base configuration class with common settings.
     */
    
    // Project paths
    static PROJECT_ROOT: string = path.resolve(__dirname, '..', '..');
    static SRC_DIR: string = path.join(this.PROJECT_ROOT, 'src');
    
    // Service endpoints
    static AGENCY_HUB_PORT: number = parseInt(process.env.AGENCY_HUB_PORT || '8000', 10);
    static CASCADE_BRIDGE_PORT: number = parseInt(process.env.CASCADE_BRIDGE_PORT || '8001', 10);
    static CLINE_BRIDGE_PORT: number = parseInt(process.env.CLINE_BRIDGE_PORT || '8002', 10);
    
    // Redis configuration
    static REDIS_HOST: string = process.env.REDIS_HOST || 'localhost';
    static REDIS_PORT: number = parseInt(process.env.REDIS_PORT || '6379', 10);
    static REDIS_DB: number = parseInt(process.env.REDIS_DB || '0', 10);
    static REDIS_PASSWORD: string | undefined = process.env.REDIS_PASSWORD;
    
    // Logging configuration
    static LOG_LEVEL: string = process.env.LOG_LEVEL || 'INFO';
    static LOG_FORMAT: string = '%(asctime)s - %(name)s - %(levelname)s - %(message)s';
    
    // Security
    static SECRET_KEY: string = process.env.SECRET_KEY || crypto.randomBytes(32).toString('hex');
    
    /**
     * Return configuration as a dictionary.
     */
    static asDict(): { [key: string]: any } {
        return Object.entries(this)
            .filter(([key, value]) => !key.startsWith('_') && key.toUpperCase() === key)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    }
}

import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { DirectCommunication, AgentRole } from '../communication/directCommunication.js';

const logger: Logger = getLogger('cline_instance');

async function main(): Promise<void> {
    try {
        // Initialize Cline instance
        const cline = new DirectCommunication(
            'cline_ai',
            'cascade_ai',
            AgentRole.OPTIMIZATION
        );

        if (await cline.initialize()) {
            // Wait for Cascade's introduction
            logger.info("Cline initialized, waiting for Cascade's introduction...");
            
            // Add additional initialization code here
            
            // Keep the process running until shutdown
            await new Promise(resolve => {
                // This promise intentionally never resolves
                // It will be interrupted by SIGINT/SIGTERM handlers
            });
        }
    } catch (e: unknown) {
        if (e instanceof Error && e.name === 'SIGINT') {
            logger.info('Shutting down gracefully');
        } else {
            logger.error(`Error in main: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
}

// Handle process termination
process.on('SIGINT', () => {
    logger.info('Received SIGINT. Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM. Shutting down...');
    process.exit(0);
});

// Start the application
(() => {
    main().catch(e => {
        logger.error(`Unhandled error in main: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
    });
})();

export {};

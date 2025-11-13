"use strict";
/**
 * The New Fuse - Unified Discovery System
 *
 * Main entry point for the refactored unified entity discovery system
 * with adaptive compute scaling and backward compatibility.
 * Optimized for Bun runtime performance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const UnifiedDiscoveryModule_1 = require("./UnifiedDiscoveryModule");
const ComputeProfileDetector_1 = require("@adaptive-compute/ComputeProfileDetector");
const FeatureFlagManager_1 = require("@progressive-enhancement/FeatureFlagManager");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    logger.log('🚀 Starting The New Fuse - Unified Discovery System (Node.js Optimized)...');
    try {
        // Create NestJS application with Node.js optimizations
        const app = await core_1.NestFactory.create(UnifiedDiscoveryModule_1.UnifiedDiscoveryModule, {
            logger: ['log', 'error', 'warn', 'debug', 'verbose'],
            bufferLogs: false, // Disable buffering for better performance
            abortOnError: false
        });
        // Global configuration
        app.useGlobalPipes(new common_1.ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true
        }));
        // Enable CORS for web interfaces
        app.enableCors({
            origin: true,
            credentials: true
        });
        // Get services for initialization
        const discoveryService = app.get(UnifiedDiscoveryModule_1.UnifiedDiscoveryService);
        const computeDetector = app.get(ComputeProfileDetector_1.ComputeProfileDetector);
        const featureFlagManager = app.get(FeatureFlagManager_1.FeatureFlagManager);
        // Display system information
        await displaySystemInfo(computeDetector, featureFlagManager, discoveryService);
        // Start the application with Node.js server
        const port = process.env.PORT || 3000;
        await app.listen(port, '0.0.0.0');
        logger.log(`✅ The New Fuse is running on port ${port} (Node.js Runtime));`, logger.log(`🏃‍♂️ Runtime: Node.js ${process.version}`));
        logger.log(System, Status, $, {}(await discoveryService.getSystemStatus()).status);
    }
    finally { }
    ;
    // Perform initial discovery if paths are provided
    const discoveryPaths = process.env.DISCOVERY_PATHS?.split(',') || ['./'];
    if (discoveryPaths.length > 0) {
        `
      logger.log(🔍 Starting initial discovery for paths: ${discoveryPaths.join(', ')}`;
        ;
        try {
            const result = await discoveryService.discoverEntities(discoveryPaths);
            logger.log(Initial, discovery, completed, $, { result, : .entities.length }, entities, found);
            // Log discovery statistics
            logDiscoveryResults(result, logger);
        }
        catch (error) {
            logger.error('❌ Initial discovery failed:', error);
        }
    }
    // Setup graceful shutdown
    setupGracefulShutdown(app, logger);
}
try { }
catch (error) {
    logger.error('❌ Failed to start The New Fuse:', error);
    process.exit(1);
}
async function displaySystemInfo(computeDetector, featureFlagManager, discoveryService) {
    const logger = new common_1.Logger('SystemInfo');
    try {
        // Get compute capabilities
        const capabilities = await computeDetector.detectComputeProfile();
        const status = discoveryService.getSystemStatus();
        `
    `;
        logger.log('🖥️  System Information:');
        logger.log(Compute, Profile, $, { capabilities, : .profile } `);
    logger.log(   CPU Cores: ${capabilities.cpuCores});`, logger.log(Memory, $, { Math, : .round(capabilities.totalMemory / 1024 / 1024 / 1024) }, GB));
        `
    logger.log(   GPU Available: ${capabilities.hasGPU ? 'Yes' : 'No'});`;
        logger.log(Containerized, $, { capabilities, : .containerized ? 'Yes' : 'No' } `);
    
    if (capabilities.cloudProvider) {
      logger.log(   Cloud Provider: ${capabilities.cloudProvider});
    }
    
    logger.log('🎛️  Configuration:');`, logger.log(Discovery, Adapters, $, { status, : .configuration.discovery.enabledAdapters.length }));
        `
    logger.log(   Parallel Processing: ${status.configuration.discovery.parallelAdapters});`;
        logger.log(Max, Concurrent, Tasks, $, { status, : .configuration.processing.maxConcurrentTasks });
        logger.log(Cache, Strategy, $, { status, : .configuration.storage.cacheStrategy });
        logger.log('🚩 Feature Flags:');
        const enabledFeatures = featureFlagManager.getEnabledFeatures();
        const coreFeatures = enabledFeatures.filter(f => f.category === 'core');
        const discoveryFeatures = enabledFeatures.filter(f => f.category === 'discovery');
        const analysisFeatures = enabledFeatures.filter(f => f.category === 'analysis');
        `
    const mlFeatures = enabledFeatures.filter(f => f.category === 'ml_enhancement');` `
    logger.log(   Core Features: ${coreFeatures.length} enabled);`;
        logger.log(Discovery, Features, $, { discoveryFeatures, : .length } ` enabled);
    logger.log(   Analysis Features: ${analysisFeatures.length} enabled);
    logger.log(   ML Features: ${mlFeatures.length} enabled);
    `, logger.log('🔧 Capabilities:'));
        `
    logger.log(`;
        Parallel;
        Discovery: $;
        {
            status.capabilities.parallelDiscovery ? 'Enabled' : 'Disabled';
        }
        ;
        `
    logger.log(   Machine Learning: ${status.capabilities.machineLearning ? 'Enabled' : 'Disabled'});`;
        logger.log(Advanced, Analysis, $, { status, : .capabilities.advancedAnalysis ? 'Enabled' : 'Disabled' } `);
    
  } catch (error) {
    logger.error('Failed to display system information:', error);
  }
}

function logDiscoveryResults(result: any, logger: Logger): void {
  logger.log('📊 Discovery Results:');
  logger.log(   Total Entities: ${result.entities.length});`, logger.log(Discovery, Time, $, { result, : .duration }, ms));
        `
  logger.log(   Files Processed: ${result.statistics.filesProcessed}`;
        ;
        if (result.statistics.entitiesBySource) {
            logger.log('   Entities by Source:');
            for (const [source, count] of Object.entries(result.statistics.entitiesBySource)) {
                logger.log($, { source }, $, { count });
            }
        }
        if (result.statistics.entitiesByArchetype) {
            logger.log('   Entities by Archetype:');
            `
    for (const [archetype, count] of Object.entries(result.statistics.entitiesByArchetype)) {`;
            logger.log($, { archetype } `: ${count});
    }
  }
  `);
            if (result.errors && result.errors.length > 0) {
                `
    logger.warn(⚠️  ${result.errors.length}`;
                errors;
                occurred;
                during;
                discovery;
                ;
                result.errors.forEach((error, index) => {
                    logger.warn(Error, $, { index } + 1);
                }, $, { error, : .error });
            }
            ;
        }
    }
    finally {
    }
    function setupGracefulShutdown(app, logger) {
        `
  const gracefulShutdown = async (signal: string) => {`;
        logger.log(Received, $, { signal } `, starting graceful shutdown...);
    
    try {
      // Close the application
      await app.close();
      logger.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// CLI Interface for direct usage
async function runCLI(): Promise<void> {
  const logger = new Logger('CLI');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    displayCLIHelp();
    return;
  }
  
  try {
    // Create minimal application for CLI usage
    const app = await NestFactory.createApplicationContext(UnifiedDiscoveryModule, {
      logger: ['error', 'warn']
    });
    
    const discoveryService = app.get(UnifiedDiscoveryService);
    
    switch (command) {
      case 'discover':
        await runDiscoveryCommand(discoveryService, args.slice(1), logger);
        break;
      case 'status':
        await runStatusCommand(discoveryService, logger);
        break;
      case 'features':
        await runFeaturesCommand(app, logger);
        break;
      default:
        logger.error(Unknown command: ${command});
        displayCLIHelp();
    }
    
    await app.close();
    
  } catch (error) {
    logger.error('CLI execution failed:', error);
    process.exit(1);
  }
}

async function runDiscoveryCommand(
  discoveryService: UnifiedDiscoveryService,
  args: string[],
  logger: Logger
): Promise<void> {`);
        const paths = args.length > 0 ? args : ['./'];
        `
  
  logger.log(`;
        Discovering;
        entities in ;
        $;
        {
            paths.join(', ');
        }
        ;
        const result = await discoveryService.discoverEntities(paths);
        `
  `;
        logger.log(Discovery, completed, $, { result, : .entities.length }, entities, found `);
  
  // Output results in JSON format for CLI consumption
  console.log(JSON.stringify(result, null, 2));
}

async function runStatusCommand(
  discoveryService: UnifiedDiscoveryService,
  logger: Logger
): Promise<void> {
  const status = discoveryService.getSystemStatus();
  
  logger.log('📊 System Status:');
  console.log(JSON.stringify(status, null, 2));
}

async function runFeaturesCommand(app: any, logger: Logger): Promise<void> {
  const featureFlagManager = app.get(FeatureFlagManager);
  const features = featureFlagManager.getAllFeatureFlags();
  
  logger.log('🚩 Feature Flags:');
  
  const featureInfo = features.map(feature => ({
    name: feature.name,
    enabled: feature.enabled,
    category: feature.category,
    description: feature.description,
    requirements: feature.requirements
  }));
  
  console.log(JSON.stringify(featureInfo, null, 2));
}

function displayCLIHelp(): void {
  console.log(
🔍 The New Fuse - Unified Discovery System CLI

Usage:
  npm start                           Start the web server
  pnpm run cli discover [paths...]    Discover entities in specified paths
  pnpm run cli status                 Show system status
  pnpm run cli features               Show feature flags

Examples:
  pnpm run cli discover ./src ./agents
  pnpm run cli status
  pnpm run cli features

Environment Variables:
  PORT                    Server port (default: 3000)
  DISCOVERY_PATHS         Comma-separated paths for initial discovery
  LOG_LEVEL              Logging level (debug, info, warn, error)
  ENABLE_EXPERIMENTAL    Enable experimental features (true/false)
`);
    }
    // Determine if running as CLI or server
    if (process.argv.includes('--cli')) {
        runCLI();
    }
    else {
        bootstrap();
    }
}
//# sourceMappingURL=main.js.map
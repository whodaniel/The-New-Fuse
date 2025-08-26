#!/usr/bin/env node

const os = require('os');
const { SystemResourceDetector } = require('./packages/build-optimization/dist/system/SystemResourceDetector');
const { BuildOrchestrator } = require('./packages/build-optimization/dist/orchestration/BuildOrchestrator');

async function analyzeSystem() {
    console.log('🔍 Analyzing system resources...');
    
    // Basic system info
    const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);
    const cpus = os.cpus();
    
    console.log(`💾 Total Memory: ${totalMem}GB`);
    console.log(`💾 Free Memory: ${freeMem}GB`);
    console.log(`🖥️  CPU Cores: ${cpus.length}`);
    console.log(`🖥️  CPU Model: ${cpus[0].model}`);
    
    try {
        const detector = SystemResourceDetector.getInstance();
        const resources = await detector.getSystemResources();
        
        console.log('\n📊 Detailed System Analysis:');
        console.log(`   Memory: ${resources.memory.total}MB total, ${resources.memory.available}MB available`);
        console.log(`   CPU: ${resources.cpu.cores} cores, ${resources.cpu.load}% load`);
        console.log(`   Strategy: ${resources.strategy}`);
        
        const orchestrator = new BuildOrchestrator();
        const strategy = await orchestrator.determineOptimalStrategy(resources);
        
        console.log('\n🎯 Recommended Build Strategy:');
        console.log(`   Strategy: ${strategy.name}`);
        console.log(`   Concurrency: ${strategy.concurrency}`);
        console.log(`   Memory Limit: ${strategy.memoryLimit}MB`);
        console.log(`   Staged: ${strategy.staged}`);
        console.log(`   Monitoring: ${strategy.monitoring}`);
        
        // Check if we should use low-memory mode
        if (resources.memory.available < 2048) {
            console.log('\n⚠️  LOW MEMORY DETECTED - Using memory-optimized build');
            console.log('   Run: bun run build:low-memory');
        } else if (resources.memory.available < 4096) {
            console.log('\n⚠️  MODERATE MEMORY - Using adaptive build');
            console.log('   Run: bun run build:adaptive');
        } else {
            console.log('\n✅ SUFFICIENT MEMORY - Using standard build');
            console.log('   Run: bun run build');
        }
        
    } catch (error) {
        console.error('❌ Error analyzing system:', error.message);
        console.log('\n🔄 Using fallback analysis...');
        
        // Fallback analysis
        if (totalMem < 8) {
            console.log('   Run: bun run build:low-memory');
        } else if (totalMem < 16) {
            console.log('   Run: bun run build:adaptive');
        } else {
            console.log('   Run: bun run build');
        }
    }
}

analyzeSystem().catch(console.error);
#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');

// Load monitoring configuration
let config;
try {
    config = JSON.parse(fs.readFileSync('monitoring-config.json', 'utf8'));
} catch (error) {
    console.error('Failed to load monitoring config:', error.message);
    process.exit(1);
}

// Function to check service health
async function checkService(service) {
    return new Promise((resolve) => {
        const url = new URL(service.url + service.healthEndpoint);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'GET',
            timeout: service.timeout || 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    service: service.name,
                    status: res.statusCode === service.expectedStatus ? 'healthy' : 'unhealthy',
                    statusCode: res.statusCode,
                    responseTime: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                });
            });
        });
        
        const startTime = Date.now();
        
        req.on('error', (error) => {
            resolve({
                service: service.name,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                service: service.name,
                status: 'timeout',
                timestamp: new Date().toISOString()
            });
        });
        
        req.end();
    });
}

// Function to monitor all services
async function monitorServices() {
    console.log('🔍 Checking service health...');
    console.log('================================');
    
    const results = await Promise.all(
        config.services.map(service => checkService(service))
    );
    
    results.forEach(result => {
        const icon = result.status === 'healthy' ? '✅' : '❌';
        console.log(`${icon} ${result.service}: ${result.status}`);
        if (result.responseTime) {
            console.log(`   Response time: ${result.responseTime}ms`);
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    
    console.log('================================');
    
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    
    console.log(`📊 Health Summary: ${healthyCount}/${totalCount} services healthy`);
    
    return results;
}

// Run monitoring
if (require.main === module) {
    monitorServices().catch(console.error);
}

module.exports = { monitorServices, checkService };

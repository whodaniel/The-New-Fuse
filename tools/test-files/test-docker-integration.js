#!/usr/bin/env node

/**
 * Test Docker Service Integration
 * Tests connectivity to PostgreSQL and Redis running in Docker
 */

const { execSync } = require('child_process');

async function testPostgreSQL() {
  console.log('🔍 Testing PostgreSQL Connection...');
  try {
    const result = execSync(
      'docker exec tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev -c "SELECT \'PostgreSQL is working!\' as message;"',
      { encoding: 'utf8' }
    );
    console.log('✅ PostgreSQL:', result.includes('PostgreSQL is working') ? 'Connected!' : 'Connection issue');
  } catch (error) {
    console.log('❌ PostgreSQL: Connection failed');
    console.log('   Error:', error.message);
  }
}

async function testRedis() {
  console.log('🔍 Testing Redis Connection...');
  try {
    const result = execSync('docker exec tnf-redis-dev redis-cli ping', { encoding: 'utf8' });
    console.log('✅ Redis:', result.trim() === 'PONG' ? 'Connected!' : 'Connection issue');
  } catch (error) {
    console.log('❌ Redis: Connection failed');
    console.log('   Error:', error.message);
  }
}

async function testApplicationConnection() {
  console.log('🔍 Testing Application Connection to Docker Services...');
  
  // Test with Bun/Node.js PostgreSQL client
  try {
    console.log('   Testing PostgreSQL from Node.js...');
    const { Client } = require('pg');
    const client = new Client({
      host: 'localhost',
      port: 5433,
      database: 'the_new_fuse_dev',
      user: 'newfuse',
      password: 'secretpass123',
    });
    
    await client.connect();
    const result = await client.query('SELECT NOW() as current_time');
    await client.end();
    console.log('✅ Node.js → PostgreSQL: Connected!', result.rows[0]);
  } catch (error) {
    console.log('❌ Node.js → PostgreSQL: Failed');
    console.log('   Error:', error.message);
  }

  // Test Redis
  try {
    console.log('   Testing Redis from Node.js...');
    const redis = require('redis');
    const client = redis.createClient({
      host: 'localhost',
      port: 6380,
    });
    
    await client.connect();
    const pong = await client.ping();
    await client.disconnect();
    console.log('✅ Node.js → Redis: Connected!', pong);
  } catch (error) {
    console.log('❌ Node.js → Redis: Failed');
    console.log('   Error:', error.message);
  }
}

async function main() {
  console.log('🐳 Docker Integration Test');
  console.log('==========================');
  
  await testPostgreSQL();
  await testRedis();
  console.log('');
  await testApplicationConnection();
  
  console.log('');
  console.log('📊 Docker Services Status:');
  try {
    const status = execSync('docker-compose -f docker-compose.dev-simple.yml ps', { encoding: 'utf8' });
    console.log(status);
  } catch (error) {
    console.log('❌ Could not get Docker status');
  }
}

main().catch(console.error);
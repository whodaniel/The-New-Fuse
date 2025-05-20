// Script to check database connection for The New Fuse
// Usage: node check-db-connection.js

const { Client } = require('pg');

async function checkDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fuse';
  
  console.log('Checking database connection...');
  console.log(`Connection string: ${connectionString}`);
  
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️ No tables found in the database.');
      console.log('Run "./scripts/reset-db-simple.sh" to initialize the database schema.');
    } else {
      console.log(`Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      
      // Check if demo data exists
      const agentsQuery = 'SELECT COUNT(*) FROM agents;';
      try {
        const agentsResult = await client.query(agentsQuery);
        console.log(`Found ${agentsResult.rows[0].count} agents in the database.`);
      } catch (error) {
        console.log('❌ Error querying agents table:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure the PostgreSQL service is running');
    console.log('   - If using Docker: docker ps | grep postgres');
    console.log('   - If using local PostgreSQL: pg_isready');
    console.log('2. Verify the connection parameters');
    console.log('   - Database name should be "fuse"');
    console.log('   - Default user is "postgres" with password "postgres"');
    console.log('3. Run the database initialization script:');
    console.log('   - ./scripts/reset-db-simple.sh');
  } finally {
    await client.end();
  }
}

checkDatabaseConnection().catch(console.error);

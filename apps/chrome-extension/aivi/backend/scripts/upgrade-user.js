// Script to upgrade owner@example.com to pro tier
import { query } from '../config/database.js';

async function upgradeUser() {
  try {
    console.log('Upgrading owner@example.com to pro tier...');

    const result = await query(
      `UPDATE users
       SET tier = 'pro', daily_limit = 999999, updated_at = NOW()
       WHERE email = 'owner@example.com'
       RETURNING id, email, tier, daily_limit, daily_usage, total_processed`,
      []
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found with email: owner@example.com');
      console.log('Please ensure the user has signed in at least once.');
    } else {
      console.log('✅ User upgraded successfully:');
      console.log(result.rows[0]);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to upgrade user:', error);
    process.exit(1);
  }
}

upgradeUser();

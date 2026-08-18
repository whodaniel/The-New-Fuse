#!/usr/bin/env node
/**
 * Direct database query to fetch processed video data
 * Usage: node cli/query-db.js
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load backend .env
dotenv.config({ path: join(__dirname, '../backend/.env') });

const { Pool } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found. Make sure backend/.env exists.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('📊 Querying AI Video Intelligence Database...\n');

    // Get all users summary
    const usersResult = await pool.query(`
      SELECT email, tier, daily_usage, daily_limit, total_processed, created_at
      FROM users
      ORDER BY total_processed DESC
    `);

    console.log('👥 Users Summary:');
    console.log('─'.repeat(80));
    usersResult.rows.forEach((u) => {
      console.log(`  ${u.email}`);
      console.log(
        `    Tier: ${u.tier} | Processed: ${u.total_processed || 0} | Usage: ${u.daily_usage || 0}/${u.daily_limit || 20}`
      );
    });

    // Get queue stats by user
    const queueStats = await pool.query(`
      SELECT
        u.email,
        COUNT(*) FILTER (WHERE vq.status = 'pending') as pending,
        COUNT(*) FILTER (WHERE vq.status = 'processing') as processing,
        COUNT(*) FILTER (WHERE vq.status = 'completed') as completed,
        COUNT(*) FILTER (WHERE vq.status = 'failed') as failed,
        COUNT(*) as total
      FROM users u
      LEFT JOIN video_queue vq ON u.id = vq.user_id
      GROUP BY u.email
      ORDER BY total DESC
    `);

    console.log('\n📹 Video Queue Stats:');
    console.log('─'.repeat(80));
    queueStats.rows.forEach((s) => {
      console.log(
        `  ${s.email}: ${s.total} videos (${s.completed} completed, ${s.pending} pending, ${s.failed} failed)`
      );
    });

    // Get recent completed videos
    const recentVideos = await pool.query(`
      SELECT vq.title, vq.channel_name, vq.youtube_video_id, vq.completed_at, u.email
      FROM video_queue vq
      JOIN users u ON vq.user_id = u.id
      WHERE vq.status = 'completed'
      ORDER BY vq.completed_at DESC
      LIMIT 20
    `);

    console.log('\n📺 Recent Completed Videos:');
    console.log('─'.repeat(80));
    if (recentVideos.rows.length === 0) {
      console.log('  No completed videos found');
    } else {
      recentVideos.rows.forEach((v, i) => {
        const completed = v.completed_at ? new Date(v.completed_at).toLocaleString() : 'N/A';
        console.log(`  ${i + 1}. ${v.title || v.youtube_video_id}`);
        console.log(`     Channel: ${v.channel_name || 'Unknown'} | Completed: ${completed}`);
      });
    }

    // Get reports summary
    const reportsResult = await pool.query(`
      SELECT
        u.email,
        COUNT(r.id) as report_count,
        SUM(r.word_count) as total_words
      FROM users u
      LEFT JOIN reports r ON u.id = r.user_id
      GROUP BY u.email
      ORDER BY report_count DESC
    `);

    console.log('\n📄 Reports Summary:');
    console.log('─'.repeat(80));
    reportsResult.rows.forEach((r) => {
      console.log(`  ${r.email}: ${r.report_count} reports (${r.total_words || 0} total words)`);
    });

    // Get recent reports with content preview
    const recentReports = await pool.query(`
      SELECT r.id, r.video_title, r.word_count, r.key_topics, r.created_at,
             LEFT(r.content_markdown, 200) as preview
      FROM reports r
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    console.log('\n📝 Recent Reports:');
    console.log('─'.repeat(80));
    if (recentReports.rows.length === 0) {
      console.log('  No reports found');
    } else {
      recentReports.rows.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.video_title || 'Unknown'} (${r.word_count || 0} words)`);
        console.log(`     Created: ${new Date(r.created_at).toLocaleString()}`);
        if (r.key_topics && r.key_topics.length > 0) {
          console.log(`     Topics: ${r.key_topics.slice(0, 5).join(', ')}`);
        }
        if (r.preview) {
          console.log(`     Preview: ${r.preview.replace(/\n/g, ' ').substring(0, 100)}...`);
        }
      });
    }

    console.log('\n✅ Query complete!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

main();

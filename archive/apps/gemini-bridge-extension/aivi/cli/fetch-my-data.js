#!/usr/bin/env node
/**
 * Fetch processed video data from the backend API
 * Usage: node cli/fetch-my-data.js
 *
 * Requires: Set your JWT token as AIVI_TOKEN environment variable
 *   export AIVI_TOKEN="your-jwt-token-here"
 *
 * To get your token: Open Chrome DevTools > Application > Local Storage > extension
 * Look for the 'token' key
 */

const API_BASE = 'https://aivideointel.thenewfuse.com/api';

async function fetchWithAuth(endpoint, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  const token = process.env.AIVI_TOKEN;

  if (!token) {
    console.error('❌ Missing AIVI_TOKEN environment variable');
    console.log('\nTo get your token:');
    console.log('1. Open the extension popup in Chrome');
    console.log('2. Open DevTools (F12) > Application > Local Storage');
    console.log('3. Find the extension and copy the "token" value');
    console.log('4. Run: export AIVI_TOKEN="your-token" && node cli/fetch-my-data.js');
    process.exit(1);
  }

  try {
    console.log('📊 Fetching your data from AI Video Intelligence backend...\n');

    // Get user info
    console.log('👤 User Info:');
    const me = await fetchWithAuth('/auth/me', token);
    console.log(`   Email: ${me.data.user.email}`);
    console.log(`   Tier: ${me.data.user.tier}`);
    console.log(`   Total Processed: ${me.data.user.total_processed || 0}`);
    console.log(
      `   Daily Usage: ${me.data.user.daily_usage || 0}/${me.data.user.daily_limit || 20}`
    );

    // Get queue stats
    console.log('\n📹 Queue Statistics:');
    const queue = await fetchWithAuth('/queue?limit=200', token);
    console.log(`   Total Videos: ${queue.data.total}`);

    // Count by status
    const statusCounts = {};
    queue.data.videos.forEach((v) => {
      statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Get reports
    console.log('\n📄 Reports:');
    const reports = await fetchWithAuth('/reports?limit=50', token);
    console.log(`   Total Reports: ${reports.data.reports.length}`);

    // Show recent videos
    console.log('\n📺 Recent Processed Videos:');
    const completedVideos = queue.data.videos.filter((v) => v.status === 'completed').slice(0, 10);

    if (completedVideos.length === 0) {
      console.log('   No completed videos found');
    } else {
      completedVideos.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.title || v.youtube_video_id}`);
        console.log(`      Channel: ${v.channel_name || 'Unknown'}`);
        console.log(
          `      Completed: ${v.completed_at ? new Date(v.completed_at).toLocaleString() : 'N/A'}`
        );
      });
    }

    // Show recent reports
    console.log('\n📝 Recent Reports:');
    if (reports.data.reports.length === 0) {
      console.log('   No reports found');
    } else {
      reports.data.reports.slice(0, 5).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.video_title || 'Unknown Video'}`);
        console.log(`      Words: ${r.word_count || 0}`);
        console.log(`      Created: ${new Date(r.created_at).toLocaleString()}`);
        if (r.key_topics && r.key_topics.length > 0) {
          console.log(`      Topics: ${r.key_topics.slice(0, 3).join(', ')}`);
        }
      });
    }

    // Export option
    console.log('\n💾 To export all data, run with --export flag');

    if (process.argv.includes('--export')) {
      const exportData = {
        user: me.data.user,
        queue: queue.data.videos,
        reports: reports.data.reports,
        exportedAt: new Date().toISOString(),
      };

      const fs = await import('fs');
      const filename = `aivi-export-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
      console.log(`\n✅ Data exported to ${filename}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

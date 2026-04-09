import express from 'express';
import { query } from '../config/database.js';
import { checkQuota, protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/queue
 * @desc    Get user's video queue
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM video_queue WHERE user_id = $1';
    const params = [req.user.id];

    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }

    sql +=
      ' ORDER BY added_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM video_queue WHERE user_id = $1' + (status ? ' AND status = $2' : ''),
      status ? [req.user.id, status] : [req.user.id]
    );

    res.json({
      success: true,
      data: {
        videos: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get queue' },
    });
  }
});

/**
 * @route   POST /api/queue
 * @desc    Add videos to queue
 * @access  Private
 */
router.post('/', protect, checkQuota, async (req, res) => {
  try {
    const { videos } = req.body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Videos array is required' },
      });
    }

    // Check quota for free users
    if (req.user.tier === 'free') {
      const userResult = await query('SELECT daily_usage, daily_limit FROM users WHERE id = $1', [
        req.user.id,
      ]);
      const user = userResult.rows[0];
      const remainingQuota = user.daily_limit - user.daily_usage;

      if (videos.length > remainingQuota) {
        return res.status(429).json({
          success: false,
          error: {
            message: `Cannot add ${videos.length} videos. You have ${remainingQuota} videos remaining today.`,
            remainingQuota,
            dailyLimit: user.daily_limit,
          },
        });
      }
    }

    const insertedVideos = [];

    for (const video of videos) {
      const result = await query(
        `INSERT INTO video_queue (user_id, youtube_video_id, title, channel_name, thumbnail_url, duration_seconds, playlist_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.user.id,
          video.youtubeVideoId,
          video.title,
          video.channelName || null,
          video.thumbnailUrl || null,
          video.durationSeconds || null,
          video.playlistId || null,
          video.metadata || {},
        ]
      );

      insertedVideos.push(result.rows[0]);

      // Log usage
      await query(
        'INSERT INTO usage_logs (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'video_queued', 'video', result.rows[0].id]
      );
    }

    // Update daily usage for free tier
    if (req.user.tier === 'free') {
      await query('UPDATE users SET daily_usage = daily_usage + $1 WHERE id = $2', [
        videos.length,
        req.user.id,
      ]);
    }

    res.status(201).json({
      success: true,
      data: { videos: insertedVideos },
    });
  } catch (error) {
    console.error('Add to queue error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add videos to queue' },
    });
  }
});

/**
 * @route   PATCH /api/queue/:id
 * @desc    Update video status
 * @access  Private
 */
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status, errorMessage } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Status is required' },
      });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      });
    }

    let updateFields = ['status = $1', 'updated_at = NOW()'];
    const params = [status];
    let paramCount = 1;

    if (status === 'processing' && !req.body.startedAt) {
      updateFields.push(`started_at = NOW()`);
    }

    if (status === 'completed' && !req.body.completedAt) {
      updateFields.push(`completed_at = NOW()`);
      // Increment total processed count
      await query('UPDATE users SET total_processed = total_processed + 1 WHERE id = $1', [
        req.user.id,
      ]);
    }

    if (status === 'failed' && errorMessage) {
      paramCount++;
      updateFields.push(`error_message = $${paramCount}`);
      params.push(errorMessage);
    }

    paramCount++;
    params.push(req.params.id);
    paramCount++;
    params.push(req.user.id);

    const result = await query(
      `UPDATE video_queue SET ${updateFields.join(', ')}
       WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Video not found in queue' },
      });
    }

    res.json({
      success: true,
      data: { video: result.rows[0] },
    });
  } catch (error) {
    console.error('Update queue error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update video' },
    });
  }
});

/**
 * @route   DELETE /api/queue/:id
 * @desc    Remove video from queue
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM video_queue WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Video not found in queue' },
      });
    }

    res.json({
      success: true,
      data: { message: 'Video removed from queue' },
    });
  } catch (error) {
    console.error('Delete from queue error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to remove video from queue' },
    });
  }
});

/**
 * @route   GET /api/queue/stats
 * @desc    Get queue statistics
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'processing') as processing,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) as total
       FROM video_queue
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get queue stats' },
    });
  }
});

export default router;

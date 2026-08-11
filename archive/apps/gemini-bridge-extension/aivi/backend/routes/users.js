import express from 'express';
import { query } from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, display_name, avatar_url, tier, daily_usage, daily_limit,
              total_processed, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user profile' },
    });
  }
});

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const userResult = await query(
      `SELECT daily_usage, daily_limit, total_processed, tier FROM users WHERE id = $1`,
      [req.user.id]
    );

    const queueResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'failed') as failed
       FROM video_queue WHERE user_id = $1`,
      [req.user.id]
    );

    const reportsResult = await query(
      'SELECT COUNT(*) as report_count FROM reports WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        queue: queueResult.rows[0],
        reports: parseInt(reportsResult.rows[0].report_count),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user statistics' },
    });
  }
});

export default router;

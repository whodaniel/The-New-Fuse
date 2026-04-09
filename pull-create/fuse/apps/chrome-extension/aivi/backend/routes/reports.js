import express from 'express';
import { query } from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/reports
 * @desc    Get user's reports
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0, videoId } = req.query;

    let sql = `
      SELECT r.*, vq.youtube_video_id, vq.title as video_title
      FROM reports r
      LEFT JOIN video_queue vq ON r.video_queue_id = vq.id
      WHERE r.user_id = $1
    `;
    const params = [req.user.id];

    if (videoId) {
      sql += ' AND vq.youtube_video_id = $2';
      params.push(videoId);
    }

    sql +=
      ' ORDER BY r.created_at DESC LIMIT $' +
      (params.length + 1) +
      ' OFFSET $' +
      (params.length + 2);
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: { reports: result.rows },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get reports' },
    });
  }
});

/**
 * @route   POST /api/reports
 * @desc    Create new report
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { videoQueueId, segmentIndex, contentMarkdown, contentJson } = req.body;

    if (!videoQueueId || !contentMarkdown) {
      return res.status(400).json({
        success: false,
        error: { message: 'videoQueueId and contentMarkdown are required' },
      });
    }

    // Extract topics and concepts from JSON if provided
    let keyTopics = [];
    let aiConcepts = [];
    let toolsMentioned = [];

    if (contentJson) {
      keyTopics = contentJson.keyPoints || [];
      aiConcepts = contentJson.aiConcepts || [];
      toolsMentioned = contentJson.technicalDetails || [];
    }

    const result = await query(
      `INSERT INTO reports (video_queue_id, user_id, segment_index, content_markdown, content_json, word_count, key_topics, ai_concepts, tools_mentioned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        videoQueueId,
        req.user.id,
        segmentIndex || 0,
        contentMarkdown,
        contentJson || {},
        contentMarkdown.split(/\s+/).length,
        keyTopics,
        aiConcepts,
        toolsMentioned,
      ]
    );

    res.status(201).json({
      success: true,
      data: { report: result.rows[0] },
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create report' },
    });
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get single report
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, vq.youtube_video_id, vq.title as video_title
       FROM reports r
       LEFT JOIN video_queue vq ON r.video_queue_id = vq.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Report not found' },
      });
    }

    res.json({
      success: true,
      data: { report: result.rows[0] },
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get report' },
    });
  }
});

export default router;

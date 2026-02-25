import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Verify JWT token and attach user to request
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized, no token provided' },
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await query(
      'SELECT id, email, tier, google_id, display_name, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized, invalid token' },
    });
  }
};

// Check if user has specific tier
export const requireTier = (...tiers) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authorized' },
      });
    }

    if (!tiers.includes(req.user.tier)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `This feature requires ${tiers.join(' or ')} tier`,
          requiredTier: tiers,
          currentTier: req.user.tier,
        },
      });
    }

    next();
  };
};

// Check usage quota for free tier
export const checkQuota = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized' },
    });
  }

  // Pro and TNF tiers have unlimited quota
  if (req.user.tier === 'pro' || req.user.tier === 'tnf') {
    return next();
  }

  // Check free tier quota
  const result = await query('SELECT daily_usage, daily_limit FROM users WHERE id = $1', [
    req.user.id,
  ]);

  const user = result.rows[0];

  if (user.daily_usage >= user.daily_limit) {
    return res.status(429).json({
      success: false,
      error: {
        message: 'Daily quota exceeded. Upgrade to Pro for unlimited processing.',
        dailyUsage: user.daily_usage,
        dailyLimit: user.daily_limit,
        upgradePath: '/api/subscriptions/checkout?tier=pro',
      },
    });
  }

  next();
};

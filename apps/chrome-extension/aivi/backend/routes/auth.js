import express from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Note: OAuth2 client is configured per-request with redirect URI from frontend

// Helper to determine tier based on email (deprecated/removed hardcoding)
const getTierForEmail = (email) => {
  return 'free'; // Default to free for new users, database update required for Pro
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate with Google OAuth
 * @access  Public
 */
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, displayName, avatarUrl, youtubeRefreshToken } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Google ID and email are required' },
      });
    }

    // Check if user exists
    let result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);

    let user;

    if (result.rows.length === 0) {
      // Create new user (default to free)
      const tier = 'free';
      result = await query(
        `INSERT INTO users (google_id, email, display_name, avatar_url, youtube_refresh_token_encrypted, tier)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, google_id, display_name, avatar_url, tier, created_at`,
        [googleId, email, displayName, avatarUrl, youtubeRefreshToken, tier]
      );
      user = result.rows[0];
      console.log(`✅ New user created: ${user.email} (tier: ${tier})`);
    } else {
      // Update existing user
      result = await query(
        `UPDATE users
         SET display_name = $1,
             avatar_url = $2,
             youtube_refresh_token_encrypted = COALESCE($3, youtube_refresh_token_encrypted),
             updated_at = NOW()
         WHERE google_id = $4
         RETURNING id, email, google_id, display_name, avatar_url, tier, created_at`,
        [displayName, avatarUrl, youtubeRefreshToken, googleId]
      );
      user = result.rows[0];
      console.log(`✅ User logged in: ${user.email}`);
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          tier: user.tier,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Authentication failed',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    });
  }
});

/**
 * @route   POST /api/auth/google/exchange-code
 * @desc    Exchange Google authorization code for access + refresh tokens
 * @access  Public
 */
router.post('/google/exchange-code', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: { message: 'Authorization code is required' },
      });
    }

    if (!redirectUri) {
      return res.status(400).json({
        success: false,
        error: { message: 'Redirect URI is required' },
      });
    }

    console.log('🔄 Exchanging authorization code for tokens...');
    console.log(`   - Redirect URI: ${redirectUri}`);

    // Create OAuth2 client with the redirect URI that was used in the auth request
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('Failed to obtain access token from Google');
    }

    console.log('✅ Tokens received from Google');
    console.log(`   - Access token: ${tokens.access_token.substring(0, 20)}...`);
    console.log(`   - Refresh token: ${tokens.refresh_token ? 'Yes' : 'No'}`);
    console.log(
      `   - Expires in: ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'Unknown'}`
    );

    // Set credentials to make authenticated requests
    oauth2Client.setCredentials(tokens);

    // Verify the access token and get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data || !userInfo.data.id || !userInfo.data.email) {
      throw new Error('Failed to get user info from Google');
    }

    const googleUser = userInfo.data;
    console.log(`✅ Verified user: ${googleUser.email}`);

    // Check if user exists in our database
    let result = await query('SELECT * FROM users WHERE google_id = $1', [googleUser.id]);

    let user;

    if (result.rows.length === 0) {
      // Create new user (default to free)
      const tier = 'free';
      result = await query(
        `INSERT INTO users (google_id, email, display_name, avatar_url, youtube_refresh_token_encrypted, tier)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, google_id, display_name, avatar_url, tier, created_at`,
        [
          googleUser.id,
          googleUser.email,
          googleUser.name,
          googleUser.picture,
          tokens.refresh_token,
          tier,
        ]
      );
      user = result.rows[0];
      console.log(`✅ New user created: ${user.email} (tier: ${tier})`);
    } else {
      // Update existing user
      const existingUser = result.rows[0];

      result = await query(
        `UPDATE users
         SET display_name = $1,
             avatar_url = $2,
             email = $3,
             youtube_refresh_token_encrypted = COALESCE($4, youtube_refresh_token_encrypted),
             updated_at = NOW()
         WHERE google_id = $5
         RETURNING id, email, google_id, display_name, avatar_url, tier, created_at`,
        [googleUser.name, googleUser.picture, googleUser.email, tokens.refresh_token, googleUser.id]
      );
      user = result.rows[0];
      console.log(`✅ User logged in: ${user.email}`);
    }

    // Generate JWT token for our API
    const jwtToken = generateToken(user.id);

    // Set JWT in HTTP-only cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return both Google access token and our JWT
    res.json({
      success: true,
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        user: {
          id: user.id,
          email: user.email,
          name: googleUser.name,
          picture: googleUser.picture,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          tier: user.tier,
        },
        jwtToken,
      },
    });
  } catch (error) {
    console.error('❌ Token exchange error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to exchange authorization code',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.display_name, u.avatar_url, u.tier, u.daily_usage, u.daily_limit, u.total_processed,
              s.status as subscription_status, s.current_period_end
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user' },
    });
  }
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh Google access token using stored refresh token
 * @access  Private
 */
router.post('/refresh-token', protect, async (req, res) => {
  try {
    console.log('🔄 Refreshing access token for user:', req.user.email);

    // Get user's refresh token from database
    const result = await query('SELECT youtube_refresh_token_encrypted FROM users WHERE id = $1', [
      req.user.id,
    ]);

    if (result.rows.length === 0 || !result.rows[0].youtube_refresh_token_encrypted) {
      return res.status(400).json({
        success: false,
        error: { message: 'No refresh token available. Please sign in again.' },
      });
    }

    const refreshToken = result.rows[0].youtube_refresh_token_encrypted;

    // Create OAuth2 client for token refresh (redirect URI not needed for refresh)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Use the refresh token to get a new access token
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    console.log('✅ Access token refreshed successfully');
    console.log(
      `   - New token expires in: ${credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'Unknown'}`
    );

    // If Google provided a new refresh token, update it in the database
    if (credentials.refresh_token) {
      await query(
        'UPDATE users SET youtube_refresh_token_encrypted = $1, updated_at = NOW() WHERE id = $2',
        [credentials.refresh_token, req.user.id]
      );
      console.log('   - Refresh token updated in database');
    }

    res.json({
      success: true,
      data: {
        accessToken: credentials.access_token,
        expiresIn: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : 3600,
      },
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to refresh access token',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

export default router;

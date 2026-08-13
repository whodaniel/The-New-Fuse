const CORS_ALLOW_ORIGINS = String(process.env.CORS_ALLOW_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const corsMiddleware = (req, res, next) => {
  const requestOrigin = String(req.headers.origin || '');
  const isAllowedOrigin =
    CORS_ALLOW_ORIGINS.includes('*') ||
    (requestOrigin && CORS_ALLOW_ORIGINS.includes(requestOrigin));

  if (isAllowedOrigin) {
    if (CORS_ALLOW_ORIGINS.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    return next();
  } else {
    // Invalid origin: reject preflight requests with 403
    if (req.method === 'OPTIONS') {
      return res.status(403).json({ error: 'Forbidden', message: 'CORS origin not allowed' });
    }
    // For non-preflight requests, simply don't set CORS headers
    // This allows the browser to handle the CORS failure silently
    return next();
  }
};

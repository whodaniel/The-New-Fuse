# TNF CORS Fix Patterns

Based on dogfood QA findings for TNF properties, here are proven patterns for
fixing CORS issues:

## Pattern 1: Replace Wildcard CORS with Specific Origins

**Problem**: `Access-Control-Allow-Origin: *` (Critical severity)

**Solution**: Configure CORS middleware to accept specific trusted origins only

### Express/Node.js Example:

```javascript
const cors = require('cors');
const allowedOrigins = [
  'https://app.thenewfuse.com',
  'https://dashboard.thenewfuse.com',
  'https://extreamix.com',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
```

### Alternative: Remove CORS Headers Entirely (if not needed)

If your API doesn't actually need cross-origin browser requests, consider
removing CORS headers entirely rather than using wildcards.

## Pattern 2: Fix CORS Error Responses

**Problem**: CORS rejection returns HTTP 500 instead of 403 (High severity)

**Solution**: Ensure CORS middleware returns proper HTTP status codes for
rejected origins

### Express Middleware Fix:

```javascript
app.use(function (req, res, next) {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'CORS policy: Origin not allowed',
    });
  }
  next();
});
```

## Pattern 3: Handle Preflight Requests Properly

Ensure your CORS configuration handles OPTIONS preflight requests:

```javascript
app.options('*', cors()); // Enable preflight for all routes
```

## Verification Steps

After applying fixes, verify with:

```bash
# Test legitimate origin
curl -sI -H "Origin: https://app.thenewfuse.com" https://api.thenewfuse.com/

# Test illegitimate origin (should return 403, not 500)
curl -s -o /dev/null -w "%{http_code}" -H "Origin: https://evil-test.com" https://api.thenewfuse.com/

# Test wildcard is gone
curl -sI -H "Origin: https://evil-test.com" https://app.thenewfuse.com/ | grep -i access-control-allow-origin
# Should NOT show "*"
```

## Cloudflare Considerations

If using Cloudflare:

1. Some security headers may need to be configured at Cloudflare level
2. CORS policies might need adjustment in Cloudflare Workers if used
3. Check Cloudflare dashboard for "Scrape Shield" and "Hotlink Protection"
   settings that might affect headers

# AI Video Intelligence Suite - Backend API

Node.js/Express backend for AI Video Intelligence Suite Chrome extension.

## Quick Start

### Local Development

1. **Install Dependencies**

```bash
npm install
```

2. **Set Up Environment Variables**

```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Set Up Database**

```bash
# Create PostgreSQL database (using Supabase recommended)
# Run schema migration
psql $DATABASE_URL < scripts/schema.sql
```

4. **Start Development Server**

```bash
npm run dev
```

Server runs at: http://localhost:3000

### Production Deployment (Railway)

1. **Create Railway Project**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

2. **Add PostgreSQL Database**

```bash
# In Railway dashboard, add PostgreSQL plugin
# Copy DATABASE_URL from Railway to your environment
```

3. **Set Environment Variables**

```bash
# In Railway dashboard, go to Variables tab and add:
NODE_ENV=production
JWT_SECRET=<generate-random-secret>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_TNF_MONTHLY=price_xxx
STRIPE_PRICE_TNF_YEARLY=price_xxx
```

4. **Deploy**

```bash
railway up
```

## API Endpoints

### Authentication

- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users

- `GET /api/users/me` - Get user profile
- `GET /api/users/stats` - Get user statistics

### Subscriptions

- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/checkout` - Create checkout session
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/pricing` - Get pricing info

### Queue

- `GET /api/queue` - Get video queue
- `POST /api/queue` - Add videos to queue
- `PATCH /api/queue/:id` - Update video status
- `DELETE /api/queue/:id` - Remove from queue
- `GET /api/queue/stats` - Get queue statistics

### Reports

- `GET /api/reports` - Get user reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get single report

### Webhooks

- `POST /api/webhooks/stripe` - Stripe webhook handler

## Database Schema

See `scripts/schema.sql` for complete schema.

### Key Tables

- `users` - User accounts
- `subscriptions` - Subscription records
- `video_queue` - Processing queue
- `reports` - Generated reports
- `usage_logs` - Usage tracking

## Security

- JWT authentication
- HTTPS required in production
- Rate limiting (100 req/15min per IP)
- Helmet.js security headers
- CORS configured for extension origin
- Stripe webhook signature verification

## Monitoring

### Health Check

```bash
curl https://your-api.railway.app/health
```

### Logs

```bash
railway logs
```

## Stripe Webhook Setup

1. **Create Webhook in Stripe Dashboard**
   - URL: `https://your-api.railway.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`,
     `invoice.*`

2. **Copy Webhook Secret**
   - Add to Railway env as `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

### Authentication Issues

```bash
# Verify JWT_SECRET is set
railway variables

# Check token in Chrome DevTools > Application > Cookies
```

### Stripe Webhook Issues

```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Development

### Run Tests

```bash
npm test
```

### Database Migrations

```bash
# Reset database (DESTRUCTIVE)
psql $DATABASE_URL < scripts/schema.sql

# Backup database
pg_dump $DATABASE_URL > backup.sql
```

## License

Proprietary - All rights reserved

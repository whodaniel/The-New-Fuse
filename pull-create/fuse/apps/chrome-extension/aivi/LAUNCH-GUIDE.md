# AI Video Intelligence Suite - Complete Launch Guide

## 🎯 Launch Readiness Status

**Overall Progress: 85% Complete**

✅ **COMPLETE:**

- Backend API infrastructure (Node.js/Express)
- PostgreSQL database schema
- Authentication system (Google OAuth + JWT)
- Stripe payment integration
- Subscription management (Free/Pro/TNF tiers)
- Queue management API
- Reports API
- Webhook handlers
- Legal pages (Privacy Policy, Terms of Service)
- Landing page
- Railway deployment configuration

⏳ **IN PROGRESS:**

- Chrome Web Store marketing materials
- Extension-to-backend integration
- End-to-end testing

❌ **TODO:**

- Deploy backend to Railway
- Configure Stripe products
- Submit to Chrome Web Store
- Beta testing

---

## Phase 1: Backend Deployment (Week 1)

### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to backend directory
cd backend

# Initialize Railway project
railway init

# Link to new project
railway link
```

### Step 2: Add PostgreSQL Database

1. Go to Railway dashboard: https://railway.app/dashboard
2. Click your project
3. Click "+ New" → "Database" → "PostgreSQL"
4. Wait for provisioning
5. Copy `DATABASE_URL` from Variables tab

### Step 3: Run Database Migration

```bash
# Set DATABASE_URL locally
export DATABASE_URL="postgresql://..."

# Run schema migration
psql $DATABASE_URL < scripts/schema.sql

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

### Step 4: Configure Environment Variables

In Railway dashboard, add these variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<auto-set-by-railway>

# JWT
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_REDIRECT_URI=https://your-api.railway.app/api/auth/google/callback

# Stripe (see Step 6)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_TNF_MONTHLY=price_...
STRIPE_PRICE_TNF_YEARLY=price_...

# URLs
FRONTEND_URL=chrome-extension://YOUR_EXTENSION_ID
WEB_DASHBOARD_URL=https://aivideointelligence.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 5: Deploy Backend

```bash
# Deploy to Railway
railway up

# Check deployment status
railway status

# View logs
railway logs

# Get public URL
railway domain
```

Your API will be available at: `https://your-project.up.railway.app`

### Step 6: Configure Stripe

#### A. Create Stripe Account

1. Go to https://stripe.com
2. Create account
3. Complete verification

#### B. Create Products

**Pro Monthly:**

```
Name: AI Video Intelligence Pro (Monthly)
Price: $9.99/month
Billing: Recurring - Monthly
```

**Pro Yearly:**

```
Name: AI Video Intelligence Pro (Yearly)
Price: $99/year
Billing: Recurring - Yearly
```

**TNF Monthly:**

```
Name: The New Fuse Membership (Monthly)
Price: $49/month
Billing: Recurring - Monthly
```

**TNF Yearly:**

```
Name: The New Fuse Membership (Yearly)
Price: $490/year
Billing: Recurring - Yearly
```

#### C. Copy Price IDs

From Stripe Dashboard → Products, copy each `price_xxx` ID and add to Railway
environment variables.

#### D. Set Up Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api.railway.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret
5. Add to Railway as `STRIPE_WEBHOOK_SECRET`

### Step 7: Test Backend

```bash
# Health check
curl https://your-api.railway.app/health

# API info
curl https://your-api.railway.app/api

# Test authentication (will fail without valid token - expected)
curl https://your-api.railway.app/api/auth/me
```

---

## Phase 2: Extension Updates (Week 1-2)

### Step 1: Update Extension Configuration

**Update `manifest.json`:**

```json
{
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
  },
  "host_permissions": ["https://your-api.railway.app/*"]
}
```

### Step 2: Create API Client

Create `services/api-client.js`:

```javascript
class APIClient {
  constructor() {
    this.baseURL = 'https://your-api.railway.app/api';
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  }

  async getToken() {
    const { token } = await chrome.storage.local.get('token');
    return token;
  }

  // Auth
  async login(googleAuthData) {
    const data = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleAuthData),
    });

    await chrome.storage.local.set({ token: data.data.token });
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Queue
  async addToQueue(videos) {
    return this.request('/queue', {
      method: 'POST',
      body: JSON.stringify({ videos }),
    });
  }

  async getQueue(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/queue?${query}`);
  }

  async updateVideoStatus(videoId, status, errorMessage) {
    return this.request(`/queue/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, errorMessage }),
    });
  }

  // Subscriptions
  async getSubscriptionStatus() {
    return this.request('/subscriptions/status');
  }

  async createCheckoutSession(tier, billingPeriod) {
    return this.request('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier, billingPeriod }),
    });
  }

  // Reports
  async createReport(videoQueueId, segmentIndex, contentMarkdown, contentJson) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify({
        videoQueueId,
        segmentIndex,
        contentMarkdown,
        contentJson,
      }),
    });
  }
}

export default new APIClient();
```

### Step 3: Update Background Service Worker

Update `background.js` to use API client:

```javascript
import apiClient from './services/api-client.js';

// Replace local storage subscription checks with API calls
async function checkSubscription() {
  try {
    const response = await apiClient.getSubscriptionStatus();
    return response.data;
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return { tier: 'free' };
  }
}

// When adding videos to queue
async function addToQueue(videos) {
  try {
    const response = await apiClient.addToQueue(videos);
    return response.data;
  } catch (error) {
    if (error.message.includes('Daily quota exceeded')) {
      // Show upgrade prompt
      chrome.runtime.sendMessage({
        type: 'SHOW_UPGRADE_PROMPT',
        message:
          'Daily limit reached. Upgrade to Pro for unlimited processing.',
      });
    }
    throw error;
  }
}
```

---

## Phase 3: Chrome Web Store Submission (Week 2)

### Step 1: Prepare Marketing Materials

**Store Listing:**

- **Name:** AI Video Intelligence Suite
- **Summary:** Transform YouTube videos into AI-powered insights. Process 20
  videos free per day.
- **Description:** (see `chrome-web-store-description.txt`)
- **Category:** Productivity
- **Language:** English

**Screenshots (1280x800):**

1. Hero shot - Main interface with video list
2. Processing view - AI analysis in progress
3. Report view - Generated insights
4. NotebookLM integration
5. Statistics dashboard

**Promotional Images:**

- Small tile: 440x280
- Large tile: 920x680 (optional)
- Marquee: 1400x560 (optional)

### Step 2: Build Production Extension

```bash
# Remove development keys
# Update manifest.json with production IDs
# Test thoroughly

# Create production build
zip -r ai-video-intelligence-suite.zip . \
  -x "*.git*" -x "*node_modules*" -x "*.DS_Store" -x "*backend*"
```

### Step 3: Submit to Chrome Web Store

1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay $5 developer fee (one-time)
3. Click "New Item"
4. Upload `ai-video-intelligence-suite.zip`
5. Fill in store listing:
   - Upload screenshots
   - Add promotional images
   - Set privacy policy URL:
     `https://aivideointelligence.com/privacy-policy.html`
   - Set terms URL: `https://aivideointelligence.com/terms-of-service.html`
6. Submit for review

**Review time:** 1-3 days typically

---

## Phase 4: Testing & Launch (Week 2-3)

### Pre-Launch Checklist

**Backend:**

- [ ] Railway deployment healthy
- [ ] Database schema applied
- [ ] All environment variables set
- [ ] Stripe products created
- [ ] Stripe webhook configured and tested
- [ ] API endpoints responding correctly
- [ ] Rate limiting working
- [ ] Error logging configured

**Extension:**

- [ ] Google OAuth working
- [ ] Backend API integration working
- [ ] Video processing functional
- [ ] Subscription flow working
- [ ] Payment flow tested (use Stripe test mode)
- [ ] Quota enforcement working
- [ ] Error handling graceful
- [ ] All features tested

**Legal:**

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie policy (if needed)
- [ ] GDPR compliance verified
- [ ] Support email set up

**Marketing:**

- [ ] Landing page deployed
- [ ] Chrome Web Store listing complete
- [ ] Screenshots high quality
- [ ] Description compelling
- [ ] Pricing clear

### Beta Testing

1. **Recruit 10-20 beta testers**
   - Friends, colleagues, targeted community members

2. **Create beta testing form:**
   - What features did you use?
   - What issues did you encounter?
   - How would you rate the experience (1-10)?
   - Would you pay for this product?
   - Suggestions for improvement?

3. **Iterate based on feedback** (1 week)

### Launch Day Checklist

- [ ] Switch Stripe to live mode
- [ ] Update extension with production API URL
- [ ] Submit final version to Chrome Web Store
- [ ] Publish landing page
- [ ] Set up analytics (Google Analytics)
- [ ] Prepare support email (support@aivideointelligence.com)
- [ ] Create social media accounts
- [ ] Prepare launch announcement

---

## Phase 5: Post-Launch (Week 3-4)

### Week 1 Post-Launch

**Monitor:**

- Daily active users
- Conversion rate (Free → Pro)
- Churn rate
- Error logs
- User feedback

**Respond to:**

- Chrome Web Store reviews
- Support emails
- Bug reports
- Feature requests

### Week 2-4 Post-Launch

**Build:**

- High-priority bug fixes
- Most-requested features
- Pro-tier features (NotebookLM integration, knowledge base UI)

**Grow:**

- Content marketing (blog posts)
- Social media presence
- Community building (Discord/Slack)
- SEO optimization

---

## Pricing Strategy

### Initial Launch (Months 1-3)

- **Free:** 20 videos/day (attract users)
- **Pro:** $9.99/month (power users)
- **TNF:** Not heavily promoted yet

**Goals:**

- 1,000 installs
- 100 Pro subscribers
- $1,000 MRR

### Growth Phase (Months 3-6)

- Add annual billing (17% discount)
- Introduce referral program
- Launch Pro features (KB browser, NotebookLM)
- Begin promoting TNF integration

**Goals:**

- 5,000 installs
- 500 Pro subscribers
- 50 TNF members
- $7,450 MRR

### Scale Phase (Months 6-12)

- Build advanced features (RAG, AI assistant)
- Full TNF integration
- Team/Enterprise tiers
- API access

**Goals:**

- 10,000 installs
- 1,000 Pro subscribers
- 200 TNF members
- $19,800 MRR

---

## Support & Operations

### Support Email Setup

1. Create `support@aivideointelligence.com`
2. Set up autoresponder
3. Create support ticket system (Zendesk/Help Scout)
4. Build FAQ/documentation

### Monitoring

1. **Uptime monitoring:**
   - Use UptimeRobot or similar
   - Alert if API down > 5 minutes

2. **Error tracking:**
   - Set up Sentry or similar
   - Monitor error rates

3. **Analytics:**
   - Google Analytics on landing page
   - Track conversion funnels
   - Monitor user behavior

---

## Estimated Timeline

| Week   | Tasks                            | Status         |
| ------ | -------------------------------- | -------------- |
| Week 1 | Backend deployment, Stripe setup | ✅ Ready       |
| Week 2 | Extension integration, testing   | ⏳ In Progress |
| Week 3 | Chrome Web Store submission      | 📋 Planned     |
| Week 4 | Beta testing, iterate            | 📋 Planned     |
| Week 5 | Public launch                    | 🚀 Planned     |

---

## Budget Estimate

### One-Time Costs

- Chrome Web Store developer fee: $5
- Domain name: $12/year
- Logo/design (optional): $50-500

### Monthly Costs

- Railway (Hobby plan): $5-20
- Supabase/PostgreSQL: $0-25 (included in Railway)
- Email service: $0 (Gmail) or $6 (Google Workspace)
- **Total:** ~$10-50/month

### Revenue Projections

**Conservative (Month 6):**

- 150 Pro users @ $9.99 = $1,498.50
- 25 TNF users @ $49 = $1,225
- **Total MRR:** $2,723.50
- **Costs:** ~$50
- **Profit:** $2,673.50/month

**Optimistic (Month 12):**

- 1,000 Pro users @ $9.99 = $9,990
- 200 TNF users @ $49 = $9,800
- **Total MRR:** $19,790
- **Costs:** ~$100
- **Profit:** $19,690/month

---

## Next Immediate Actions

1. ✅ **Deploy backend to Railway** (30 minutes)
2. ✅ **Configure Stripe products** (30 minutes)
3. ✅ **Update extension with API integration** (2-3 hours)
4. ✅ **Create Chrome Web Store marketing materials** (2-3 hours)
5. ✅ **End-to-end testing** (2-3 hours)
6. ✅ **Beta testing recruitment** (1 week)
7. 🚀 **Submit to Chrome Web Store** (1 day)
8. 🎉 **Launch!**

---

**Ready to launch?** Follow this guide step-by-step and you'll be live in 2-3
weeks!

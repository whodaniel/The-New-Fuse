# 🚀 MyPhoneRemote Revenue Launch Pack

## Objective: Activate Payments for myphone-remote.pages.dev

This package bridges the MyPhoneRemote frontend (`apps/frontend`) to the TNF
backend (`apps/api`) for live Stripe processing.

---

## 1. STRIPE CONFIGURATION (Do This First in Dashboard)

### Step 1: Create Products & Prices

1. Log in to [https://dashboard.stripe.com](https://dashboard.stripe.com).
2. Go to **Products** > **Add product**.
3. Create the following subscriptions:
   - **MyPhoneRemote Pro**
     - Name: `MyPhoneRemote Pro`
     - Description: `Mirror your Mac to iPhone with AI control`
     - Price: `$4.99 / month`
     - Billing: `Recurring`
   - **MyPhoneRemote AI Agent**
     - Name: `MyPhoneRemote AI Agent`
     - Description: `Full AI-driven remote control & automation`
     - Price: `$14.99 / month`
     - Billing: `Recurring`
4. **CRITICAL:** Copy the `Price IDs` (they look like `price_1Q...`). You will
   paste them below.

### Step 2: Get API Keys

1. Go to **Developers** > **API keys**.
2. **Reveal** the `Secret key` (starts with `sk_live_...` for production, or
   `sk_test_...` for testing).
3. Go to **Developers** > **Webhooks**.
4. Click **Add endpoint**.
5. Set the endpoint URL to: `https://YOUR_API_DOMAIN/api/webhooks/stripe`
   (replace `YOUR_API_DOMAIN` with your actual TNF API domain, e.g.,
   `api.thenewfuse.com`).
6. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
7. **Copy the `Signing secret`** (starts with `whsec_...`). You will paste this
   below.

---

## 2. ENVIRONMENT VARIABLES

Create a new `.env` file in
`$TNF_ROOT` (or update the
existing one) with the following:

```env
# Stripe Credentials
STRIPE_SECRET_KEY=sk_live_YOUR_REAL_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_REAL_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_REAL_WEBHOOK_SECRET_HERE

# Product/Price Mappings
STRIPE_MEMBERSHIP_PRICE_ID=price_YOUR_PRO_PRICE_ID
STRIPE_AI_AGENT_PRICE_ID=price_YOUR_AI_AGENT_PRICE_ID

# App URLs
FRONTEND_URL=https://myphone-remote.pages.dev
API_BASE_URL=https://api.thenewfuse.com  # <-- Update this to your live API domain
```

---

## 3. BACKEND DEPLOYMENT

Ensure `apps/api` is deployed and reachable at `API_BASE_URL`. The webhook
endpoint must be publicly accessible.

Verify the webhook endpoint is live:

```bash
curl -X POST https://YOUR_API_DOMAIN/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

You should receive a `401` initially (because of missing signature), not a `404`
or `Connection Refused`.

---

## 4. FRONTEND INTEGRATION

I have generated a dedicated checkout page for MyPhoneRemote. It must be built
and deployed.

1.  **Install dependencies:**
    ```bash
    cd apps/frontend && npm install
    ```
2.  **Build:**
    ```bash
    npm run build
    ```
3.  **Deploy:** If using Cloudflare Pages, run the deploy command from your repo
    root.

### 4.1 Configure the Checkout Buttons

I have created a React component at
`src/pages/checkout/MyPhoneRemoteCheckout.tsx`. It contains a simple function
that calls the backend:

```typescript
async function redirectToCheckout(priceId: string) {
  const res = await fetch('/api/billing/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  }
}
```

You must wire your existing "Subscribe to Pro" and "Subscribe to AI Agent"
buttons on `myphone-remote.pages.dev` to call this function with the correct
`priceId`.

---

## 5. REVENUECAT SETUP

Since the user specifically asked for RevenueCat:

1. Log in to [https://app.revenuecat.com](https://app.revenuecat.com).
2. Create an app called `MyPhoneRemote`.
3. Under **Integrations**, add **Stripe**.
   - Paste your `Secret key` (`sk_live_...`).
   - Paste your `Webhook signing secret` (`whsec_...`).
4. In RevenueCat, create two **Entitlements**:
   - `pro`
   - `ai_agent`
5. In RevenueCat, create **Products** that map to your Stripe Price IDs.
6. In RevenueCat, create **Offerings** that group these products.
7. **OPTIONAL:** Use the RevenueCat SDK in the frontend instead of direct Stripe
   SDK for unified billing.

---

## 6. VERIFICATION CHECKLIST

Before you consider this done, run these checks:

| #   | Verification Command                                           | Expected Result                       |
| --- | -------------------------------------------------------------- | ------------------------------------- |
| 1   | `curl -X POST https://api.thenewfuse.com/api/webhooks/stripe`  | HTTP 401 or 200 (not 404!)            |
| 2   | Click "Subscribe" button on live site                          | Redirects to `stripe.com/checkout`    |
| 3   | Complete test purchase (using test card `4242 4242 4242 4242`) | Redirects to success page             |
| 4   | Check Stripe Dashboard > Customers                             | New customer entry appears            |
| 5   | Check RevenueCat > Events                                      | Webhook received and processed        |
| 6   | Check Database `stripe_subscriptions`                          | Row inserted with `status = 'ACTIVE'` |

---

## 7. TROUBLESHOOTING

- **404 on /api/webhooks/stripe:** Your API is not deployed at `API_BASE_URL`,
  or the route isn't registered in `apps/api`. Check your deployment and routing
  tables.
- **401 on checkout:** Your `STRIPE_SECRET_KEY` is invalid or missing.
  Double-check `process.env.STRIPE_SECRET_KEY`.
- **Stripe says "No price found":** You used a fake `price_` ID or the wrong
  environment (test key with live price). Ensure keys and Price IDs match the
  same Stripe environment.
- **RevenueCat shows no events:** Your webhook URL is wrong or your app is
  blocking Stripe IP ranges. Check firewall rules.

---

**Action required from you:**

1. Provide the real `sk_live_...`, `pk_live_...`, and `whsec_...` credentials.
2. Provide your live API domain (so I can update the `API_BASE_URL`).
3. Once I have these, I will inject them into the code and give you the final
   deploy command.

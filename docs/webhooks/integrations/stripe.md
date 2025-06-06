# Stripe Integration Setup Guide

This guide walks you through setting up Stripe webhooks with The New Fuse platform to receive real-time payment events and automate business processes.

## 📋 Prerequisites

- Active Stripe account (Live or Test mode)
- The New Fuse API deployed and accessible
- Admin access to Stripe Dashboard
- Basic understanding of webhooks

## 🔧 Step-by-Step Setup

### 1. Stripe Dashboard Configuration

#### Access Webhook Settings

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**

#### Configure Webhook Endpoint

```
Endpoint URL: https://api.thenewfuse.com/webhooks/incoming/stripe
Description: The New Fuse Business Events Integration
```

#### Select Events to Monitor

Choose the events relevant to your business needs:

**Payment Events:**

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_method.attached`

**Invoice Events:**

- `invoice.created`
- `invoice.finalized`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Subscription Events:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`

**Customer Events:**

- `customer.created`
- `customer.updated`
- `customer.deleted`

**Charge Events:**

- `charge.succeeded`
- `charge.failed`
- `charge.dispute.created`

### 2. Obtain Webhook Secret

After creating the webhook endpoint:

1. Click on your newly created webhook endpoint
2. In the **Signing secret** section, click **Reveal**
3. Copy the webhook signing secret (starts with `whsec_`)
4. Store this securely - you'll need it for The New Fuse configuration

### 3. Configure The New Fuse

#### Environment Variables

Add to your `.env` file:

```bash
# Stripe Configuration
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
STRIPE_API_KEY=sk_live_your_stripe_api_key  # Optional: for API calls back to Stripe
```

#### Register Webhook Configuration

Use the API endpoint to register your Stripe webhook:

```bash
curl -X POST https://api.thenewfuse.com/webhooks/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "stripe",
    "endpoint_url": "https://api.thenewfuse.com/webhooks/incoming/stripe",
    "secret_key": "whsec_your_stripe_webhook_secret_here",
    "configuration": {
      "events": [
        "payment_intent.succeeded",
        "invoice.payment_succeeded",
        "customer.subscription.created",
        "customer.created"
      ],
      "api_version": "2023-10-16"
    }
  }'
```

### 4. Test the Integration

#### Test with Stripe CLI (Recommended)

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login to your Stripe account:

   ```bash
   stripe login
   ```

3. Forward events to your local development server:

   ```bash
   stripe listen --forward-to localhost:3000/webhooks/incoming/stripe
   ```

4. Trigger test events:

   ```bash
   stripe trigger payment_intent.succeeded
   ```

#### Test with Stripe Dashboard

1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Scroll down to **Test webhook**
4. Select an event type and click **Send test webhook**

### 5. Verify Event Processing

Check The New Fuse dashboard to verify events are being received and processed:

1. Navigate to **Webhooks** → **Event History**
2. Look for Stripe events with status `completed`
3. Check the real-time event stream for live updates

## 📊 Supported Event Types

### Payment Events

| Stripe Event | Business Event Type | Description |
|--------------|-------------------|-------------|
| `payment_intent.succeeded` | `payment_received` | Successful payment |
| `payment_intent.payment_failed` | `payment_failed` | Failed payment attempt |
| `charge.succeeded` | `payment_received` | Successful charge |
| `charge.failed` | `payment_failed` | Failed charge |

### Customer Events

| Stripe Event | Business Event Type | Description |
|--------------|-------------------|-------------|
| `customer.created` | `customer_created` | New customer registered |
| `customer.updated` | `customer_updated` | Customer information changed |
| `customer.subscription.created` | `subscription_changed` | New subscription |
| `customer.subscription.updated` | `subscription_changed` | Subscription modified |

### Invoice Events

| Stripe Event | Business Event Type | Description |
|--------------|-------------------|-------------|
| `invoice.created` | `invoice_generated` | Invoice created |
| `invoice.payment_succeeded` | `payment_received` | Invoice paid |
| `invoice.payment_failed` | `payment_failed` | Invoice payment failed |

## 🔍 Event Payload Examples

### Payment Intent Succeeded

```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 2000,
      "currency": "usd",
      "status": "succeeded",
      "customer": "cus_1234567890",
      "metadata": {
        "order_id": "order_123",
        "user_id": "user_456"
      }
    }
  },
  "created": 1640995200
}
```

### Customer Created

```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "customer.created",
  "data": {
    "object": {
      "id": "cus_1234567890",
      "email": "customer@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "metadata": {
        "signup_source": "website"
      }
    }
  },
  "created": 1640995200
}
```

## 🚀 Business Process Automation

### Revenue Tracking

- Automatically update revenue metrics when payments succeed
- Track failed payments for follow-up campaigns
- Monitor subscription changes for churn analysis

### Customer Lifecycle

- Trigger welcome emails for new customers
- Update CRM records when customer data changes
- Send renewal reminders for expiring subscriptions

### Analytics Integration

- Real-time revenue dashboards
- Payment success/failure rate monitoring
- Customer acquisition cost calculations

## 🔐 Security Best Practices

### Webhook Signature Verification

The New Fuse automatically verifies Stripe webhook signatures using your webhook secret. This ensures events are legitimate.

### IP Allowlisting (Optional)

Consider allowlisting Stripe's webhook IPs:

- `3.18.12.63`
- `3.130.192.231`
- `13.235.14.237`
- `13.235.122.149`
- `35.154.171.200`
- `52.15.183.38`

### Secret Rotation

Regularly rotate your webhook secrets and update The New Fuse configuration.

## 🐛 Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Failed

```
Error: Invalid webhook signature
```

**Solution:** Verify the webhook secret is correctly configured in your environment variables.

#### 2. Events Not Appearing in Dashboard

- Check webhook endpoint URL is correct
- Verify events are selected in Stripe Dashboard
- Check The New Fuse logs for processing errors

#### 3. Duplicate Events

Stripe may send duplicate events. The New Fuse handles this automatically using event IDs.

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Environment variable
LOGGING_LEVEL=debug

# Or via API
curl -X POST https://api.thenewfuse.com/webhooks/debug \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"enabled": true, "duration": 3600}'
```

## 📈 Monitoring and Analytics

### Key Metrics to Track

1. **Event Processing Rate**
   - Events received per minute
   - Processing latency
   - Success/failure rates

2. **Business Metrics**
   - Revenue per day/week/month
   - Payment success rates
   - Customer growth rate

3. **System Health**
   - Webhook delivery success rate
   - API response times
   - Error rates

### Alerts Configuration

Set up alerts for:

- High error rates (> 5%)
- Processing delays (> 30 seconds)
- Missing events (gaps in expected data)

## 🔗 Related Documentation

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [The New Fuse API Reference](../api/endpoints.md)
- [Event Processing Guide](../development/architecture.md)
- [Monitoring Setup](../deployment/monitoring.md)

## 💡 Advanced Configuration

### Custom Event Mapping

Override default event mapping:

```javascript
// webhook-config.js
const customEventMapping = {
  'payment_intent.succeeded': {
    businessEventType: 'revenue_generated',
    priority: 'high',
    automation: ['update_crm', 'send_receipt', 'update_analytics']
  }
};
```

### Conditional Processing

Process events based on conditions:

```javascript
// Only process payments above $100
const shouldProcess = (event) => {
  if (event.type === 'payment_intent.succeeded') {
    return event.data.object.amount >= 10000; // $100 in cents
  }
  return true;
};
```

---

*For additional support, contact The New Fuse support team or refer to the [troubleshooting guide](../development/troubleshooting.md).*

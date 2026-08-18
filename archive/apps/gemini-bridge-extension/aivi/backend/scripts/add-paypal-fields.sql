-- Migration: Add PayPal support to subscriptions table
-- Date: 2026-01-30

-- Add PayPal-specific fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS paypal_plan_id VARCHAR(255);

-- Create indexes for PayPal fields
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);

-- Update the unique constraint to allow NULL for stripe_subscription_id
-- since subscriptions can be either Stripe OR PayPal
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_stripe_subscription_id_key;

-- Add conditional unique constraint for Stripe subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_unique
ON subscriptions(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

-- Add conditional unique constraint for PayPal subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_paypal_unique
ON subscriptions(paypal_subscription_id)
WHERE paypal_subscription_id IS NOT NULL;

-- Add check constraint to ensure at least one subscription ID is present
ALTER TABLE subscriptions
ADD CONSTRAINT check_subscription_id
CHECK (
  stripe_subscription_id IS NOT NULL OR
  paypal_subscription_id IS NOT NULL
);

COMMENT ON COLUMN subscriptions.paypal_subscription_id IS 'PayPal subscription ID for PayPal-based subscriptions';
COMMENT ON COLUMN subscriptions.paypal_plan_id IS 'PayPal plan ID that defines the subscription tier and billing period';

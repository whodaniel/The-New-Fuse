import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const TNF_BILLING = {
  website: 'https://thenewfuse.com',
  pricing: 'https://thenewfuse.com/pricing',
  apiServicePath: 'apps/api/src/modules/billing/paypal.service.ts',
  apiControllerPath: 'apps/api/src/modules/billing/paypal.controller.ts',
};

router.get('/status', protect, async (req, res) => {
  res.json({
    success: true,
    data: {
      subscription: { tier: 'free', status: 'legacy_adapter' },
      features: {
        dailyLimit: 20,
        concurrentProcesses: 1,
        notebooklmIntegration: false,
      },
      tnfBilling: TNF_BILLING,
      message: 'Legacy subscription route is adapter-only. Use TNF billing module.',
    },
  });
});

router.post('/checkout', protect, async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Legacy checkout disabled. Use TNF billing.',
      tnfPricingUrl: TNF_BILLING.pricing,
      tnfServicePath: TNF_BILLING.apiServicePath,
      tnfControllerPath: TNF_BILLING.apiControllerPath,
    },
  });
});

router.post('/cancel', protect, async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Legacy cancellation disabled. Use TNF billing.',
      tnfWebsite: TNF_BILLING.website,
      tnfControllerPath: TNF_BILLING.apiControllerPath,
    },
  });
});

router.get('/pricing', (req, res) => {
  res.json({
    success: true,
    data: {
      learnMoreUrl: TNF_BILLING.pricing,
      tnfBilling: TNF_BILLING,
      note: 'Pricing is managed by TNF platform billing.',
    },
  });
});

export default router;

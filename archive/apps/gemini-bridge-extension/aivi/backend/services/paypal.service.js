/**
 * Legacy AIVI PayPal service is intentionally replaced by TNF billing.
 *
 * Source of truth in TNF:
 * - apps/api/src/modules/billing/paypal.service.ts
 * - apps/api/src/modules/billing/paypal.controller.ts
 */

const TNF_BILLING_REF = {
  servicePath: 'apps/api/src/modules/billing/paypal.service.ts',
  controllerPath: 'apps/api/src/modules/billing/paypal.controller.ts',
  website: 'https://thenewfuse.com',
};

class LegacyPayPalServiceAdapter {
  constructor() {
    this.ref = TNF_BILLING_REF;
  }

  async createSubscription() {
    throw new Error(
      `Legacy PayPal service disabled. Use TNF billing module at ${this.ref.servicePath}.`
    );
  }

  async createOrder() {
    throw new Error(
      `Legacy PayPal order flow disabled. Use TNF billing module at ${this.ref.servicePath}.`
    );
  }

  async captureOrder() {
    throw new Error(
      `Legacy PayPal capture flow disabled. Use TNF billing module at ${this.ref.servicePath}.`
    );
  }
}

export default new LegacyPayPalServiceAdapter();

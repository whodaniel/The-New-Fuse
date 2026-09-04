import { Controller, HttpStatus, Inject, Post, Req, Res } from '@nestjs/common';
import { users } from '@the-new-fuse/database/drizzle/schema';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
// Inject Drizzle instance based on how it's configured in your app
import { DRIZZLE_CLIENT, DrizzleClient } from '@the-new-fuse/database';

// NOTE: You will need to set process.env.STRIPE_SECRET_KEY and process.env.STRIPE_WEBHOOK_SECRET
import Stripe from 'stripe';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private stripe: Stripe | null;

  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleClient) {
    // Stripe's SDK throws synchronously on an empty apiKey (unlike most other
    // optional-integration clients in this app), which used to crash the
    // entire Nest DI container at boot whenever STRIPE_SECRET_KEY wasn't set —
    // taking down every other controller with it. Only construct the client
    // when a key is actually configured; handleStripeWebhook below reports a
    // clear 503 instead of throwing when it isn't.
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, {
          // @ts-ignore - Ignore exact string match requirement for beta api versions
          apiVersion: '2026-08-26.dahlia',
        })
      : null;
  }

  @Post()
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
    if (!this.stripe) {
      return res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .send('Stripe is not configured on this server (missing STRIPE_SECRET_KEY).');
    }

    const sig = req.headers['stripe-signature'] as string;

    let event;
    try {
      // @ts-ignore - Stripe requires raw body. Ensure you have a middleware for this route if it fails.
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id; // Passed when creating the payment link

      if (userId) {
        // Update user's extension license status in the database
        await this.db.update(users).set({ hasExtensionLicense: true }).where(eq(users.id, userId));

        console.log(`[Stripe] User ${userId} just purchased the Pro extension!`);
      } else {
        console.warn(
          '[Stripe] Received successful checkout session but no client_reference_id was attached.'
        );
      }
    }

    res.status(HttpStatus.OK).json({ received: true });
  }
}

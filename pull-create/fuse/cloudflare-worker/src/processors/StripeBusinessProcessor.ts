/**
 * Stripe Business Processor
 * Handles Stripe webhook events and converts them to business events
 */

import type { Env } from '../types/env';
import type { BusinessEvent, StripeWebhookPayload, BusinessEventType, EventPriority, ProcessingStatus } from '../types/business-events';
import { Logger } from '../utils/Logger';
import { generateId } from '../utils/helpers';

export class StripeBusinessProcessor {
  constructor(private env: Env, private logger: Logger) {}

  async processWebhook(payload: StripeWebhookPayload): Promise<BusinessEvent> {
    try {
      this.logger.info(`Processing Stripe webhook: ${payload.type}`, { eventId: payload.id });

      const businessEvent: BusinessEvent = {
        id: generateId(),
        type: this.mapStripeEvent(payload.type),
        source: 'stripe',
        timestamp: new Date(payload.created * 1000),
        data: payload.data.object,
        metadata: {
          correlation_id: payload.id,
          organization_id: this.extractOrgFromStripe(payload.data.object),
          priority: this.getStripeEventPriority(payload.type),
          retry_count: 0,
          max_retries: 5
        },
        processing_status: 'pending'
      };

      // Process specific event types
      switch (payload.type) {
        case 'payment_intent.succeeded':
          await this.processPaymentSuccess(businessEvent, payload);
          break;
        case 'invoice.payment_succeeded':
          await this.processInvoicePayment(businessEvent, payload);
          break;
        case 'customer.subscription.updated':
          await this.processSubscriptionChange(businessEvent, payload);
          break;
        case 'invoice.created':
          await this.processInvoiceCreated(businessEvent, payload);
          break;
        case 'customer.created':
          await this.processCustomerCreated(businessEvent, payload);
          break;
        case 'charge.dispute.created':
          await this.processDispute(businessEvent, payload);
          break;
        default:
          this.logger.info(`Unhandled Stripe event type: ${payload.type}`);
      }

      businessEvent.processing_status = 'completed';
      return businessEvent;

    } catch (error) {
      this.logger.error(`Failed to process Stripe webhook:`, error);
      throw error;
    }
  }

  private mapStripeEvent(stripeEventType: string): BusinessEventType {
    const mapping: Record<string, BusinessEventType> = {
      'payment_intent.succeeded': 'payment_received',
      'invoice.payment_succeeded': 'payment_received',
      'customer.subscription.updated': 'subscription_changed',
      'invoice.created': 'invoice_generated',
      'customer.created': 'customer_updated'
    };
    return mapping[stripeEventType] || 'payment_received';
  }

  private extractOrgFromStripe(stripeObject: any): string {
    // Extract organization ID from Stripe metadata or customer data
    return stripeObject.metadata?.organization_id || 
           stripeObject.customer?.metadata?.organization_id || 
           'default_org';
  }

  private getStripeEventPriority(eventType: string): EventPriority {
    const highPriority = [
      'payment_intent.succeeded',
      'invoice.payment_succeeded',
      'charge.dispute.created'
    ];
    
    return highPriority.includes(eventType) ? 'high' : 'medium';
  }

  private async processPaymentSuccess(event: BusinessEvent, payload: StripeWebhookPayload): Promise<void> {
    const paymentIntent = payload.data.object;
    
    // Extract payment details
    event.data = {
      ...event.data,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_id: paymentIntent.customer,
      payment_method: paymentIntent.payment_method,
      description: paymentIntent.description,
      receipt_email: paymentIntent.receipt_email,
      business_context: {
        revenue_amount: paymentIntent.amount / 100, // Convert cents to dollars
        payment_date: new Date(payload.created * 1000),
        customer_lifetime_value_impact: this.calculateLTVImpact(paymentIntent)
      }
    };

    // Trigger follow-up actions
    await this.triggerPaymentFollowUp(event);
  }

  private async processInvoicePayment(event: BusinessEvent, payload: StripeWebhookPayload): Promise<void> {
    const invoice = payload.data.object;
    
    event.data = {
      ...event.data,
      invoice_number: invoice.number,
      amount_paid: invoice.amount_paid,
      customer_id: invoice.customer,
      subscription_id: invoice.subscription,
      business_context: {
        mrr_impact: this.calculateMRRImpact(invoice),
        billing_period: {
          start: new Date(invoice.period_start * 1000),
          end: new Date(invoice.period_end * 1000)
        }
      }
    };
  }

  private async processSubscriptionChange(event: BusinessEvent, payload: StripeWebhookPayload): Promise<void> {
    const subscription = payload.data.object;
    const previousAttributes = payload.data.previous_attributes;
    
    event.data = {
      ...event.data,
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      changes: previousAttributes,
      business_context: {
        churn_risk: this.assessChurnRisk(subscription, previousAttributes),
        revenue_impact: this.calculateRevenueImpact(subscription, previousAttributes)
      }
    };
  }

  private async processInvoiceCreated(event: BusinessEvent, payload: StripeWebhookPayload): Promise<void> {
    const invoice = payload.data.object;
    
    event.data = {
      ...event.data,
      invoice_id: invoice.id,
      customer_id: invoice.customer,
      amount_due: invoice.amount_due,
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      business_context: {
        payment_prediction: await this.predictPaymentSuccess(invoice),
        collection_risk: this.assessCollectionRisk(invoice)
      }
    };
  }

  private async processCustomerCreated(event: BusinessEvent, payload: StripeWebhookPayload): Promise<void> {
    const customer = payload.data.object;
    
    event.data = {
      ...event.data,
      customer_id: customer.id,
      email: customer.email,
      name: customer.name,
      business_context: {
        lead_score: await this.calculateLeadScore(customer),
        onboarding_tasks: this.generateOnboardingTasks(customer)
      }
    };
  }

  private async processDispute(event: BusinessEvent, payload: StripeWebhookPayload): Promise<void> {
    const dispute = payload.data.object;
    
    event.data = {
      ...event.data,
      dispute_id: dispute.id,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
      evidence_due_by: new Date(dispute.evidence_details.due_by * 1000),
      business_context: {
        risk_level: 'critical',
        required_actions: ['collect_evidence', 'notify_legal', 'contact_customer']
      }
    };

    // Set priority to critical for disputes
    event.metadata.priority = 'critical';
  }

  private calculateLTVImpact(paymentIntent: any): number {
    // Simple LTV calculation - in practice, this would be more sophisticated
    const baseAmount = paymentIntent.amount / 100;
    return baseAmount * 3; // Assume 3x multiplier for LTV impact
  }

  private calculateMRRImpact(invoice: any): number {
    // Calculate Monthly Recurring Revenue impact
    if (invoice.subscription) {
      return invoice.amount_paid / 100; // Monthly impact
    }
    return 0;
  }

  private assessChurnRisk(subscription: any, previousAttributes: any): string {
    if (previousAttributes?.status && subscription.status === 'past_due') {
      return 'high';
    }
    if (subscription.cancel_at_period_end) {
      return 'medium';
    }
    return 'low';
  }

  private calculateRevenueImpact(subscription: any, previousAttributes: any): number {
    // Calculate revenue impact of subscription changes
    if (previousAttributes?.items) {
      // Compare pricing changes
      // This is a simplified version - real implementation would be more complex
      return 0;
    }
    return 0;
  }

  private async predictPaymentSuccess(invoice: any): Promise<number> {
    // AI-powered payment prediction
    // This would integrate with ML models in production
    const riskFactors = {
      pastDueHistory: 0.1,
      customerAge: 0.2,
      paymentMethodReliability: 0.3
    };
    
    return 0.85; // 85% prediction confidence
  }

  private assessCollectionRisk(invoice: any): string {
    const amount = invoice.amount_due / 100;
    if (amount > 10000) return 'high';
    if (amount > 1000) return 'medium';
    return 'low';
  }

  private async calculateLeadScore(customer: any): Promise<number> {
    // Lead scoring algorithm
    let score = 50; // Base score
    
    if (customer.email?.includes('gmail')) score -= 10;
    if (customer.email?.match(/\.(com|org|net)$/)) score += 10;
    if (customer.name) score += 15;
    
    return Math.min(score, 100);
  }

  private generateOnboardingTasks(customer: any): string[] {
    return [
      'send_welcome_email',
      'setup_billing_profile',
      'schedule_onboarding_call',
      'provide_getting_started_guide'
    ];
  }

  private async triggerPaymentFollowUp(event: BusinessEvent): Promise<void> {
    // Trigger follow-up actions like sending receipts, updating CRM, etc.
    this.logger.info(`Triggering payment follow-up actions for event: ${event.id}`);
  }

  async retryProcessing(event: BusinessEvent): Promise<BusinessEvent> {
    // Implement retry logic for failed Stripe events
    event.processing_status = 'processing';
    
    try {
      // Re-process the event with the same logic
      // In practice, you might want to fetch fresh data from Stripe
      event.processing_status = 'completed';
      return event;
    } catch (error) {
      event.processing_status = 'failed';
      throw error;
    }
  }
}
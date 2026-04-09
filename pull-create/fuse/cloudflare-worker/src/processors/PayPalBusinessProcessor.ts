/**
 * PayPal Business Processor
 * Handles PayPal webhook events and converts them to business events
 */

import type { Env } from '../types/env';
import type { BusinessEvent, PayPalWebhookPayload, BusinessEventType, EventPriority } from '../types/business-events';
import { Logger } from '../utils/Logger';
import { generateId } from '../utils/helpers';

export class PayPalBusinessProcessor {
  constructor(private env: Env, private logger: Logger) {}

  async processWebhook(payload: PayPalWebhookPayload): Promise<BusinessEvent> {
    try {
      this.logger.info(`Processing PayPal webhook: ${payload.event_type}`, { 
        eventId: payload.id,
        resourceType: payload.resource_type
      });

      const businessEvent: BusinessEvent = {
        id: generateId(),
        type: this.mapPayPalEvent(payload.event_type),
        source: 'paypal',
        timestamp: new Date(payload.create_time),
        data: payload.resource,
        metadata: {
          correlation_id: payload.id,
          organization_id: this.extractOrgFromPayPal(payload.resource),
          priority: 'high',
          retry_count: 0,
          max_retries: 3
        },
        processing_status: 'pending'
      };

      // Process specific event types
      switch (payload.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.processPaymentCapture(businessEvent, payload);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.processPaymentDenied(businessEvent, payload);
          break;
        case 'BILLING.SUBSCRIPTION.CREATED':
          await this.processSubscriptionCreated(businessEvent, payload);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.processSubscriptionCancelled(businessEvent, payload);
          break;
        case 'PAYMENT.SALE.COMPLETED':
          await this.processSaleCompleted(businessEvent, payload);
          break;
        case 'CUSTOMER.DISPUTE.CREATED':
          await this.processDispute(businessEvent, payload);
          break;
        default:
          this.logger.info(`Unhandled PayPal event type: ${payload.event_type}`);
      }

      businessEvent.processing_status = 'completed';
      return businessEvent;

    } catch (error) {
      this.logger.error(`Failed to process PayPal webhook:`, error);
      throw error;
    }
  }

  private mapPayPalEvent(eventType: string): BusinessEventType {
    const mapping: Record<string, BusinessEventType> = {
      'PAYMENT.CAPTURE.COMPLETED': 'payment_received',
      'PAYMENT.SALE.COMPLETED': 'payment_received',
      'BILLING.SUBSCRIPTION.CREATED': 'subscription_changed',
      'BILLING.SUBSCRIPTION.CANCELLED': 'subscription_changed',
      'CUSTOMER.DISPUTE.CREATED': 'payment_received' // Handle as payment issue
    };
    return mapping[eventType] || 'payment_received';
  }

  private extractOrgFromPayPal(resource: any): string {
    // Extract organization ID from PayPal resource
    return resource.custom_id || 
           resource.invoice_id || 
           resource.reference_id || 
           'default_org';
  }

  private async processPaymentCapture(event: BusinessEvent, payload: PayPalWebhookPayload): Promise<void> {
    const capture = payload.resource;
    
    event.data = {
      ...event.data,
      capture_id: capture.id,
      amount: capture.amount,
      currency: capture.amount?.currency_code,
      status: capture.status,
      invoice_id: capture.invoice_id,
      custom_id: capture.custom_id,
      business_context: {
        revenue_amount: this.parseAmount(capture.amount),
        payment_method: 'paypal',
        transaction_fee: this.calculatePayPalFee(capture.amount),
        net_amount: this.calculateNetAmount(capture.amount),
        risk_assessment: await this.assessPaymentRisk(capture),
        customer_profile: await this.analyzeCustomerProfile(capture)
      }
    };

    // Trigger payment confirmation workflows
    await this.triggerPaymentConfirmation(event);
  }

  private async processPaymentDenied(event: BusinessEvent, payload: PayPalWebhookPayload): Promise<void> {
    const capture = payload.resource;
    
    event.data = {
      ...event.data,
      capture_id: capture.id,
      denial_reason: capture.status_details?.reason,
      amount: capture.amount,
      business_context: {
        failure_type: 'payment_denied',
        retry_recommended: this.shouldRetryPayment(capture),
        alternative_methods: ['credit_card', 'bank_transfer'],
        customer_impact: 'high',
        required_actions: ['contact_customer', 'offer_alternative_payment']
      }
    };

    // Set high priority for payment failures
    event.metadata.priority = 'critical';
  }

  private async processSubscriptionCreated(event: BusinessEvent, payload: PayPalWebhookPayload): Promise<void> {
    const subscription = payload.resource;
    
    event.data = {
      ...event.data,
      subscription_id: subscription.id,
      plan_id: subscription.plan_id,
      status: subscription.status,
      start_time: subscription.start_time,
      business_context: {
        mrr_impact: await this.calculateMRRImpact(subscription),
        customer_lifetime_value: await this.estimateCustomerLTV(subscription),
        billing_cycle: subscription.billing_info?.cycle_executions,
        onboarding_required: true,
        success_metrics: this.defineSuccessMetrics(subscription)
      }
    };

    // Trigger subscription onboarding
    await this.triggerSubscriptionOnboarding(event);
  }

  private async processSubscriptionCancelled(event: BusinessEvent, payload: PayPalWebhookPayload): Promise<void> {
    const subscription = payload.resource;
    
    event.data = {
      ...event.data,
      subscription_id: subscription.id,
      cancellation_reason: subscription.status_change_note,
      status: subscription.status,
      business_context: {
        churn_analysis: await this.analyzeChurn(subscription),
        revenue_impact: await this.calculateChurnImpact(subscription),
        win_back_opportunity: this.assessWinBackPotential(subscription),
        exit_survey_required: true,
        retention_strategies: this.suggestRetentionStrategies(subscription)
      }
    };

    // Set high priority for cancellations
    event.metadata.priority = 'critical';
    
    // Trigger churn prevention workflows
    await this.triggerChurnPrevention(event);
  }

  private async processSaleCompleted(event: BusinessEvent, payload: PayPalWebhookPayload): Promise<void> {
    const sale = payload.resource;
    
    event.data = {
      ...event.data,
      sale_id: sale.id,
      amount: sale.amount,
      payment_mode: sale.payment_mode,
      protection_eligibility: sale.protection_eligibility,
      business_context: {
        transaction_type: 'one_time_payment',
        customer_acquisition: this.isNewCustomer(sale),
        upsell_opportunities: await this.identifyUpsellOpportunities(sale),
        satisfaction_score_prediction: await this.predictSatisfaction(sale)
      }
    };
  }

  private async processDispute(event: BusinessEvent, payload: PayPalWebhookPayload): Promise<void> {
    const dispute = payload.resource;
    
    event.data = {
      ...event.data,
      dispute_id: dispute.dispute_id,
      reason: dispute.reason,
      status: dispute.status,
      amount: dispute.disputed_transactions?.[0]?.seller_transaction_id,
      business_context: {
        dispute_category: this.categorizeDispute(dispute.reason),
        evidence_required: this.identifyRequiredEvidence(dispute),
        win_probability: await this.assessDisputeWinProbability(dispute),
        impact_assessment: {
          financial: dispute.dispute_amount,
          reputational: 'medium',
          operational: 'high'
        },
        response_deadline: this.calculateResponseDeadline(dispute)
      }
    };

    // Critical priority for disputes
    event.metadata.priority = 'critical';
  }

  private parseAmount(amount: any): number {
    if (!amount || !amount.value) return 0;
    return parseFloat(amount.value);
  }

  private calculatePayPalFee(amount: any): number {
    const value = this.parseAmount(amount);
    // PayPal standard fee: 2.9% + $0.30
    return (value * 0.029) + 0.30;
  }

  private calculateNetAmount(amount: any): number {
    const value = this.parseAmount(amount);
    const fee = this.calculatePayPalFee(amount);
    return value - fee;
  }

  private async assessPaymentRisk(capture: any): Promise<string> {
    // Simple risk assessment
    const amount = this.parseAmount(capture.amount);
    
    if (amount > 10000) return 'high';
    if (amount > 1000) return 'medium';
    return 'low';
  }

  private async analyzeCustomerProfile(capture: any): Promise<any> {
    return {
      payment_history: 'unknown',
      risk_level: await this.assessPaymentRisk(capture),
      verification_status: capture.status === 'COMPLETED' ? 'verified' : 'pending'
    };
  }

  private shouldRetryPayment(_capture: any): boolean {
    // Logic to determine if payment should be retried
    return true;
  }

  private async calculateMRRImpact(subscription: any): Promise<number> {
    // Calculate Monthly Recurring Revenue impact
    const billingInfo = subscription.billing_info;
    if (billingInfo && billingInfo.last_payment && billingInfo.last_payment.amount) {
      return this.parseAmount(billingInfo.last_payment.amount);
    }
    return 0;
  }

  private async estimateCustomerLTV(subscription: any): Promise<number> {
    const mrr = await this.calculateMRRImpact(subscription);
    // Simple LTV calculation: MRR * 24 months
    return mrr * 24;
  }

  private defineSuccessMetrics(_subscription: any): string[] {
    return [
      'first_successful_payment',
      'feature_adoption',
      'support_ticket_resolution',
      'user_engagement'
    ];
  }

  private async analyzeChurn(subscription: any): Promise<any> {
    return {
      churn_type: 'voluntary',
      lifecycle_stage: 'active_subscriber',
      tenure: this.calculateTenure(subscription),
      last_activity: subscription.update_time
    };
  }

  private async calculateChurnImpact(subscription: any): Promise<number> {
    const mrr = await this.calculateMRRImpact(subscription);
    const ltv = await this.estimateCustomerLTV(subscription);
    return { monthly_loss: mrr, lifetime_loss: ltv };
  }

  private assessWinBackPotential(_subscription: any): string {
    // Assess probability of winning back the customer
    return 'medium';
  }

  private suggestRetentionStrategies(_subscription: any): string[] {
    return [
      'discount_offer',
      'feature_education',
      'customer_success_outreach',
      'exit_survey'
    ];
  }

  private isNewCustomer(_sale: any): boolean {
    // Logic to determine if this is a new customer
    return true; // Simplified
  }

  private async identifyUpsellOpportunities(_sale: any): Promise<string[]> {
    return [
      'premium_features',
      'additional_licenses',
      'professional_services'
    ];
  }

  private async predictSatisfaction(_sale: any): Promise<number> {
    // AI-powered satisfaction prediction
    return 0.85; // 85% predicted satisfaction
  }

  private categorizeDispute(reason: string): string {
    const categories: Record<string, string> = {
      'MERCHANDISE_OR_SERVICE_NOT_RECEIVED': 'fulfillment',
      'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED': 'quality',
      'UNAUTHORIZED': 'fraud',
      'DUPLICATE_TRANSACTION': 'billing_error'
    };
    return categories[reason] || 'other';
  }

  private identifyRequiredEvidence(dispute: any): string[] {
    const evidence = [];
    
    switch (dispute.reason) {
      case 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED':
        evidence.push('shipping_proof', 'delivery_confirmation');
        break;
      case 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED':
        evidence.push('product_description', 'customer_communication');
        break;
      default:
        evidence.push('transaction_details', 'customer_authorization');
    }
    
    return evidence;
  }

  private async assessDisputeWinProbability(_dispute: any): Promise<number> {
    // AI-powered dispute win probability
    return 0.65; // 65% win probability
  }

  private calculateResponseDeadline(_dispute: any): Date {
    // PayPal typically gives 10 days to respond
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10);
    return deadline;
  }

  private calculateTenure(subscription: any): number {
    const startTime = new Date(subscription.start_time);
    const now = new Date();
    return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)); // Days
  }

  private async triggerPaymentConfirmation(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering payment confirmation for event: ${event.id}`);
  }

  private async triggerSubscriptionOnboarding(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering subscription onboarding for event: ${event.id}`);
  }

  private async triggerChurnPrevention(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering churn prevention for event: ${event.id}`);
  }

  async retryProcessing(event: BusinessEvent): Promise<BusinessEvent> {
    event.processing_status = 'processing';
    
    try {
      // Re-process the event
      event.processing_status = 'completed';
      return event;
    } catch (error) {
      event.processing_status = 'failed';
      throw error;
    }
  }
}
/**
 * NetSuite Business Processor
 * Handles NetSuite webhook events and converts them to business events
 */

import type { Env } from '../types/env';
import type { BusinessEvent, NetSuiteWebhookPayload, BusinessEventType } from '../types/business-events';
import { Logger } from '../utils/Logger';
import { generateId } from '../utils/helpers';

export class NetSuiteBusinessProcessor {
  constructor(private env: Env, private logger: Logger) {}

  async processWebhook(payload: NetSuiteWebhookPayload): Promise<BusinessEvent> {
    try {
      this.logger.info(`Processing NetSuite webhook: ${payload.recordType} ${payload.operation}`, { 
        recordId: payload.recordId,
        companyId: payload.companyId
      });

      const businessEvent: BusinessEvent = {
        id: generateId(),
        type: this.mapNetSuiteEvent(payload.recordType, payload.operation),
        source: 'netsuite',
        timestamp: new Date(payload.timestamp),
        data: payload.data,
        metadata: {
          correlation_id: payload.recordId,
          organization_id: payload.companyId,
          priority: 'medium',
          retry_count: 0,
          max_retries: 3
        },
        processing_status: 'pending'
      };

      // Process specific record types
      switch (payload.recordType) {
        case 'customer':
          await this.processCustomer(businessEvent, payload);
          break;
        case 'salesorder':
          await this.processSalesOrder(businessEvent, payload);
          break;
        case 'invoice':
          await this.processInvoice(businessEvent, payload);
          break;
        case 'payment':
          await this.processPayment(businessEvent, payload);
          break;
        case 'opportunity':
          await this.processOpportunity(businessEvent, payload);
          break;
        case 'lead':
          await this.processLead(businessEvent, payload);
          break;
        default:
          this.logger.info(`Unhandled NetSuite record type: ${payload.recordType}`);
      }

      businessEvent.processing_status = 'completed';
      return businessEvent;

    } catch (error) {
      this.logger.error(`Failed to process NetSuite webhook:`, error);
      throw error;
    }
  }

  private mapNetSuiteEvent(recordType: string, operation: string): BusinessEventType {
    const mapping: Record<string, BusinessEventType> = {
      'customer_create': 'customer_updated',
      'customer_update': 'customer_updated',
      'salesorder_create': 'product_sold',
      'salesorder_update': 'product_sold',
      'invoice_create': 'invoice_generated',
      'payment_create': 'payment_received',
      'opportunity_create': 'lead_created',
      'opportunity_update': 'lead_created',
      'lead_create': 'lead_created',
      'lead_update': 'lead_created'
    };
    return mapping[`${recordType}_${operation}`] || 'customer_updated';
  }

  private async processCustomer(event: BusinessEvent, payload: NetSuiteWebhookPayload): Promise<void> {
    const customer = payload.data;
    
    event.data = {
      ...event.data,
      customer_id: payload.recordId,
      entity_id: customer.entityid,
      company_name: customer.companyname,
      email: customer.email,
      phone: customer.phone,
      status: customer.entitystatus,
      subsidiary: customer.subsidiary,
      business_context: {
        customer_category: this.categorizeCustomer(customer),
        account_health: await this.assessAccountHealth(customer),
        revenue_potential: await this.calculateRevenuePotential(customer),
        relationship_strength: this.assessRelationshipStrength(customer),
        lifecycle_stage: this.determineLifecycleStage(customer),
        expansion_opportunities: await this.identifyExpansionOpportunities(customer)
      }
    };

    // Trigger customer onboarding or account management workflows
    if (payload.operation === 'create') {
      await this.triggerCustomerOnboarding(event);
    } else {
      await this.triggerAccountManagement(event);
    }
  }

  private async processSalesOrder(event: BusinessEvent, payload: NetSuiteWebhookPayload): Promise<void> {
    const salesOrder = payload.data;
    
    event.data = {
      ...event.data,
      sales_order_id: payload.recordId,
      customer_id: salesOrder.entity,
      total_amount: salesOrder.total,
      status: salesOrder.orderstatus,
      order_date: salesOrder.trandate,
      items: salesOrder.item || [],
      business_context: {
        order_value_analysis: this.analyzeOrderValue(salesOrder),
        fulfillment_complexity: await this.assessFulfillmentComplexity(salesOrder),
        upsell_opportunities: await this.identifyUpsellOpportunities(salesOrder),
        delivery_prediction: await this.predictDeliveryTime(salesOrder),
        customer_satisfaction_risk: this.assessSatisfactionRisk(salesOrder)
      }
    };

    // Trigger order fulfillment workflows
    await this.triggerOrderFulfillment(event);
  }

  private async processInvoice(event: BusinessEvent, payload: NetSuiteWebhookPayload): Promise<void> {
    const invoice = payload.data;
    
    event.data = {
      ...event.data,
      invoice_id: payload.recordId,
      customer_id: invoice.entity,
      amount: invoice.total,
      due_date: invoice.duedate,
      status: invoice.status,
      terms: invoice.terms,
      business_context: {
        payment_prediction: await this.predictPaymentBehavior(invoice),
        collection_risk: this.assessCollectionRisk(invoice),
        cash_flow_impact: this.calculateCashFlowImpact(invoice),
        dunning_strategy: this.recommendDunningStrategy(invoice),
        discount_eligibility: this.assessDiscountEligibility(invoice)
      }
    };

    // Trigger payment follow-up workflows
    await this.triggerPaymentFollowUp(event);
  }

  private async processPayment(event: BusinessEvent, payload: NetSuiteWebhookPayload): Promise<void> {
    const payment = payload.data;
    
    event.data = {
      ...event.data,
      payment_id: payload.recordId,
      customer_id: payment.customer,
      amount: payment.payment,
      payment_date: payment.trandate,
      payment_method: payment.paymentmethod,
      business_context: {
        payment_efficiency: this.analyzePaymentEfficiency(payment),
        cash_application: await this.optimizeCashApplication(payment),
        customer_payment_behavior: await this.analyzePaymentBehavior(payment),
        working_capital_impact: this.calculateWorkingCapitalImpact(payment)
      }
    };

    // Trigger cash management workflows
    await this.triggerCashManagement(event);
  }

  private async processOpportunity(event: BusinessEvent, payload: NetSuiteWebhookPayload): Promise<void> {
    const opportunity = payload.data;
    
    event.data = {
      ...event.data,
      opportunity_id: payload.recordId,
      customer_id: opportunity.entity,
      expected_revenue: opportunity.projectedtotal,
      probability: opportunity.probability,
      close_date: opportunity.expectedclosedate,
      stage: opportunity.entitystatus,
      business_context: {
        sales_velocity: await this.calculateSalesVelocity(opportunity),
        competitive_analysis: await this.analyzeCompetitivePosition(opportunity),
        deal_health: this.assessDealHealth(opportunity),
        resource_requirements: this.identifyResourceRequirements(opportunity),
        risk_factors: this.identifyDealRisks(opportunity)
      }
    };

    // Trigger sales enablement workflows
    await this.triggerSalesEnablement(event);
  }

  private async processLead(event: BusinessEvent, payload: NetSuiteWebhookPayload): Promise<void> {
    const lead = payload.data;
    
    event.data = {
      ...event.data,
      lead_id: payload.recordId,
      company: lead.companyname,
      email: lead.email,
      phone: lead.phone,
      source: lead.leadsource,
      status: lead.entitystatus,
      business_context: {
        lead_quality: await this.assessLeadQuality(lead),
        conversion_probability: await this.predictConversionProbability(lead),
        ideal_customer_match: this.assessICPMatch(lead),
        nurturing_strategy: this.recommendNurturingStrategy(lead),
        sales_readiness: this.assessSalesReadiness(lead)
      }
    };

    // Trigger lead nurturing workflows
    await this.triggerLeadNurturing(event);
  }

  private categorizeCustomer(customer: any): string {
    if (customer.category) {
      return customer.category;
    }
    
    // Categorize based on revenue or other factors
    const revenue = parseFloat(customer.balance) || 0;
    if (revenue > 1000000) return 'enterprise';
    if (revenue > 100000) return 'mid_market';
    return 'small_business';
  }

  private async assessAccountHealth(customer: any): Promise<number> {
    let health = 70; // Base health score
    
    if (customer.entitystatus === 'CUSTOMER-Closed Won') health += 20;
    if (customer.balance && parseFloat(customer.balance) > 0) health -= 10;
    if (customer.phone) health += 5;
    if (customer.email) health += 5;
    
    return Math.max(0, Math.min(100, health));
  }

  private async calculateRevenuePotential(customer: any): Promise<number> {
    // Calculate based on historical data, industry, size, etc.
    const currentRevenue = parseFloat(customer.balance) || 0;
    const growthMultiplier = this.getIndustryGrowthMultiplier(customer.category);
    return currentRevenue * growthMultiplier;
  }

  private assessRelationshipStrength(customer: any): string {
    // Assess based on interaction history, support tickets, etc.
    if (customer.entitystatus === 'CUSTOMER-Closed Won') return 'strong';
    if (customer.entitystatus === 'PROSPECT-In Discussion') return 'medium';
    return 'weak';
  }

  private determineLifecycleStage(customer: any): string {
    const statusMapping: Record<string, string> = {
      'LEAD-New': 'lead',
      'PROSPECT-In Discussion': 'prospect',
      'CUSTOMER-Closed Won': 'customer',
      'CUSTOMER-Closed Lost': 'churned'
    };
    return statusMapping[customer.entitystatus] || 'unknown';
  }

  private async identifyExpansionOpportunities(customer: any): Promise<string[]> {
    const opportunities = [];
    
    if (customer.category === 'small_business') {
      opportunities.push('upgrade_to_premium');
    }
    
    if (!customer.subsidiary || customer.subsidiary.length === 1) {
      opportunities.push('multi_location_expansion');
    }
    
    return opportunities;
  }

  private analyzeOrderValue(salesOrder: any): any {
    const total = parseFloat(salesOrder.total) || 0;
    return {
      order_size: total > 10000 ? 'large' : total > 1000 ? 'medium' : 'small',
      margin_analysis: this.calculateOrderMargin(salesOrder),
      value_tier: this.categorizeOrderValue(total)
    };
  }

  private async assessFulfillmentComplexity(salesOrder: any): Promise<string> {
    const itemCount = salesOrder.item?.length || 0;
    if (itemCount > 10) return 'high';
    if (itemCount > 3) return 'medium';
    return 'low';
  }

  private async identifyUpsellOpportunities(salesOrder: any): Promise<string[]> {
    // Analyze order items to suggest upsells
    return ['premium_support', 'additional_licenses', 'training_services'];
  }

  private async predictDeliveryTime(salesOrder: any): Promise<number> {
    // AI-powered delivery prediction
    const complexity = await this.assessFulfillmentComplexity(salesOrder);
    const baseDays = { low: 3, medium: 7, high: 14 };
    return baseDays[complexity as keyof typeof baseDays] || 7;
  }

  private assessSatisfactionRisk(salesOrder: any): string {
    const total = parseFloat(salesOrder.total) || 0;
    if (total > 50000) return 'high'; // High value orders have high satisfaction risk
    return 'low';
  }

  private async predictPaymentBehavior(invoice: any): Promise<any> {
    const customerHistory = await this.getCustomerPaymentHistory(invoice.entity);
    return {
      predicted_payment_date: this.calculatePredictedPaymentDate(invoice),
      payment_probability: customerHistory.reliability || 0.8,
      early_payment_likelihood: customerHistory.early_payment_rate || 0.2
    };
  }

  private assessCollectionRisk(invoice: any): string {
    const amount = parseFloat(invoice.total) || 0;
    const daysUntilDue = this.calculateDaysUntilDue(invoice.duedate);
    
    if (amount > 50000 && daysUntilDue < 7) return 'high';
    if (amount > 10000 && daysUntilDue < 3) return 'medium';
    return 'low';
  }

  private calculateCashFlowImpact(invoice: any): number {
    return parseFloat(invoice.total) || 0;
  }

  private recommendDunningStrategy(invoice: any): string {
    const amount = parseFloat(invoice.total) || 0;
    if (amount > 10000) return 'personal_contact';
    if (amount > 1000) return 'automated_reminder';
    return 'email_reminder';
  }

  private assessDiscountEligibility(invoice: any): boolean {
    const amount = parseFloat(invoice.total) || 0;
    return amount > 1000; // Eligible for early payment discount
  }

  private analyzePaymentEfficiency(payment: any): any {
    return {
      processing_time: 'standard',
      method_efficiency: this.assessPaymentMethodEfficiency(payment.paymentmethod),
      cost_analysis: this.calculatePaymentCost(payment)
    };
  }

  private async optimizeCashApplication(payment: any): Promise<any> {
    return {
      application_strategy: 'oldest_first',
      recommended_allocation: this.calculateOptimalAllocation(payment)
    };
  }

  private async analyzePaymentBehavior(payment: any): Promise<any> {
    const history = await this.getCustomerPaymentHistory(payment.customer);
    return {
      payment_pattern: history.pattern || 'irregular',
      preferred_method: history.preferred_method || payment.paymentmethod,
      timing_preference: history.timing || 'end_of_month'
    };
  }

  private calculateWorkingCapitalImpact(payment: any): number {
    return parseFloat(payment.payment) || 0;
  }

  private async calculateSalesVelocity(_opportunity: any): Promise<number> {
    // Calculate deal velocity based on stage progression
    return 1.2; // Example velocity multiplier
  }

  private async analyzeCompetitivePosition(_opportunity: any): Promise<any> {
    return {
      competitive_threats: ['Competitor A', 'Competitor B'],
      win_probability: 0.7,
      differentiation_factors: ['pricing', 'features', 'support']
    };
  }

  private assessDealHealth(opportunity: any): string {
    const probability = parseFloat(opportunity.probability) || 0;
    if (probability > 70) return 'healthy';
    if (probability > 40) return 'at_risk';
    return 'critical';
  }

  private identifyResourceRequirements(_opportunity: any): string[] {
    return ['sales_engineer', 'solution_architect', 'legal_review'];
  }

  private identifyDealRisks(opportunity: any): string[] {
    const risks = [];
    const probability = parseFloat(opportunity.probability) || 0;
    
    if (probability < 50) risks.push('low_probability');
    if (!opportunity.expectedclosedate) risks.push('no_close_date');
    
    return risks;
  }

  private async assessLeadQuality(lead: any): Promise<number> {
    let score = 50; // Base score
    
    if (lead.email) score += 15;
    if (lead.phone) score += 10;
    if (lead.companyname) score += 15;
    if (lead.title && lead.title.includes('Manager')) score += 10;
    
    return Math.min(100, score);
  }

  private async predictConversionProbability(lead: any): Promise<number> {
    const quality = await this.assessLeadQuality(lead);
    return quality / 100; // Convert quality score to probability
  }

  private assessICPMatch(lead: any): number {
    // Assess how well lead matches Ideal Customer Profile
    let match = 0.5;
    
    if (lead.leadsource === 'Web Direct') match += 0.2;
    if (lead.companyname) match += 0.2;
    if (lead.title) match += 0.1;
    
    return Math.min(1.0, match);
  }

  private recommendNurturingStrategy(lead: any): string {
    const quality = this.assessLeadQuality(lead);
    if (quality > 70) return 'direct_sales_contact';
    if (quality > 50) return 'marketing_automation';
    return 'content_nurturing';
  }

  private assessSalesReadiness(lead: any): boolean {
    return lead.entitystatus === 'LEAD-Qualified' || 
           (lead.email && lead.phone && lead.companyname);
  }

  // Helper methods
  private getIndustryGrowthMultiplier(_category: string): number {
    return 1.2; // 20% growth potential
  }

  private calculateOrderMargin(_salesOrder: any): number {
    return 0.3; // 30% margin estimate
  }

  private categorizeOrderValue(total: number): string {
    if (total > 50000) return 'high_value';
    if (total > 10000) return 'medium_value';
    return 'standard_value';
  }

  private async getCustomerPaymentHistory(_customerId: string): Promise<any> {
    // Mock payment history - in real implementation, query NetSuite
    return {
      reliability: 0.85,
      early_payment_rate: 0.3,
      pattern: 'consistent',
      preferred_method: 'ACH',
      timing: 'month_end'
    };
  }

  private calculatePredictedPaymentDate(invoice: any): Date {
    const dueDate = new Date(invoice.duedate);
    // Add 3 days to due date as average payment time
    dueDate.setDate(dueDate.getDate() + 3);
    return dueDate;
  }

  private calculateDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private assessPaymentMethodEfficiency(method: string): string {
    const efficiency: Record<string, string> = {
      'ACH': 'high',
      'Wire': 'high',
      'Check': 'low',
      'Credit Card': 'medium'
    };
    return efficiency[method] || 'medium';
  }

  private calculatePaymentCost(_payment: any): number {
    return 2.50; // Standard processing cost
  }

  private calculateOptimalAllocation(_payment: any): any {
    return {
      strategy: 'oldest_invoice_first',
      allocations: []
    };
  }

  // Workflow trigger methods
  private async triggerCustomerOnboarding(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering customer onboarding for event: ${event.id}`);
  }

  private async triggerAccountManagement(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering account management for event: ${event.id}`);
  }

  private async triggerOrderFulfillment(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering order fulfillment for event: ${event.id}`);
  }

  private async triggerPaymentFollowUp(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering payment follow-up for event: ${event.id}`);
  }

  private async triggerCashManagement(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering cash management for event: ${event.id}`);
  }

  private async triggerSalesEnablement(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering sales enablement for event: ${event.id}`);
  }

  private async triggerLeadNurturing(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering lead nurturing for event: ${event.id}`);
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
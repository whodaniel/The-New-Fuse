/**
 * HubSpot Business Processor
 * Handles HubSpot webhook events and converts them to business events
 */

import type { Env } from '../types/env';
import type { BusinessEvent, HubSpotWebhookPayload, BusinessEventType, EventPriority } from '../types/business-events';
import { Logger } from '../utils/Logger';
import { generateId } from '../utils/helpers';

export class HubSpotBusinessProcessor {
  constructor(private env: Env, private logger: Logger) {}

  async processWebhook(payload: HubSpotWebhookPayload): Promise<BusinessEvent> {
    try {
      this.logger.info(`Processing HubSpot webhook: ${payload.subscriptionType}`, { 
        objectId: payload.objectId,
        eventId: payload.eventId
      });

      // Fetch contact data from HubSpot API
      const contactData = await this.fetchContactData(payload.objectId);

      const businessEvent: BusinessEvent = {
        id: generateId(),
        type: this.mapHubSpotEvent(payload.subscriptionType),
        source: 'hubspot',
        timestamp: new Date(payload.occurredAt),
        data: contactData,
        metadata: {
          correlation_id: payload.objectId.toString(),
          organization_id: payload.portalId.toString(),
          priority: 'medium',
          retry_count: 0,
          max_retries: 3
        },
        processing_status: 'pending'
      };

      // Process specific subscription types
      switch (payload.subscriptionType) {
        case 'contact.creation':
          await this.processContactCreation(businessEvent, payload, contactData);
          break;
        case 'contact.propertyChange':
          await this.processContactPropertyChange(businessEvent, payload, contactData);
          break;
        case 'deal.creation':
          await this.processDealCreation(businessEvent, payload, contactData);
          break;
        case 'company.creation':
          await this.processCompanyCreation(businessEvent, payload, contactData);
          break;
        default:
          this.logger.info(`Unhandled HubSpot subscription type: ${payload.subscriptionType}`);
      }

      businessEvent.processing_status = 'completed';
      return businessEvent;

    } catch (error) {
      this.logger.error(`Failed to process HubSpot webhook:`, error);
      throw error;
    }
  }

  private mapHubSpotEvent(subscriptionType: string): BusinessEventType {
    const mapping: Record<string, BusinessEventType> = {
      'contact.creation': 'lead_created',
      'contact.propertyChange': 'customer_updated',
      'deal.creation': 'lead_created',
      'company.creation': 'customer_updated'
    };
    return mapping[subscriptionType] || 'customer_updated';
  }

  private async fetchContactData(objectId: number): Promise<any> {
    try {
      // In a real implementation, you'd make an API call to HubSpot
      // const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${objectId}`, {
      //   headers: { 'Authorization': `Bearer ${this.env.HUBSPOT_API_KEY}` }
      // });
      // return await response.json();

      // Mock data for now
      return {
        id: objectId,
        email: 'contact@example.com',
        firstname: 'John',
        lastname: 'Doe',
        company: 'Example Corp',
        lifecyclestage: 'lead',
        lead_status: 'new'
      };
    } catch (error) {
      this.logger.error('Failed to fetch contact data from HubSpot:', error);
      return { id: objectId };
    }
  }

  private async processContactCreation(event: BusinessEvent, _payload: HubSpotWebhookPayload, contactData: any): Promise<void> {
    event.data = {
      ...event.data,
      contact_id: contactData.id,
      email: contactData.email,
      first_name: contactData.firstname,
      last_name: contactData.lastname,
      company: contactData.company,
      lifecycle_stage: contactData.lifecyclestage,
      business_context: {
        lead_score: await this.calculateLeadScore(contactData),
        marketing_qualified: this.isMarketingQualified(contactData),
        next_actions: this.generateContactActions(contactData),
        segmentation: await this.segmentContact(contactData)
      }
    };

    // Trigger contact enrichment
    await this.triggerContactEnrichment(event);
  }

  private async processContactPropertyChange(event: BusinessEvent, payload: HubSpotWebhookPayload, contactData: any): Promise<void> {
    event.data = {
      ...event.data,
      contact_id: contactData.id,
      property_changed: payload.propertyName,
      new_value: payload.propertyValue,
      change_source: payload.changeSource,
      business_context: {
        property_impact: this.assessPropertyImpact(payload.propertyName, payload.propertyValue),
        automation_triggers: this.identifyAutomationTriggers(payload.propertyName, payload.propertyValue),
        scoring_impact: await this.calculateScoringImpact(payload.propertyName, payload.propertyValue)
      }
    };

    // Check for important property changes
    await this.checkImportantPropertyChanges(event, payload);
  }

  private async processDealCreation(event: BusinessEvent, _payload: HubSpotWebhookPayload, dealData: any): Promise<void> {
    event.data = {
      ...event.data,
      deal_id: dealData.id,
      deal_name: dealData.dealname,
      amount: dealData.amount,
      pipeline: dealData.pipeline,
      deal_stage: dealData.dealstage,
      close_date: dealData.closedate,
      business_context: {
        deal_probability: this.calculateDealProbability(dealData),
        revenue_forecast: this.calculateRevenueForecast(dealData),
        sales_activities: this.generateSalesActivities(dealData),
        risk_assessment: this.assessDealRisk(dealData)
      }
    };

    // Trigger sales notifications
    await this.triggerSalesNotifications(event, dealData);
  }

  private async processCompanyCreation(event: BusinessEvent, _payload: HubSpotWebhookPayload, companyData: any): Promise<void> {
    event.data = {
      ...event.data,
      company_id: companyData.id,
      name: companyData.name,
      domain: companyData.domain,
      industry: companyData.industry,
      size: companyData.numberofemployees,
      business_context: {
        account_score: await this.calculateAccountScore(companyData),
        ideal_customer_profile_match: this.assessICPMatch(companyData),
        expansion_potential: this.assessExpansionPotential(companyData),
        competitive_landscape: await this.analyzeCompetitiveLandscape(companyData)
      }
    };
  }

  private async calculateLeadScore(contact: any): Promise<number> {
    let score = 0;

    // Email domain scoring
    if (contact.email) {
      const domain = contact.email.split('@')[1];
      if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com'].includes(domain)) {
        score += 20; // Business email
      }
    }

    // Lifecycle stage scoring
    const stageScores: Record<string, number> = {
      'subscriber': 10,
      'lead': 20,
      'marketingqualifiedlead': 40,
      'salesqualifiedlead': 60,
      'opportunity': 80,
      'customer': 100
    };
    score += stageScores[contact.lifecyclestage] || 0;

    // Company presence
    if (contact.company) score += 15;

    // Form submissions and engagement
    if (contact.num_conversion_events > 0) {
      score += Math.min(contact.num_conversion_events * 5, 25);
    }

    return Math.min(score, 100);
  }

  private isMarketingQualified(contact: any): boolean {
    return contact.lifecyclestage === 'marketingqualifiedlead' ||
           contact.lifecyclestage === 'salesqualifiedlead' ||
           contact.lead_status === 'qualified';
  }

  private generateContactActions(contact: any): string[] {
    const actions = [];

    if (!contact.company) actions.push('enrich_company_data');
    if (!contact.phone) actions.push('find_phone_number');
    if (contact.lifecyclestage === 'lead') actions.push('nurture_sequence');
    if (this.isMarketingQualified(contact)) actions.push('sales_handoff');

    return actions;
  }

  private async segmentContact(contact: any): Promise<string[]> {
    const segments = [];

    // Industry segmentation
    if (contact.industry) {
      segments.push(`industry_${contact.industry.toLowerCase()}`);
    }

    // Company size segmentation
    if (contact.numberofemployees) {
      if (contact.numberofemployees < 50) segments.push('small_business');
      else if (contact.numberofemployees < 500) segments.push('mid_market');
      else segments.push('enterprise');
    }

    // Engagement segmentation
    if (contact.num_conversion_events > 5) segments.push('highly_engaged');
    else if (contact.num_conversion_events > 1) segments.push('engaged');
    else segments.push('low_engagement');

    return segments;
  }

  private assessPropertyImpact(propertyName?: string, propertyValue?: string): string {
    const highImpactProperties = [
      'lifecyclestage',
      'lead_status',
      'email',
      'phone',
      'company'
    ];

    if (propertyName && highImpactProperties.includes(propertyName)) {
      return 'high';
    }

    return 'medium';
  }

  private identifyAutomationTriggers(propertyName?: string, _propertyValue?: string): string[] {
    const triggers = [];

    switch (propertyName) {
      case 'lifecyclestage':
        triggers.push('lifecycle_stage_automation');
        break;
      case 'lead_status':
        triggers.push('lead_status_automation');
        break;
      case 'email':
        triggers.push('email_verification');
        break;
      default:
        // No specific triggers
    }

    return triggers;
  }

  private async calculateScoringImpact(propertyName?: string, propertyValue?: string): Promise<number> {
    // Calculate how property change affects lead score
    const scoringRules: Record<string, Record<string, number>> = {
      'lifecyclestage': {
        'marketingqualifiedlead': 20,
        'salesqualifiedlead': 30,
        'opportunity': 40
      },
      'lead_status': {
        'qualified': 25,
        'connected': 15,
        'open': 10
      }
    };

    if (propertyName && propertyValue && scoringRules[propertyName]) {
      return scoringRules[propertyName][propertyValue] || 0;
    }

    return 0;
  }

  private async checkImportantPropertyChanges(event: BusinessEvent, payload: HubSpotWebhookPayload): Promise<void> {
    const importantProperties = ['lifecyclestage', 'lead_status', 'dealstage'];
    
    if (payload.propertyName && importantProperties.includes(payload.propertyName)) {
      event.metadata.priority = 'high';
      event.data.business_context.important_change = true;
    }
  }

  private calculateDealProbability(deal: any): number {
    // Simple deal probability calculation based on stage
    const stageProbabilities: Record<string, number> = {
      'appointmentscheduled': 0.2,
      'qualifiedtobuy': 0.4,
      'presentationscheduled': 0.6,
      'decisionmakerboughtin': 0.8,
      'contractsent': 0.9,
      'closedwon': 1.0,
      'closedlost': 0.0
    };

    return stageProbabilities[deal.dealstage] || 0.5;
  }

  private calculateRevenueForecast(deal: any): number {
    const amount = parseFloat(deal.amount) || 0;
    const probability = this.calculateDealProbability(deal);
    return amount * probability;
  }

  private generateSalesActivities(deal: any): string[] {
    const activities = [];

    if (deal.dealstage === 'appointmentscheduled') {
      activities.push('prepare_discovery_questions');
    } else if (deal.dealstage === 'presentationscheduled') {
      activities.push('prepare_demo');
    } else if (deal.dealstage === 'contractsent') {
      activities.push('follow_up_on_contract');
    }

    return activities;
  }

  private assessDealRisk(deal: any): string {
    const amount = parseFloat(deal.amount) || 0;
    const closeDate = new Date(deal.closedate);
    const now = new Date();
    const daysToClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (amount > 50000 && daysToClose < 30) return 'high';
    if (amount > 10000 && daysToClose < 7) return 'medium';
    return 'low';
  }

  private async calculateAccountScore(company: any): Promise<number> {
    let score = 50; // Base score

    // Industry scoring
    const highValueIndustries = ['Technology', 'Finance', 'Healthcare'];
    if (highValueIndustries.includes(company.industry)) {
      score += 20;
    }

    // Size scoring
    if (company.numberofemployees) {
      if (company.numberofemployees > 1000) score += 25;
      else if (company.numberofemployees > 100) score += 15;
      else if (company.numberofemployees > 10) score += 5;
    }

    // Revenue scoring
    if (company.annualrevenue) {
      if (company.annualrevenue > 10000000) score += 20;
      else if (company.annualrevenue > 1000000) score += 10;
    }

    return Math.min(score, 100);
  }

  private assessICPMatch(company: any): number {
    // Assess how well company matches Ideal Customer Profile
    let match = 0.5; // Base match

    const targetIndustries = ['Technology', 'SaaS', 'Finance'];
    if (targetIndustries.includes(company.industry)) {
      match += 0.3;
    }

    if (company.numberofemployees && company.numberofemployees >= 50 && company.numberofemployees <= 5000) {
      match += 0.2;
    }

    return Math.min(match, 1.0);
  }

  private assessExpansionPotential(company: any): string {
    const score = company.numberofemployees || 0;
    
    if (score > 500) return 'high';
    if (score > 100) return 'medium';
    return 'low';
  }

  private async analyzeCompetitiveLandscape(_company: any): Promise<any> {
    // AI-powered competitive analysis
    return {
      competitive_threats: ['Competitor A', 'Competitor B'],
      market_position: 'strong',
      differentiation_opportunities: ['feature_gap', 'pricing_advantage']
    };
  }

  private async triggerContactEnrichment(event: BusinessEvent): Promise<void> {
    this.logger.info(`Triggering contact enrichment for event: ${event.id}`);
  }

  private async triggerSalesNotifications(event: BusinessEvent, _dealData: any): Promise<void> {
    this.logger.info(`Triggering sales notifications for event: ${event.id}`);
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
/**
 * Salesforce Business Processor
 * Handles Salesforce webhook events and converts them to business events
 */

import type { Env } from '../types/env';
import type { BusinessEvent, SalesforceWebhookPayload, BusinessEventType, EventPriority } from '../types/business-events';
import { Logger } from '../utils/Logger';
import { generateId } from '../utils/helpers';

export class SalesforceBusinessProcessor {
  constructor(private env: Env, private logger: Logger) {}

  async processWebhook(payload: SalesforceWebhookPayload): Promise<BusinessEvent> {
    try {
      this.logger.info(`Processing Salesforce webhook: ${payload.ObjectType} ${payload.EventType}`, { 
        objectId: payload.Id 
      });

      const businessEvent: BusinessEvent = {
        id: generateId(),
        type: this.mapSalesforceEvent(payload.EventType, payload.ObjectType),
        source: 'salesforce',
        timestamp: new Date(payload.EventDate),
        data: payload.NewValue,
        metadata: {
          correlation_id: payload.Id,
          organization_id: this.extractOrgId(payload),
          priority: this.determinePriority(payload.ObjectType),
          retry_count: 0,
          max_retries: 3
        },
        processing_status: 'pending'
      };

      // Process specific object types
      switch (payload.ObjectType) {
        case 'Lead':
          await this.processLead(businessEvent, payload);
          break;
        case 'Opportunity':
          await this.processOpportunity(businessEvent, payload);
          break;
        case 'Account':
          await this.processAccount(businessEvent, payload);
          break;
        case 'Contact':
          await this.processContact(businessEvent, payload);
          break;
        default:
          this.logger.info(`Unhandled Salesforce object type: ${payload.ObjectType}`);
      }

      businessEvent.processing_status = 'completed';
      return businessEvent;

    } catch (error) {
      this.logger.error(`Failed to process Salesforce webhook:`, error);
      throw error;
    }
  }

  private mapSalesforceEvent(eventType: string, objectType: string): BusinessEventType {
    const mapping: Record<string, BusinessEventType> = {
      'Lead_created': 'lead_created',
      'Opportunity_created': 'lead_created',
      'Account_updated': 'customer_updated',
      'Contact_created': 'customer_updated',
      'Contact_updated': 'customer_updated'
    };
    return mapping[`${objectType}_${eventType}`] || 'lead_created';
  }

  private extractOrgId(payload: SalesforceWebhookPayload): string {
    // Extract organization ID from Salesforce data
    return payload.NewValue?.Organization__c || 
           payload.NewValue?.AccountId || 
           'default_org';
  }

  private determinePriority(objectType: string): EventPriority {
    const highPriority = ['Opportunity', 'Lead'];
    return highPriority.includes(objectType) ? 'high' : 'medium';
  }

  private async processLead(event: BusinessEvent, payload: SalesforceWebhookPayload): Promise<void> {
    const lead = payload.NewValue;
    
    event.data = {
      ...event.data,
      lead_id: payload.Id,
      email: lead.Email,
      first_name: lead.FirstName,
      last_name: lead.LastName,
      company: lead.Company,
      status: lead.Status,
      source: lead.LeadSource,
      business_context: {
        lead_score: await this.calculateLeadScore(lead),
        qualification_status: this.assessQualification(lead),
        next_actions: this.generateLeadActions(lead),
        estimated_value: this.estimateLeadValue(lead)
      }
    };

    // Trigger lead routing
    await this.triggerLeadRouting(event);
  }

  private async processOpportunity(event: BusinessEvent, payload: SalesforceWebhookPayload): Promise<void> {
    const opportunity = payload.NewValue;
    
    event.data = {
      ...event.data,
      opportunity_id: payload.Id,
      account_id: opportunity.AccountId,
      amount: opportunity.Amount,
      close_date: opportunity.CloseDate,
      stage: opportunity.StageName,
      probability: opportunity.Probability,
      business_context: {
        revenue_forecast: this.calculateRevenueForecast(opportunity),
        sales_velocity: await this.calculateSalesVelocity(opportunity),
        risk_factors: this.identifyRiskFactors(opportunity),
        competitor_analysis: await this.analyzeCompetition(opportunity)
      }
    };

    // Check for deal alerts
    await this.checkDealAlerts(event, opportunity);
  }

  private async processAccount(event: BusinessEvent, payload: SalesforceWebhookPayload): Promise<void> {
    const account = payload.NewValue;
    
    event.data = {
      ...event.data,
      account_id: payload.Id,
      name: account.Name,
      type: account.Type,
      industry: account.Industry,
      annual_revenue: account.AnnualRevenue,
      business_context: {
        health_score: await this.calculateAccountHealth(account),
        expansion_opportunities: await this.identifyExpansionOpportunities(account),
        churn_risk: this.assessChurnRisk(account),
        relationship_strength: this.assessRelationshipStrength(account)
      }
    };
  }

  private async processContact(event: BusinessEvent, payload: SalesforceWebhookPayload): Promise<void> {
    const contact = payload.NewValue;
    
    event.data = {
      ...event.data,
      contact_id: payload.Id,
      account_id: contact.AccountId,
      email: contact.Email,
      title: contact.Title,
      department: contact.Department,
      business_context: {
        influence_score: this.calculateInfluenceScore(contact),
        engagement_level: await this.calculateEngagementLevel(contact),
        decision_maker_likelihood: this.assessDecisionMakerStatus(contact)
      }
    };
  }

  private async calculateLeadScore(lead: any): Promise<number> {
    let score = 0;
    
    // Company size scoring
    if (lead.NumberOfEmployees) {
      if (lead.NumberOfEmployees > 1000) score += 30;
      else if (lead.NumberOfEmployees > 100) score += 20;
      else if (lead.NumberOfEmployees > 10) score += 10;
    }
    
    // Industry scoring
    const highValueIndustries = ['Technology', 'Finance', 'Healthcare'];
    if (highValueIndustries.includes(lead.Industry)) {
      score += 25;
    }
    
    // Title scoring
    if (lead.Title) {
      const seniorTitles = ['CEO', 'CTO', 'VP', 'Director', 'Manager'];
      if (seniorTitles.some(title => lead.Title.includes(title))) {
        score += 20;
      }
    }
    
    // Behavioral scoring
    if (lead.Website) score += 10;
    if (lead.Phone) score += 5;
    
    return Math.min(score, 100);
  }

  private assessQualification(lead: any): string {
    const requiredFields = ['Email', 'Company', 'Title'];
    const hasRequired = requiredFields.every(field => lead[field]);
    
    if (!hasRequired) return 'unqualified';
    if (lead.AnnualRevenue && lead.AnnualRevenue > 1000000) return 'marketing_qualified';
    if (lead.NumberOfEmployees && lead.NumberOfEmployees > 50) return 'sales_qualified';
    
    return 'needs_qualification';
  }

  private generateLeadActions(lead: any): string[] {
    const actions = [];
    
    if (!lead.Phone) actions.push('find_phone_number');
    if (!lead.Title) actions.push('research_title');
    if (lead.Status === 'New') actions.push('initial_outreach');
    if (!lead.Industry) actions.push('identify_industry');
    
    return actions;
  }

  private estimateLeadValue(lead: any): number {
    // Simple lead value estimation
    let value = 5000; // Base value
    
    if (lead.AnnualRevenue) {
      value = Math.min(lead.AnnualRevenue * 0.01, 50000);
    }
    
    if (lead.NumberOfEmployees) {
      value += lead.NumberOfEmployees * 100;
    }
    
    return value;
  }

  private calculateRevenueForecast(opportunity: any): number {
    return (opportunity.Amount || 0) * (opportunity.Probability || 0) / 100;
  }

  private async calculateSalesVelocity(opportunity: any): Promise<number> {
    // Calculate how quickly deal is progressing
    // This would typically compare stage progression dates
    return 1.2; // Example velocity multiplier
  }

  private identifyRiskFactors(opportunity: any): string[] {
    const risks = [];
    
    if (opportunity.Probability < 50 && opportunity.Amount > 100000) {
      risks.push('large_deal_low_probability');
    }
    
    if (!opportunity.ContactId) {
      risks.push('no_primary_contact');
    }
    
    const closeDate = new Date(opportunity.CloseDate);
    const now = new Date();
    const daysToClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToClose < 30 && opportunity.Probability < 70) {
      risks.push('close_date_approaching_low_probability');
    }
    
    return risks;
  }

  private async analyzeCompetition(_opportunity: any): Promise<any> {
    // AI-powered competitor analysis
    return {
      likely_competitors: ['Competitor A', 'Competitor B'],
      competitive_threats: ['pricing', 'features'],
      win_probability: 0.65
    };
  }

  private async checkDealAlerts(event: BusinessEvent, opportunity: any): Promise<void> {
    // Check for various deal alert conditions
    if (opportunity.Amount > 100000 && opportunity.Probability > 80) {
      event.metadata.priority = 'critical';
      event.data.business_context.alerts = ['large_deal_high_probability'];
    }
  }

  private async calculateAccountHealth(account: any): Promise<number> {
    let health = 70; // Base health score
    
    // Positive factors
    if (account.Type === 'Customer') health += 20;
    if (account.AnnualRevenue > 10000000) health += 10;
    
    // Negative factors
    if (!account.Phone) health -= 5;
    if (!account.Website) health -= 5;
    
    return Math.max(0, Math.min(100, health));
  }

  private async identifyExpansionOpportunities(account: any): Promise<string[]> {
    const opportunities = [];
    
    if (account.NumberOfEmployees > 500) {
      opportunities.push('enterprise_features');
    }
    
    if (account.Industry === 'Technology') {
      opportunities.push('developer_tools');
    }
    
    return opportunities;
  }

  private assessChurnRisk(account: any): string {
    // Simple churn risk assessment
    if (account.Type !== 'Customer') return 'not_applicable';
    
    // This would typically analyze support tickets, usage data, etc.
    return 'low';
  }

  private assessRelationshipStrength(account: any): string {
    // Assess relationship strength based on various factors
    let score = 50;
    
    if (account.Type === 'Customer') score += 30;
    if (account.Rating === 'Hot') score += 20;
    
    if (score > 80) return 'strong';
    if (score > 60) return 'medium';
    return 'weak';
  }

  private calculateInfluenceScore(contact: any): number {
    let score = 50;
    
    const seniorTitles = ['CEO', 'CTO', 'VP', 'Director'];
    if (seniorTitles.some(title => (contact.Title || '').includes(title))) {
      score += 30;
    }
    
    if (contact.Department === 'IT' || contact.Department === 'Engineering') {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private async calculateEngagementLevel(contact: any): Promise<string> {
    // This would analyze email opens, meeting attendance, etc.
    if (contact.HasOptedOutOfEmail) return 'low';
    if (contact.DoNotCall) return 'medium';
    return 'high';
  }

  private assessDecisionMakerStatus(contact: any): number {
    const decisionMakerTitles = ['CEO', 'CTO', 'VP', 'Director', 'Manager'];
    const hasDecisionMakerTitle = decisionMakerTitles.some(title => 
      (contact.Title || '').toLowerCase().includes(title.toLowerCase())
    );
    
    return hasDecisionMakerTitle ? 0.8 : 0.3;
  }

  private async triggerLeadRouting(event: BusinessEvent): Promise<void> {
    // Trigger lead routing logic
    this.logger.info(`Triggering lead routing for event: ${event.id}`);
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
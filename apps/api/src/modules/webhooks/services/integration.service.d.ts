import { BusinessEvent, IntegrationSource } from '@the-new-fuse/types';
export declare class IntegrationService {
    private readonly logger;
    transformToBusinessEvent(source: IntegrationSource, payload: any, organizationId: string): Promise<Omit<BusinessEvent, 'id' | 'timestamp'>>;
    private transformStripeEvent;
    private transformPayPalEvent;
    private transformSalesforceEvent;
    private transformHubSpotEvent;
    private transformPipedriveEvent;
    private transformSquareEvent;
    private transformNetSuiteEvent;
    private transformSAPEvent;
    private transformQuickBooksEvent;
    private transformZapierEvent;
    private transformWorkatoEvent;
    private transformPowerAutomateEvent;
    private mapStripeEventType;
    private mapPayPalEventType;
    private mapSalesforceEventType;
    private mapHubSpotEventType;
    private mapPipedriveEventType;
    private mapSquareEventType;
    private mapNetSuiteEventType;
    private mapSAPEventType;
    private mapQuickBooksEventType;
    private determinePriority;
}
//# sourceMappingURL=integration.service.d.ts.map
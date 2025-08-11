export var BusinessEventType;
(function (BusinessEventType) {
    BusinessEventType["LEAD_CREATED"] = "lead_created";
    BusinessEventType["PAYMENT_RECEIVED"] = "payment_received";
    BusinessEventType["INVOICE_GENERATED"] = "invoice_generated";
    BusinessEventType["WORKFLOW_TRIGGERED"] = "workflow_triggered";
    BusinessEventType["CUSTOMER_UPDATED"] = "customer_updated";
    BusinessEventType["PRODUCT_SOLD"] = "product_sold";
    BusinessEventType["SUBSCRIPTION_CHANGED"] = "subscription_changed";
})(BusinessEventType || (BusinessEventType = {}));
export var IntegrationSource;
(function (IntegrationSource) {
    IntegrationSource["SALESFORCE"] = "salesforce";
    IntegrationSource["HUBSPOT"] = "hubspot";
    IntegrationSource["PIPEDRIVE"] = "pipedrive";
    IntegrationSource["STRIPE"] = "stripe";
    IntegrationSource["PAYPAL"] = "paypal";
    IntegrationSource["SQUARE"] = "square";
    IntegrationSource["NETSUITE"] = "netsuite";
    IntegrationSource["SAP"] = "sap";
    IntegrationSource["QUICKBOOKS"] = "quickbooks";
    IntegrationSource["ZAPIER"] = "zapier";
    IntegrationSource["WORKATO"] = "workato";
    IntegrationSource["POWER_AUTOMATE"] = "power_automate";
})(IntegrationSource || (IntegrationSource = {}));
export var EventPriority;
(function (EventPriority) {
    EventPriority["LOW"] = "low";
    EventPriority["MEDIUM"] = "medium";
    EventPriority["HIGH"] = "high";
    EventPriority["CRITICAL"] = "critical";
})(EventPriority || (EventPriority = {}));
export var ProcessingStatus;
(function (ProcessingStatus) {
    ProcessingStatus["PENDING"] = "pending";
    ProcessingStatus["PROCESSING"] = "processing";
    ProcessingStatus["COMPLETED"] = "completed";
    ProcessingStatus["FAILED"] = "failed";
    ProcessingStatus["RETRYING"] = "retrying";
})(ProcessingStatus || (ProcessingStatus = {}));
export var InsightType;
(function (InsightType) {
    InsightType["REVENUE_OPPORTUNITY"] = "revenue_opportunity";
    InsightType["CHURN_RISK"] = "churn_risk";
    InsightType["PROCESS_OPTIMIZATION"] = "process_optimization";
    InsightType["ANOMALY_DETECTION"] = "anomaly_detection";
    InsightType["CUSTOMER_BEHAVIOR"] = "customer_behavior";
})(InsightType || (InsightType = {}));
export var ImpactLevel;
(function (ImpactLevel) {
    ImpactLevel["LOW"] = "low";
    ImpactLevel["MEDIUM"] = "medium";
    ImpactLevel["HIGH"] = "high";
    ImpactLevel["CRITICAL"] = "critical";
})(ImpactLevel || (ImpactLevel = {}));
export var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["FAILED"] = "failed";
    DeliveryStatus["RETRYING"] = "retrying";
})(DeliveryStatus || (DeliveryStatus = {}));
//# sourceMappingURL=webhooks.js.map
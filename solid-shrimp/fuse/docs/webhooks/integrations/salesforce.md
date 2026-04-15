# Salesforce Integration Setup Guide

This guide walks you through setting up Salesforce webhooks with The New Fuse platform to receive real-time CRM events and automate sales processes.

## 📋 Prerequisites

- Active Salesforce org (Developer, Professional, Enterprise, or Unlimited)
- System Administrator permissions in Salesforce
- The New Fuse API deployed and accessible
- Basic understanding of Salesforce Apex and Platform Events

## 🔧 Step-by-Step Setup

### 1. Create Platform Event in Salesforce

#### Navigate to Platform Events

1. Log into your Salesforce org
2. Go to **Setup** → **Platform Events**
3. Click **New Platform Event**

#### Configure Platform Event

```
Label: Business Event
API Name: Business_Event__e
Description: Platform event for The New Fuse integration

Fields:
- Event_Type__c (Text, 255) - Required
- Object_Type__c (Text, 255) - Required  
- Record_Id__c (Text, 18) - Required
- Old_Values__c (Long Text Area, 32768)
- New_Values__c (Long Text Area, 32768) - Required
- User_Id__c (Text, 18)
- Organization_Id__c (Text, 18)
```

### 2. Create Apex Trigger Handler

Create an Apex class to handle record changes and publish events:

```apex
public class BusinessEventHandler {
    
    public static void publishLeadEvent(List<Lead> newLeads, Map<Id, Lead> oldLeads, String eventType) {
        List<Business_Event__e> events = new List<Business_Event__e>();
        
        for (Lead lead : newLeads) {
            Business_Event__e event = new Business_Event__e(
                Event_Type__c = eventType,
                Object_Type__c = 'Lead',
                Record_Id__c = lead.Id,
                New_Values__c = JSON.serialize(lead),
                Old_Values__c = oldLeads != null ? JSON.serialize(oldLeads.get(lead.Id)) : null,
                User_Id__c = UserInfo.getUserId(),
                Organization_Id__c = UserInfo.getOrganizationId()
            );
            events.add(event);
        }
        
        if (!events.isEmpty()) {
            EventBus.publish(events);
        }
    }
    
    public static void publishOpportunityEvent(List<Opportunity> newOpps, Map<Id, Opportunity> oldOpps, String eventType) {
        List<Business_Event__e> events = new List<Business_Event__e>();
        
        for (Opportunity opp : newOpps) {
            Business_Event__e event = new Business_Event__e(
                Event_Type__c = eventType,
                Object_Type__c = 'Opportunity',
                Record_Id__c = opp.Id,
                New_Values__c = JSON.serialize(opp),
                Old_Values__c = oldOpps != null ? JSON.serialize(oldOpps.get(opp.Id)) : null,
                User_Id__c = UserInfo.getUserId(),
                Organization_Id__c = UserInfo.getOrganizationId()
            );
            events.add(event);
        }
        
        if (!events.isEmpty()) {
            EventBus.publish(events);
        }
    }
}
```

### 3. Create Object Triggers

#### Lead Trigger

```apex
trigger LeadTrigger on Lead (after insert, after update, after delete) {
    if (Trigger.isInsert) {
        BusinessEventHandler.publishLeadEvent(Trigger.new, null, 'created');
    } else if (Trigger.isUpdate) {
        BusinessEventHandler.publishLeadEvent(Trigger.new, Trigger.oldMap, 'updated');
    } else if (Trigger.isDelete) {
        BusinessEventHandler.publishLeadEvent(Trigger.old, null, 'deleted');
    }
}
```

#### Opportunity Trigger

```apex
trigger OpportunityTrigger on Opportunity (after insert, after update, after delete) {
    if (Trigger.isInsert) {
        BusinessEventHandler.publishOpportunityEvent(Trigger.new, null, 'created');
    } else if (Trigger.isUpdate) {
        BusinessEventHandler.publishOpportunityEvent(Trigger.new, Trigger.oldMap, 'updated');
    } else if (Trigger.isDelete) {
        BusinessEventHandler.publishOpportunityEvent(Trigger.old, null, 'deleted');
    }
}
```

### 4. Setup Change Data Capture (Alternative Method)

For organizations with Change Data Capture enabled:

1. Go to **Setup** → **Change Data Capture**
2. Select objects to monitor: **Lead**, **Opportunity**, **Account**, **Contact**
3. Click **Save**

### 5. Create Connected App

#### Setup Connected App

1. Go to **Setup** → **App Manager**
2. Click **New Connected App**
3. Configure:

```
Connected App Name: The New Fuse Integration
API Name: The_New_Fuse_Integration
Contact Email: your-email@company.com
Description: Integration with The New Fuse platform

OAuth Settings:
✓ Enable OAuth Settings
Callback URL: https://api.thenewfuse.com/auth/salesforce/callback
Selected OAuth Scopes:
- Access and manage your data (api)
- Access your basic information (id, profile, email, address, phone)
- Perform requests on your behalf at any time (refresh_token, offline_access)
```

### 6. Setup Platform Event Subscription

Create an Apex class to subscribe to platform events and send to The New Fuse:

```apex
public class TheNewFuseEventSubscriber {
    
    @future(callout=true)
    public static void sendToTheNewFuse(String eventData) {
        try {
            HttpRequest request = new HttpRequest();
            request.setEndpoint('https://api.thenewfuse.com/webhooks/incoming/salesforce');
            request.setMethod('POST');
            request.setHeader('Content-Type', 'application/json');
            request.setHeader('x-salesforce-webhook-signature', generateSignature(eventData));
            request.setBody(eventData);
            
            Http http = new Http();
            HttpResponse response = http.send(request);
            
            if (response.getStatusCode() != 200) {
                System.debug('Error sending to The New Fuse: ' + response.getBody());
            }
        } catch (Exception e) {
            System.debug('Exception sending to The New Fuse: ' + e.getMessage());
        }
    }
    
    private static String generateSignature(String payload) {
        // Implement HMAC-SHA256 signature generation
        String secret = 'your_webhook_secret'; // Store in Custom Metadata or Custom Settings
        Blob payloadBlob = Blob.valueOf(payload);
        Blob secretBlob = Blob.valueOf(secret);
        Blob signature = Crypto.generateMac('HmacSHA256', payloadBlob, secretBlob);
        return EncodingUtil.convertToHex(signature);
    }
}
```

### 7. Create Platform Event Trigger

```apex
trigger BusinessEventTrigger on Business_Event__e (after insert) {
    for (Business_Event__e event : Trigger.new) {
        Map<String, Object> eventData = new Map<String, Object>{
            'Id' => event.Record_Id__c,
            'ObjectType' => event.Object_Type__c,
            'EventType' => event.Event_Type__c,
            'NewValue' => JSON.deserializeUntyped(event.New_Values__c),
            'OldValue' => event.Old_Values__c != null ? JSON.deserializeUntyped(event.Old_Values__c) : null,
            'EventDate' => System.now().format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\''),
            'UserId' => event.User_Id__c,
            'OrganizationId' => event.Organization_Id__c
        };
        
        TheNewFuseEventSubscriber.sendToTheNewFuse(JSON.serialize(eventData));
    }
}
```

### 8. Configure The New Fuse

#### Environment Variables

Add to your `.env` file:

```bash
# Salesforce Configuration
SALESFORCE_WEBHOOK_SECRET=your_salesforce_webhook_secret
SALESFORCE_CLIENT_ID=your_connected_app_client_id
SALESFORCE_CLIENT_SECRET=your_connected_app_client_secret
SALESFORCE_USERNAME=your_salesforce_username
SALESFORCE_PASSWORD=your_salesforce_password
SALESFORCE_SECURITY_TOKEN=your_security_token
SALESFORCE_INSTANCE_URL=https://your-instance.salesforce.com
```

#### Register Webhook Configuration

```bash
curl -X POST https://api.thenewfuse.com/webhooks/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "salesforce",
    "endpoint_url": "https://api.thenewfuse.com/webhooks/incoming/salesforce",
    "secret_key": "your_salesforce_webhook_secret",
    "configuration": {
      "objects": ["Lead", "Opportunity", "Account", "Contact"],
      "events": ["created", "updated", "deleted"],
      "instance_url": "https://your-instance.salesforce.com",
      "api_version": "58.0"
    }
  }'
```

## 📊 Supported Event Types

### Lead Events

| Salesforce Event | Business Event Type | Description |
|------------------|-------------------|-------------|
| Lead Created | `lead_created` | New lead entered |
| Lead Updated | `lead_updated` | Lead information changed |
| Lead Converted | `lead_converted` | Lead converted to opportunity |

### Opportunity Events

| Salesforce Event | Business Event Type | Description |
|------------------|-------------------|-------------|
| Opportunity Created | `opportunity_created` | New opportunity |
| Opportunity Updated | `opportunity_updated` | Opportunity modified |
| Opportunity Won | `opportunity_won` | Deal closed won |
| Opportunity Lost | `opportunity_lost` | Deal closed lost |

### Account Events

| Salesforce Event | Business Event Type | Description |
|------------------|-------------------|-------------|
| Account Created | `customer_created` | New account/customer |
| Account Updated | `customer_updated` | Account information changed |

## 🔍 Event Payload Examples

### Lead Created Event

```json
{
  "Id": "00Q1a000002X3Y4",
  "ObjectType": "Lead",
  "EventType": "created",
  "NewValue": {
    "Id": "00Q1a000002X3Y4",
    "FirstName": "John",
    "LastName": "Doe",
    "Email": "john.doe@example.com",
    "Company": "Acme Corp",
    "Status": "Open - Not Contacted",
    "LeadSource": "Web"
  },
  "OldValue": null,
  "EventDate": "2024-01-15T10:30:00Z",
  "UserId": "0051a000001ABC",
  "OrganizationId": "00D1a000000XYZ"
}
```

### Opportunity Updated Event

```json
{
  "Id": "0061a000002B3C4",
  "ObjectType": "Opportunity",
  "EventType": "updated",
  "NewValue": {
    "Id": "0061a000002B3C4",
    "Name": "Acme Corp - 1000 Licenses",
    "StageName": "Proposal/Price Quote",
    "Amount": 50000,
    "CloseDate": "2024-02-15",
    "Probability": 75
  },
  "OldValue": {
    "StageName": "Needs Analysis",
    "Probability": 50
  },
  "EventDate": "2024-01-15T10:30:00Z"
}
```

## 🚀 Business Process Automation

### Sales Pipeline Tracking

- Monitor opportunity stage changes
- Track sales velocity and conversion rates
- Automated follow-up reminders

### Lead Management

- Lead scoring based on activities
- Automatic lead assignment
- Marketing qualified lead (MQL) notifications

### Revenue Analytics

- Real-time revenue forecasting
- Win/loss analysis
- Sales performance dashboards

## 🔐 Security Best Practices

### IP Allowlisting

Allowlist The New Fuse IP addresses in Salesforce:

1. Go to **Setup** → **Network Access**
2. Add The New Fuse server IPs to Trusted IP Ranges

### Field-Level Security

Control which fields are included in events:

1. Review field permissions for the integration user
2. Use custom settings to control field inclusion

### Audit Trail

Enable audit trail for webhook-related activities:

1. Go to **Setup** → **Security Controls** → **Field History Tracking**
2. Enable tracking for relevant objects and fields

## 🐛 Troubleshooting

### Common Issues

#### 1. Platform Events Not Publishing

```
Error: Unable to publish platform event
```

**Solutions:**

- Check user permissions for platform events
- Verify trigger is active and not hitting governor limits
- Review debug logs for specific errors

#### 2. Webhook Delivery Failures

```
Error: Callout failed or timeout
```

**Solutions:**

- Verify The New Fuse endpoint is accessible
- Check network connectivity from Salesforce
- Review Remote Site Settings configuration

#### 3. Signature Verification Failed

```
Error: Invalid webhook signature
```

**Solutions:**

- Verify webhook secret matches in both systems
- Check signature generation algorithm
- Ensure payload is not modified during transmission

### Debug Mode

Enable debug logging in Salesforce:

1. Go to **Setup** → **Debug Logs**
2. Create trace flag for integration user
3. Set log levels:
   - Apex Code: FINE
   - Callouts: INFO
   - System: DEBUG

## 📈 Monitoring and Analytics

### Salesforce Monitoring

1. **Platform Event Metrics**
   - Go to **Setup** → **Event Monitoring**
   - Monitor platform event usage and performance

2. **API Usage**
   - Monitor API calls in **Setup** → **System Overview**
   - Track callout limits and usage

### The New Fuse Dashboard

Monitor Salesforce events in The New Fuse:

- Event processing rates
- Integration health status
- Business metrics derived from Salesforce data

## 🔗 Advanced Configuration

### Custom Object Support

Extend integration to custom objects:

```apex
// Custom Object Trigger Example
trigger CustomObjectTrigger on Custom_Object__c (after insert, after update, after delete) {
    List<Business_Event__e> events = new List<Business_Event__e>();
    
    for (Custom_Object__c obj : Trigger.new) {
        Business_Event__e event = new Business_Event__e(
            Event_Type__c = Trigger.isInsert ? 'created' : 'updated',
            Object_Type__c = 'Custom_Object__c',
            Record_Id__c = obj.Id,
            New_Values__c = JSON.serialize(obj)
        );
        events.add(event);
    }
    
    EventBus.publish(events);
}
```

### Conditional Event Publishing

Only publish events that meet specific criteria:

```apex
public static Boolean shouldPublishEvent(SObject record, String eventType) {
    // Only publish high-value opportunities
    if (record instanceof Opportunity) {
        Opportunity opp = (Opportunity) record;
        return opp.Amount > 10000;
    }
    
    // Only publish qualified leads
    if (record instanceof Lead) {
        Lead lead = (Lead) record;
        return lead.Status == 'Qualified';
    }
    
    return true;
}
```

### Bulk Data Handling

Handle bulk operations efficiently:

```apex
public class BulkEventHandler {
    private static final Integer BATCH_SIZE = 100;
    
    public static void publishBulkEvents(List<SObject> records, String eventType, String objectType) {
        List<Business_Event__e> allEvents = new List<Business_Event__e>();
        
        for (SObject record : records) {
            Business_Event__e event = new Business_Event__e(
                Event_Type__c = eventType,
                Object_Type__c = objectType,
                Record_Id__c = record.Id,
                New_Values__c = JSON.serialize(record)
            );
            allEvents.add(event);
            
            // Publish in batches to avoid governor limits
            if (allEvents.size() >= BATCH_SIZE) {
                EventBus.publish(allEvents);
                allEvents.clear();
            }
        }
        
        // Publish remaining events
        if (!allEvents.isEmpty()) {
            EventBus.publish(allEvents);
        }
    }
}
```

## 📝 Testing

### Unit Tests

Create comprehensive unit tests:

```apex
@isTest
public class BusinessEventHandlerTest {
    
    @isTest
    static void testLeadEventPublishing() {
        // Create test lead
        Lead testLead = new Lead(
            FirstName = 'Test',
            LastName = 'Lead',
            Company = 'Test Company',
            Email = 'test@example.com'
        );
        
        Test.startTest();
        insert testLead;
        Test.stopTest();
        
        // Verify event was published
        // Note: Platform events are not queryable in tests
        // Use Test.getEventBus().deliver() to test subscribers
    }
}
```

### Integration Testing

Test end-to-end webhook delivery:

1. Create test records in Salesforce
2. Verify events appear in The New Fuse dashboard
3. Check event processing and business rule execution

---

*For additional support, contact The New Fuse support team or refer to the [Salesforce documentation](https://developer.salesforce.com/docs/atlas.en-us.platform_events.meta/platform_events/).*

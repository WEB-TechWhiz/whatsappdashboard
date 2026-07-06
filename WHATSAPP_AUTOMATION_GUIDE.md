# WhatsApp Automation Workflow Implementation Guide

## Overview

This comprehensive WhatsApp automation system enables intelligent, multi-workflow orchestration powered by AI. It goes beyond simple auto-replies to create a complete lead qualification, booking, sales, and support ecosystem.

## Architecture

### Core Components

1. **Webhook Handler** - Receives and parses incoming WhatsApp messages from Meta
2. **AI Analyzer** - Analyzes messages using Google Gemini for intent detection and entity extraction
3. **Workflow Engine** - Routes messages to appropriate automation workflows
4. **5 Automation Workflows**:
   - Lead Capture - Qualifies new prospects
   - Appointment Booking - Schedules and manages bookings
   - Product Inquiry - Handles sales questions and catalog browsing
   - FAQ - Provides instant answers to common questions
   - Feedback Collection - Gathers customer satisfaction data
5. **Routing Engine** - Escalates complex queries to human agents
6. **Database** - Stores rules, executions, leads, appointments, and analytics

## Setup Instructions

### 1. Environment Variables

Required environment variables in `.env`:

```env
# Google AI (for message analysis)
GOOGLE_AI_API_KEY=your_google_ai_key

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_ID=your_whatsapp_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Database
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# API
API_BASE_URL=https://api.yourdomain.com
FRONTEND_ORIGIN=https://app.yourdomain.com
```

### 2. Database Migration

Run the migration to create automation tables:

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < db/migrations/002_automation_workflows.sql
```

This creates:
- `automation_rules` - Workflow trigger definitions
- `automation_analyses` - AI analysis results
- `workflow_executions` - Execution tracking
- `whatsapp_templates` - Message templates
- `whatsapp_flows` - Interactive forms
- `flow_interactions` - User flow responses
- `automation_usage` - Daily metrics

### 3. Configure Webhook

Set up Meta webhook to receive messages:

1. In Meta App Dashboard, go to Webhooks
2. Set Callback URL: `https://yourdomain.com/api/v1/webhooks/whatsapp`
3. Set Verify Token: (use WHATSAPP_VERIFY_TOKEN from .env)
4. Subscribe to `messages` and `message_status` events

## API Endpoints

### Automation Rules

```
GET  /api/v1/automation/rules
POST /api/v1/automation/rules
PUT  /api/v1/automation/rules/:ruleId
DELETE /api/v1/automation/rules/:ruleId
```

### Message Analysis

```
POST /api/v1/automation/analyze
  body: { message, sender_name, phone_number }
  returns: { intent, sentiment, entities, confidence_score, ... }

POST /api/v1/automation/execute
  body: { conversation_id, message_id, phone_number, message, analysis }
  returns: { executed, executionId, workflowType, result }
```

### Lead Management

```
GET  /api/v1/automation/leads
GET  /api/v1/automation/leads/:leadId
POST /api/v1/automation/leads/:leadId/response
GET  /api/v1/automation/leads/statistics/overview
```

### Escalations & Routing

```
GET  /api/v1/automation/escalations
GET  /api/v1/automation/escalations/:escalationId
POST /api/v1/automation/escalations/:escalationId/reply
POST /api/v1/automation/escalations/:escalationId/resolve
GET  /api/v1/automation/escalations/statistics/overview
GET  /api/v1/automation/escalations/wait-time/estimate
```

## Workflow Details

### Lead Capture Workflow

**Trigger:** New contact messages with greeting or inquiry intent

**Process:**
1. Extract customer info (name, email, phone, interests)
2. Check for duplicates
3. Create lead record
4. Send qualification questions via WhatsApp Flow or text
5. Track lead status progression

**Lead Statuses:**
- `new` → Initial contact
- `qualified` → Information collected
- `ready_for_sales` → High-value lead
- `converted` → Became customer

**API:**
```
GET  /api/v1/automation/leads
GET  /api/v1/automation/leads/:leadId
POST /api/v1/automation/leads/:leadId/response
```

### Appointment Booking Workflow

**Trigger:** Messages containing booking/schedule keywords

**Process:**
1. Get available calendar slots
2. Send availability via WhatsApp Flow or text
3. Customer selects time
4. Create appointment record
5. Send confirmation
6. Schedule reminder (24hrs before)

**Features:**
- Real-time calendar integration
- Business hours customization
- Automatic no-show detection
- Reminder automation
- Rescheduling support

**Database Tables:**
- `appointments` - Booking records
- `appointment_reminders` - Reminder queue

### Product Inquiry Workflow

**Trigger:** Messages about products, pricing, or services

**Process:**
1. Search product catalog
2. Present matching products
3. Send product details/catalog flow
4. Track customer interest
5. Generate payment link if purchase intent

**Features:**
- Full-text search
- Semantic matching
- Catalog browsing
- Purchase tracking
- Revenue analytics

### FAQ Workflow

**Trigger:** Messages matching FAQ topics OR fallback for unknowns

**Process:**
1. Search FAQ database
2. Return best matching answer
3. If no match, generate AI response
4. Record unanswered questions for review
5. Ask for feedback

**Features:**
- Semantic FAQ matching
- AI fallback generation
- Usage analytics
- Identifies gaps in FAQ

### Feedback Collection Workflow

**Trigger:** After service completion or on-demand

**Process:**
1. Send feedback form (WhatsApp Flow preferred)
2. Collect rating and comment
3. Analyze sentiment
4. Store feedback
5. Generate insights

**Metrics:**
- Average rating
- Sentiment distribution
- Customer satisfaction trends

## Human Escalation

### When to Escalate

Messages are automatically escalated if:
- AI marks for escalation (confidence < threshold)
- Negative sentiment detected
- Intent classified as "complaint"
- Urgency level is "high"
- Complex scenario requiring human judgment

### Escalation Process

1. **Detection** - RoutingEngine.shouldEscalate() evaluates criteria
2. **Agent Assignment** - Find best available agent for issue type
3. **Notification** - Agent receives notification
4. **Customer Acknowledgment** - Customer gets case number
5. **Agent Reply** - Agent responds via WhatsApp
6. **Resolution** - Agent closes case

### Agent Management

Agents can be assigned specialties:
- `complaints` - Complaint handling
- `scheduling` - Appointment management
- `sales` - Product inquiries
- `billing` - Payment/billing issues
- `technical` - Technical support

## Configuration & Customization

### Creating Automation Rules

```javascript
POST /api/v1/automation/rules
{
  "name": "Welcome New Contacts",
  "description": "Greet new customers and qualify leads",
  "trigger_type": "message_received",
  "workflow_type": "lead_capture",
  "enabled": true,
  "workflow_config": {
    "send_welcome_message": true,
    "qualification_questions": ["budget", "timeline", "use_case"],
    "require_email": true
  }
}
```

### Business Hours Configuration

```javascript
{
  "timezone": "America/New_York",
  "business_hours": {
    "start": "09:00",
    "end": "17:00",
    "break_start": "12:00",
    "break_end": "13:00"
  },
  "holidays": ["2024-12-25", "2024-01-01"]
}
```

### FAQ Management

Populate FAQ table for semantic matching:
```sql
INSERT INTO faq_items (workspace_id, question, answer, published)
VALUES 
  (?, 'What are your hours?', 'We are open 9 AM - 5 PM EST, Monday-Friday', true),
  (?, 'Do you offer refunds?', 'Yes, 30-day money-back guarantee...', true);
```

### WhatsApp Flows

Create interactive forms using Meta's Flow Builder, then reference in configs:
- Lead capture form
- Appointment booking calendar
- Product selector
- Feedback survey

## Analytics & Monitoring

### Key Metrics

**Lead Capture:**
- Total leads captured
- Qualification rate
- Days to qualification
- Conversion rate

**Appointment Booking:**
- Bookings per day/week
- No-show rate
- Average booking lead time
- Cancellation rate

**Product Sales:**
- Total inquiries
- Conversion rate
- Average order value
- Revenue

**FAQ:**
- Questions resolved
- FAQ hit rate
- Unanswered questions
- Average response time

**Escalations:**
- Escalation rate
- Average resolution time
- Agent utilization
- Customer satisfaction

### Query Examples

```javascript
// Get daily automation metrics
GET /api/v1/automation/statistics?days_back=30

// Get lead statistics
GET /api/v1/automation/leads/statistics/overview?days_back=30

// Get escalation performance
GET /api/v1/automation/escalations/statistics/overview?days_back=30

// Get execution history
GET /api/v1/automation/executions?limit=50

// Get message analyses
GET /api/v1/automation/analyses?limit=50
```

## Error Handling & Debugging

### Common Issues

**1. Webhook not receiving messages**
- Verify webhook URL is accessible
- Check WHATSAPP_VERIFY_TOKEN matches Meta settings
- Ensure firewall allows Meta IP ranges

**2. AI analysis errors**
- Verify GOOGLE_AI_API_KEY is valid
- Check Google AI quota limits
- Review rate limiting

**3. Message send failures**
- Verify WHATSAPP_ACCESS_TOKEN is current
- Check message format (max 4096 chars)
- Ensure phone numbers include country code

**4. Escalation not routing**
- Verify agents exist with status='active'
- Check workspace_id matches
- Confirm agent specialties are set

### Debug Logging

Check application logs for `[Webhook]`, `[AI-Agent]`, `[Workflow]`, `[Routing]` prefixes:

```
[Webhook] Message processed from +1234567890
[AI-Agent] Message analyzed: intent=product_question, confidence=0.92
[Workflow] Executed product_inquiry in 245ms
[Routing] Conversation routed to agent: escalation_id_123
```

## Best Practices

1. **Template Approval** - All recurring messages must use Meta-approved templates
2. **Rate Limiting** - Implement backoff for API calls
3. **Privacy** - Never store sensitive data (card numbers, SSNs) in messages
4. **Personalization** - Use extracted names and interests in responses
5. **Escalation Threshold** - Tune confidence scores for your business
6. **FAQ Maintenance** - Review unanswered questions weekly
7. **Agent Training** - Ensure agents understand workflow context
8. **Monitoring** - Track metrics weekly to identify issues

## Next Steps

1. Configure WhatsApp Business API connection
2. Set up Google AI API key
3. Run database migration
4. Configure webhook on Meta
5. Create initial automation rules
6. Populate FAQ database
7. Set up business hours
8. Create WhatsApp Flows
9. Train support agents
10. Monitor analytics and iterate

## Support & Troubleshooting

For issues, check:
- Application logs: `/var/log/whatsapp-dashboard.log`
- Database: Query automation_analyses and workflow_executions
- Meta logs: Developer Dashboard > WhatsApp > Logs
- Google AI logs: Google Cloud Console

## Architecture Diagram

```
Customer Message (WhatsApp)
        ↓
Webhook Handler (/webhooks/whatsapp)
        ↓
AI Analyzer (Google Gemini)
  - Intent: greeting, inquiry, complaint, booking, product_question, feedback
  - Entities: email, phone, budget, product_interest, date_mentioned
  - Sentiment: positive, neutral, negative
  - Confidence Score: 0.0-1.0
        ↓
Workflow Engine
        ├─→ Lead Capture (if new contact)
        ├─→ Appointment Booking (if booking intent)
        ├─→ Product Inquiry (if sales intent)
        ├─→ FAQ (if known question)
        └─→ Feedback Collection (if feedback intent)
        ↓
Routing Engine
  - Check if escalation needed
  - Find best available agent
  - Create escalation record
  - Notify agent
        ↓
Database Storage
  - Log analysis
  - Store execution
  - Update metrics
        ↓
Response to Customer (via WhatsApp)
```

---

**Implementation Date:** Phase 2A-2D
**Status:** Production Ready
**Last Updated:** 2024

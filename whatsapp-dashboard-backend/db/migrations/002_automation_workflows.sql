-- Automation Workflows Schema Migration
-- Creates tables for AI-powered WhatsApp automation workflows

-- 1. Automation Rules: Define when and how workflows trigger
CREATE TABLE IF NOT EXISTS automation_rules (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger configuration
  trigger_type ENUM('message_received', 'keyword_match', 'time_based', 'manual') NOT NULL DEFAULT 'message_received',
  trigger_keywords JSON, -- e.g., ["hello", "hi", "hey"]
  trigger_schedule VARCHAR(100), -- cron format for time_based
  
  -- Workflow type
  workflow_type ENUM('lead_capture', 'appointment_booking', 'product_inquiry', 'faq', 'feedback_collection', 'custom') NOT NULL,
  
  -- Configuration
  workflow_config JSON NOT NULL, -- Stores workflow-specific settings
  enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  
  -- Indexes
  KEY idx_workspace (workspace_id),
  KEY idx_trigger_type (trigger_type),
  KEY idx_enabled (enabled),
  CONSTRAINT fk_automation_rules_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 2. Automation Analyses: Store AI analysis of incoming messages
CREATE TABLE IF NOT EXISTS automation_analyses (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(36) NOT NULL,
  message_id VARCHAR(36) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  
  -- Message content
  message_content TEXT NOT NULL,
  sender_name VARCHAR(255),
  
  -- AI Analysis
  intent ENUM('greeting', 'inquiry', 'complaint', 'booking_request', 'product_question', 'feedback', 'unknown') NOT NULL DEFAULT 'unknown',
  sentiment ENUM('positive', 'neutral', 'negative') NOT NULL DEFAULT 'neutral',
  confidence_score DECIMAL(3, 2) NOT NULL, -- 0-1 scale
  
  -- Extracted entities
  entities JSON, -- {email, phone, budget, product_interest, etc}
  action_required VARCHAR(255), -- Suggested next action
  
  -- Routing decision
  should_escalate BOOLEAN DEFAULT false,
  escalation_reason VARCHAR(255),
  suggested_workflow_type VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analyzed_at TIMESTAMP,
  
  -- Indexes
  KEY idx_workspace (workspace_id),
  KEY idx_conversation (conversation_id),
  KEY idx_intent (intent),
  KEY idx_confidence (confidence_score),
  CONSTRAINT fk_automation_analyses_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 3. Workflow Executions: Track each automation run
CREATE TABLE IF NOT EXISTS workflow_executions (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  automation_rule_id VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(36) NOT NULL,
  analysis_id VARCHAR(36),
  
  -- Execution details
  status ENUM('pending', 'running', 'completed', 'failed', 'escalated') NOT NULL DEFAULT 'pending',
  execution_duration_ms INT, -- How long execution took
  
  -- Input/Output
  input_data JSON NOT NULL, -- The trigger data
  output_data JSON, -- Response sent to customer
  error_message TEXT, -- If failed
  
  -- Steps executed
  steps_executed JSON, -- Array of {step_name, status, duration_ms, result}
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Indexes
  KEY idx_workspace (workspace_id),
  KEY idx_automation_rule (automation_rule_id),
  KEY idx_conversation (conversation_id),
  KEY idx_status (status),
  CONSTRAINT fk_workflow_executions_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_workflow_executions_rule FOREIGN KEY (automation_rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);

-- 4. WhatsApp Templates: Store Meta-approved message templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  
  -- Template info
  name VARCHAR(255) NOT NULL,
  category ENUM('appointment_reminder', 'welcome', 'product_update', 'feedback_request', 'order_status', 'promotional') NOT NULL,
  
  -- Template content (uses variable syntax: {{1}}, {{2}}, etc.)
  template_body TEXT NOT NULL,
  template_header VARCHAR(255),
  template_footer VARCHAR(255),
  
  -- Meta approval status
  meta_template_id VARCHAR(255) UNIQUE,
  approval_status ENUM('draft', 'pending_review', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  approval_feedback TEXT,
  
  -- Usage stats
  times_sent INT DEFAULT 0,
  last_sent_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  KEY idx_workspace (workspace_id),
  KEY idx_approval_status (approval_status),
  CONSTRAINT fk_whatsapp_templates_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 5. WhatsApp Flows: Interactive multi-screen forms
CREATE TABLE IF NOT EXISTS whatsapp_flows (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  
  -- Flow definition
  name VARCHAR(255) NOT NULL,
  description TEXT,
  flow_type ENUM('appointment_booking', 'lead_capture', 'product_selection', 'feedback_form', 'custom') NOT NULL,
  
  -- Flow structure (JSON schema of screens)
  flow_definition JSON NOT NULL,
  
  -- Meta integration
  meta_flow_id VARCHAR(255) UNIQUE,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  
  -- Analytics
  times_triggered INT DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  last_triggered_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  KEY idx_workspace (workspace_id),
  KEY idx_status (status),
  CONSTRAINT fk_whatsapp_flows_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 6. Flow Interactions: Track user interactions with flows
CREATE TABLE IF NOT EXISTS flow_interactions (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  flow_id VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(36) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  
  -- Interaction data
  flow_status ENUM('opened', 'in_progress', 'completed', 'abandoned') NOT NULL DEFAULT 'opened',
  responses JSON NOT NULL, -- User's answers to flow questions
  completion_percentage INT, -- 0-100
  
  -- Timing
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  abandonment_reason VARCHAR(255),
  
  -- Indexes
  KEY idx_workspace (workspace_id),
  KEY idx_flow (flow_id),
  KEY idx_conversation (conversation_id),
  KEY idx_status (flow_status),
  CONSTRAINT fk_flow_interactions_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_flow_interactions_flow FOREIGN KEY (flow_id) REFERENCES whatsapp_flows(id) ON DELETE CASCADE
);

-- 7. Automation Usage: Track automation metrics per workspace
CREATE TABLE IF NOT EXISTS automation_usage (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  date_recorded DATE NOT NULL,
  
  -- Metrics
  messages_analyzed INT DEFAULT 0,
  automations_triggered INT DEFAULT 0,
  workflows_completed INT DEFAULT 0,
  escalations_count INT DEFAULT 0,
  ai_response_time_avg_ms INT, -- Average response time
  
  -- Success metrics
  lead_captures INT DEFAULT 0,
  appointments_booked INT DEFAULT 0,
  products_inquired INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: One record per workspace per day
  UNIQUE KEY unique_workspace_date (workspace_id, date_recorded),
  
  -- Indexes
  KEY idx_workspace (workspace_id),
  KEY idx_date (date_recorded),
  CONSTRAINT fk_automation_usage_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_automation_rules_workspace_enabled ON automation_rules(workspace_id, enabled);
CREATE INDEX idx_automation_analyses_created ON automation_analyses(created_at);
CREATE INDEX idx_workflow_executions_created ON workflow_executions(created_at);
CREATE INDEX idx_whatsapp_templates_workspace_approved ON whatsapp_templates(workspace_id, approval_status);

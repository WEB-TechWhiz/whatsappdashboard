import pool from "../../src/config/db.js";
import { encrypt } from "../../src/utils/crypto.js";

if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
}

const mockEncryptedToken = encrypt("test_access_token_12345");

/**
 * In-memory mock database state and query simulator for backend testing.
 */
class MockDatabase {
  constructor() {
    this.reset();
  }

  reset() {
    this.workspaces = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Test Workspace",
        email: "test@example.com",
        password_hash: "$2b$12$eA32sXn.YhWThSAn328s7.sO6x5J5/rR5I3M28A7bXJkXm.123456", // "password123"
        avatar_url: null,
        auth_provider: "password",
        auto_reply: true,
        notify_new_leads: true,
        flag_leaks: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.workspaceSettings = [
      {
        workspace_id: "00000000-0000-0000-0000-000000000001",
        business_name: "Test Workspace",
        industry: "Technology",
        team_size: "1-5",
        onboarding_completed: true,
        features: JSON.stringify({ crm: true, whatsapp: true, analytics: true, reports: true }),
        whatsapp_phone: "+15550000000",
        whatsapp_api_token: "test-token",
        whatsapp_webhook_url: "https://example.com/webhook",
        auto_reply: true,
        notify_new_leads: true,
        flag_leaks: true,
        updated_at: new Date().toISOString(),
      },
    ];

    this.contacts = [
      {
        id: "contact-1",
        workspace_id: "00000000-0000-0000-0000-000000000001",
        phone: "+15550123456",
        name: "Aisha Khan",
        source: "Website",
        status: "Hot",
        deal_value: 500,
        unread_count: 1,
        opted_out: false,
        opted_out_reason: null,
        opted_out_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.contactPreferences = [
      {
        id: "pref-1",
        workspace_id: "00000000-0000-0000-0000-000000000001",
        contact_id: "contact-1",
        phone: "+15550123456",
        opted_out: false,
        opt_out_source: "SYSTEM",
        opt_out_reason: null,
        opted_out_at: null,
        opted_in_at: new Date().toISOString(),
      },
    ];

    this.leads = [
      {
        id: "lead-1",
        workspace_id: "00000000-0000-0000-0000-000000000001",
        contact_id: "contact-1",
        name: "Aisha Khan",
        phone: "+15550123456",
        source: "Website",
        status: "Hot",
        last_message: "Hi, I want pricing.",
        value: 500,
        deal_value: 500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.messages = [
      {
        id: "msg-1",
        workspace_id: "00000000-0000-0000-0000-000000000001",
        contact_id: "contact-1",
        text: "Hi, I want pricing.",
        body: "Hi, I want pricing.",
        is_agent: false,
        read: false,
        direction: "INBOUND",
        message_source: "CUSTOMER",
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    this.notifications = [
      {
        id: "notif-1",
        workspace_id: "00000000-0000-0000-0000-000000000001",
        title: "New Lead",
        message: "New lead Aisha Khan captured",
        type: "lead",
        read: false,
        created_at: new Date().toISOString(),
      },
    ];

    this.whatsappConnections = [
      {
        id: "conn-1",
        workspace_id: "00000000-0000-0000-0000-000000000001",
        phone_number_id: "123456",
        waba_id: "waba-123",
        display_phone_number: "+15550000000",
        business_name: "Test Business",
        access_token_encrypted: mockEncryptedToken,
        status: "AUTHENTICATED",
        webhook_status: "SUBSCRIBED",
        webhook_url: "https://example.com/webhook",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.whatsappCompliance = [
      {
        workspace_id: "00000000-0000-0000-0000-000000000001",
        messaging_paused: false,
        pause_reason: null,
        daily_outbound_limit: 1000,
        per_minute_outbound_limit: 60,
        updated_at: new Date().toISOString(),
      },
    ];

    this.whatsappUsage = [
      {
        id: "usage-1",
        workspace_id: "00000000-0000-0000-0000-000000000001",
        direction: "OUTBOUND",
        category: "UTILITY",
        quantity: 1,
        provider: "META",
        billable: true,
        billing_status: "UNRATED",
        created_at: new Date().toISOString(),
      },
    ];

    this.bookings = [];
    this.activityLogs = [];
    this.refreshTokens = [];
    this.rules = [];
    this.automationLeads = [];
    this.escalations = [];
    this.auditLogs = [];
    this.pricingRates = [
      { country: "US", category: "MARKETING", rate: 0.025 },
      { country: "US", category: "UTILITY", rate: 0.01 },
    ];
    this.wallet = {
      workspace_id: "00000000-0000-0000-0000-000000000001",
      balance: "100.00",
      currency: "USD",
      low_balance_threshold: "10.00",
      auto_recharge_enabled: false,
      auto_recharge_amount: "50.00",
      updated_at: new Date().toISOString(),
    };
    this.ledger = [];
    this.billingTransactions = [];
  }

  handleQuery(sql, params = []) {
    const s = sql.trim().toLowerCase();

    // WORKSPACES
    if (s.includes("insert into workspaces")) {
      const name = params[0];
      const email = params[1];
      const pass = params[2];
      const ws = {
        id: "00000000-0000-0000-0000-00000000000" + (this.workspaces.length + 1),
        name,
        email,
        password_hash: pass,
        avatar_url: null,
        auth_provider: params[3] || "password",
        auto_reply: true,
        notify_new_leads: true,
        flag_leaks: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.workspaces.push(ws);
      return { rows: [ws], rowCount: 1 };
    }

    if (s.includes("from workspaces")) {
      if (s.includes("where id =")) {
        const ws = this.workspaces.find((w) => w.id === params[0]) || this.workspaces[0];
        return { rows: [ws], rowCount: ws ? 1 : 0 };
      }
      const email = params[0];
      const ws = this.workspaces.find((w) => w.email === email) || this.workspaces[0];
      return { rows: [ws], rowCount: ws ? 1 : 0 };
    }

    if (s.includes("update workspaces set")) {
      const ws = this.workspaces[0];
      if (s.includes("auto_reply")) {
        ws.auto_reply = params[0];
        ws.notify_new_leads = params[1];
        ws.flag_leaks = params[2];
        return { rows: [{ auto_reply: ws.auto_reply, notify_new_leads: ws.notify_new_leads, flag_leaks: ws.flag_leaks }], rowCount: 1 };
      }
      if (params[0]) ws.name = params[0];
      if (params[1]) ws.email = params[1];
      return { rows: [ws], rowCount: 1 };
    }

    // REFRESH TOKENS
    if (s.includes("insert into refresh_tokens")) {
      const rt = {
        id: "rt-" + (this.refreshTokens.length + 1),
        workspace_id: params[0],
        token_hash: params[1],
        created_at: new Date().toISOString(),
      };
      this.refreshTokens.push(rt);
      return { rows: [rt], rowCount: 1 };
    }

    if (s.includes("from refresh_tokens")) {
      const ws = this.workspaces[0];
      return { rows: [{ refresh_id: "rt-1", ...ws }], rowCount: 1 };
    }

    if (s.includes("update refresh_tokens set revoked_at")) {
      return { rows: [], rowCount: 1 };
    }

    // WORKSPACE SETTINGS
    if (s.includes("from workspace_settings")) {
      const sett = this.workspaceSettings[0];
      return { rows: [sett], rowCount: sett ? 1 : 0 };
    }

    if (s.includes("insert into workspace_settings") || s.includes("update workspace_settings")) {
      const sett = this.workspaceSettings[0];
      return { rows: [sett], rowCount: 1 };
    }

    // CONTACT PREFERENCES & AUDIT LOG
    if (s.includes("whatsapp_audit_log")) {
      return { rows: [], rowCount: 1 };
    }

    if (s.includes("from whatsapp_contact_preferences")) {
      const cleanParam = String(params[1] || params[0] || "").replace(/[^\d]/g, "");
      const pref = this.contactPreferences.find((p) => String(p.phone || "").replace(/[^\d]/g, "") === cleanParam || p.contact_id === params[1]);
      return { rows: pref ? [pref] : [{ opted_out: false }], rowCount: 1 };
    }

    if (s.includes("insert into whatsapp_contact_preferences")) {
      const pref = {
        id: "pref-1",
        workspace_id: params[0] || "00000000-0000-0000-0000-000000000001",
        contact_id: params[1] || "contact-1",
        phone: params[2] || "+15550123456",
        opted_out: Boolean(params[3]),
        opt_out_source: params[4] || "SYSTEM",
        opt_out_reason: params[5] || null,
        opted_out_at: params[3] ? new Date().toISOString() : null,
        opted_in_at: params[3] ? null : new Date().toISOString(),
      };
      const existingIdx = this.contactPreferences.findIndex((p) => p.contact_id === pref.contact_id || p.phone === pref.phone);
      if (existingIdx >= 0) {
        this.contactPreferences[existingIdx] = pref;
      } else {
        this.contactPreferences.push(pref);
      }
      return { rows: [pref], rowCount: 1 };
    }

    // CONTACTS
    if (s.includes("from contacts")) {
      if (s.includes("date_trunc")) {
        return { rows: [{ day: new Date().toISOString(), value: 1 }], rowCount: 1 };
      }
      if (s.includes("where phone =") || s.includes("where workspace_id = $1 and phone =")) {
        const phoneParam = params.find((p) => typeof p === "string" && p.startsWith("+"));
        const contact = this.contacts.find((c) => c.phone === phoneParam) || (s.includes("workspace_id") ? this.contacts[0] : null);
        return { rows: contact ? [contact] : [], rowCount: contact ? 1 : 0 };
      }
      if (s.includes("where id =") || s.includes("where workspace_id = $1 and id = $2")) {
        const idParam = params.find((p) => typeof p === "string" && p.startsWith("contact-")) || "contact-1";
        const contact = this.contacts.find((c) => c.id === idParam) || this.contacts[0];
        return { rows: [contact], rowCount: 1 };
      }
      return { rows: this.contacts, rowCount: this.contacts.length };
    }

    if (s.includes("insert into contacts")) {
      const contact = {
        id: "contact-" + (this.contacts.length + 1),
        workspace_id: params[0],
        name: params[1] || "Contact",
        phone: params[2] || "+15550000000",
        source: params[3] || "Website",
        status: params[4] || "Hot",
        deal_value: params[5] || 500,
        unread_count: 0,
        opted_out: false,
        created_at: new Date().toISOString(),
      };
      this.contacts.push(contact);
      return { rows: [contact], rowCount: 1 };
    }

    if (s.includes("update contacts")) {
      const c = this.contacts[0];
      if (params.length >= 1) c.status = params[0];
      if (params.length >= 2) c.deal_value = params[1];
      return { rows: [c], rowCount: 1 };
    }

    // LEADS
    if (s.includes("from leads")) {
      if (s.includes("count(*)")) {
        return { rows: [{ count: this.leads.length, hot_count: 1 }], rowCount: 1 };
      }
      if (s.includes("where id =") || s.includes("where workspace_id = $1 and id = $2")) {
        const lead = this.leads.find((l) => l.id === params[1] || l.id === params[0]) || this.leads[0];
        return { rows: [lead], rowCount: 1 };
      }
      return { rows: this.leads, rowCount: this.leads.length };
    }

    if (s.includes("insert into leads")) {
      const lead = {
        id: "lead-" + (this.leads.length + 1),
        workspace_id: params[0],
        contact_id: params[1] || "contact-1",
        name: params[2] || "New Lead",
        phone: params[3] || "+15550000000",
        source: params[4] || "Website",
        status: params[5] || "Hot",
        value: params[6] || 100,
        deal_value: params[6] || 100,
        created_at: new Date().toISOString(),
      };
      this.leads.push(lead);
      return { rows: [lead], rowCount: 1 };
    }

    if (s.includes("update leads set")) {
      const lead = this.leads[0];
      if (params[0]) lead.status = params[0];
      return { rows: [lead], rowCount: 1 };
    }

    // MESSAGES / CONVERSATIONS
    if (s.includes("insert into messages")) {
      const textParam = params.find((p) => typeof p === "string" && p.length > 0 && !p.startsWith("0000") && !p.startsWith("contact-") && !p.startsWith("conn-")) || "Message text";
      const msg = {
        id: "msg-" + (this.messages.length + 1),
        workspace_id: params[0],
        contact_id: params[1],
        text: textParam,
        body: textParam,
        is_agent: true,
        read: true,
        direction: s.includes("'inbound'") ? "INBOUND" : "OUTBOUND",
        message_source: s.includes("'customer'") ? "CUSTOMER" : "CRM_AGENT",
        created_at: new Date().toISOString(),
      };
      this.messages.push(msg);
      return { rows: [msg], rowCount: 1 };
    }

    if (s.includes("update messages")) {
      const msg = this.messages[this.messages.length - 1] || this.messages[0];
      return { rows: [msg], rowCount: 1 };
    }

    if (s.includes("from messages")) {
      if (s.includes("where id =")) {
        const msg = this.messages.find((m) => m.id === params[0]) || this.messages[this.messages.length - 1];
        return { rows: [msg], rowCount: 1 };
      }
      return { rows: this.messages, rowCount: this.messages.length };
    }

    // NOTIFICATIONS
    if (s.includes("from notifications")) {
      if (s.includes("count(*)")) {
        return { rows: [{ count: this.notifications.filter((n) => !n.read).length }], rowCount: 1 };
      }
      return { rows: this.notifications, rowCount: this.notifications.length };
    }

    if (s.includes("insert into notifications")) {
      const notif = {
        id: "notif-" + (this.notifications.length + 1),
        workspace_id: params[0],
        title: params[1],
        message: params[2],
        type: params[3],
        read: false,
        created_at: new Date().toISOString(),
      };
      this.notifications.push(notif);
      return { rows: [notif], rowCount: 1 };
    }

    if (s.includes("update notifications")) {
      return { rows: [], rowCount: 1 };
    }

    // WHATSAPP CONNECTIONS & COMPLIANCE
    if (s.includes("from whatsapp_connections")) {
      const conn = this.whatsappConnections[0];
      return { rows: [conn], rowCount: conn ? 1 : 0 };
    }

    if (s.includes("insert into whatsapp_connections") || s.includes("update whatsapp_connections")) {
      let status = "AUTHENTICATED";
      if (s.includes("status = 'disconnected'") || s.includes("'disconnected'")) {
        status = "DISCONNECTED";
      } else if (s.includes("status = 'reconnecting'")) {
        status = "RECONNECTING";
      }
      const conn = {
        ...this.whatsappConnections[0],
        display_phone_number: params[0] && params[0].startsWith("+") ? params[0] : this.whatsappConnections[0].display_phone_number,
        access_token_encrypted: mockEncryptedToken,
        status,
      };
      this.whatsappConnections[0] = conn;
      return { rows: [conn], rowCount: 1 };
    }

    if (s.includes("from whatsapp_compliance_settings")) {
      const comp = this.whatsappCompliance[0];
      return { rows: [comp], rowCount: comp ? 1 : 0 };
    }

    if (s.includes("insert into whatsapp_compliance_settings") || s.includes("update whatsapp_compliance_settings")) {
      const comp = {
        ...this.whatsappCompliance[0],
        messaging_paused: params[1] ?? this.whatsappCompliance[0].messaging_paused,
        pause_reason: params[2] ?? this.whatsappCompliance[0].pause_reason,
        daily_outbound_limit: params[3] ?? 1000,
        per_minute_outbound_limit: params[4] ?? 60,
        updated_at: new Date().toISOString(),
      };
      this.whatsappCompliance[0] = comp;
      return { rows: [comp], rowCount: 1 };
    }

    if (s.includes("from whatsapp_usage_records") || s.includes("from whatsapp_usage") || s.includes("insert into whatsapp_message_usage") || s.includes("insert into whatsapp_usage_records")) {
      const u = {
        id: "usage-" + (this.whatsappUsage.length + 1),
        workspace_id: params[0] || "00000000-0000-0000-0000-000000000001",
        direction: "INBOUND",
        category: "SERVICE",
        quantity: 1,
        provider: "META",
        billable: true,
        billing_status: "UNRATED",
        created_at: new Date().toISOString(),
      };
      this.whatsappUsage.push(u);
      return { rows: [u], rowCount: 1 };
    }

    if (s.includes("whatsapp_webhook_events")) {
      return { rows: [{ id: "event-1", should_process: true }], rowCount: 1 };
    }

    // BOOKINGS
    if (s.includes("from bookings")) {
      if (s.includes("date_trunc")) {
        return { rows: [{ day: new Date().toISOString(), value: 500 }], rowCount: 1 };
      }
      return { rows: this.bookings, rowCount: this.bookings.length };
    }

    if (s.includes("insert into bookings")) {
      const b = {
        id: "booking-" + (this.bookings.length + 1),
        workspace_id: params[0],
        lead_id: params[1],
        amount: params[2] || 500,
        created_at: new Date().toISOString(),
      };
      this.bookings.push(b);
      return { rows: [b], rowCount: 1 };
    }

    // ACTIVITY LOGS
    if (s.includes("from activity_logs") || s.includes("from activity_log")) {
      return { rows: this.activityLogs, rowCount: this.activityLogs.length };
    }

    if (s.includes("insert into activity_logs") || s.includes("insert into activity_log")) {
      const a = {
        id: "act-" + (this.activityLogs.length + 1),
        workspace_id: params[0],
        action: params[1],
        created_at: new Date().toISOString(),
      };
      this.activityLogs.push(a);
      return { rows: [a], rowCount: 1 };
    }

    // AUTOMATION RULES, LEADS, ESCALATIONS
    if (s.includes("from automation_rules") || s.includes("from rules")) {
      return { rows: this.rules, rowCount: this.rules.length };
    }

    if (s.includes("insert into automation_rules") || s.includes("insert into rules")) {
      const rule = {
        id: "rule-" + (this.rules.length + 1),
        workspace_id: params[0],
        name: params[1] || "Rule",
        enabled: true,
        created_at: new Date().toISOString(),
      };
      this.rules.push(rule);
      return { rows: [rule], rowCount: 1 };
    }

    if (s.includes("from automation_captured_leads") || s.includes("from automation_leads")) {
      return { rows: this.automationLeads, rowCount: this.automationLeads.length };
    }

    if (s.includes("from escalations")) {
      return { rows: this.escalations, rowCount: this.escalations.length };
    }

    // BILLING & ADMIN
    if (s.includes("from whatsapp_billing_transactions") || s.includes("insert into whatsapp_billing_transactions")) {
      const tx = {
        id: "tx-" + (this.billingTransactions.length + 1),
        workspace_id: params[0] || "00000000-0000-0000-0000-000000000001",
        provider: params[1] || "RAZORPAY",
        provider_payment_id: params[1] || "pay_123",
        provider_order_id: params[2] || "order_123",
        amount: params[3] || 50,
        currency: params[4] || "USD",
        status: params[5] || "COMPLETED",
        created_at: new Date().toISOString(),
      };
      this.billingTransactions.push(tx);
      return { rows: [tx], rowCount: 1 };
    }

    if (s.includes("from whatsapp_wallets") || s.includes("insert into whatsapp_wallets")) {
      return { rows: [this.wallet], rowCount: 1 };
    }

    if (s.includes("from whatsapp_ledger") || s.includes("insert into whatsapp_ledger")) {
      return { rows: this.ledger, rowCount: this.ledger.length };
    }

    if (s.includes("from whatsapp_pricing_rates") || s.includes("from pricing_rates") || s.includes("insert into whatsapp_pricing_rates")) {
      const rate = {
        id: "rate-1",
        country_code: params[0] || "US",
        category: params[1] || "MARKETING",
        rate: params[2] || 0.025,
        currency: "USD",
        provider: "META",
        updated_at: new Date().toISOString(),
      };
      return { rows: [rate], rowCount: 1 };
    }

    if (s.includes("from whatsapp_audit_log") || s.includes("from audit_logs")) {
      return { rows: this.auditLogs, rowCount: this.auditLogs.length };
    }

    // DEFAULT FALLBACK
    return { rows: [], rowCount: 0 };
  }
}

export const mockDbState = new MockDatabase();

// Override pool.query and pool.connect
pool.query = async (sql, params) => {
  return mockDbState.handleQuery(sql, params);
};

pool.connect = async () => {
  return {
    query: async (sql, params) => mockDbState.handleQuery(sql, params),
    release: () => {},
  };
};

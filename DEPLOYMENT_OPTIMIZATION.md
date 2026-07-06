# WhatsApp Automation System - Deployment & Optimization Guide

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Monitoring/alerting set up
- [ ] Load testing completed

### Deployment Steps

```bash
# 1. Build and test
npm run build
npm run test

# 2. Run migrations
npm run migrate

# 3. Verify webhook
curl https://yourdomain.com/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE

# 4. Start service
npm start

# 5. Monitor logs
tail -f logs/whatsapp-dashboard.log
```

### Production Environment Variables

```env
NODE_ENV=production

# Database
DB_HOST=production-db.example.com
DB_USER=app_user
DB_PASSWORD=strong_password_here
DB_NAME=whatsapp_dashboard
DB_POOL_SIZE=20
DB_POOL_MAX_IDLE_TIME=300000

# WhatsApp API
WHATSAPP_ACCESS_TOKEN=your_prod_token
WHATSAPP_PHONE_ID=your_prod_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_prod_account_id
WHATSAPP_WEBHOOK_SECRET=your_secret_key
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Google AI
GOOGLE_AI_API_KEY=your_prod_key
GOOGLE_AI_RATE_LIMIT=100  # requests/minute

# Server
PORT=4000
API_BASE_URL=https://api.yourdomain.com
FRONTEND_ORIGIN=https://app.yourdomain.com
SESSION_SECRET=long_random_string

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_key
```

## Performance Optimization

### 1. Database Optimization

**Indexes:**
```sql
-- Critical indexes already in migration, verify:
CREATE INDEX idx_automation_rules_workspace_enabled 
  ON automation_rules(workspace_id, enabled);
  
CREATE INDEX idx_automation_analyses_created 
  ON automation_analyses(created_at);
  
CREATE INDEX idx_workflow_executions_created 
  ON workflow_executions(created_at);
```

**Query Optimization:**
```javascript
// ✅ Good - Uses index
SELECT * FROM automation_rules 
WHERE workspace_id = ? AND enabled = true LIMIT 10;

// ❌ Bad - Full table scan
SELECT * FROM automation_rules 
WHERE enabled = true AND created_at > NOW() - INTERVAL 7 DAY;
```

**Connection Pooling:**
```javascript
// Configure in database.js
const pool = mysql.createPool({
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0,
  idleTimeoutMillis: 30000,
  enableKeepAlive: true,
});
```

### 2. AI Service Optimization

**Request Batching:**
```javascript
// Analyze multiple messages at once
const messages = [...]; // array of 50 messages
const results = await aiAnalyzer.batchAnalyzeMessages(messages);
```

**Response Caching:**
```javascript
// Cache common intents for FAQ
const faqCache = new Map();
const TTL = 3600000; // 1 hour

async function getOrCacheFAQ(workspaceId, keywords) {
  const cacheKey = `faq:${workspaceId}:${keywords.join(',')}`;
  
  if (faqCache.has(cacheKey)) {
    return faqCache.get(cacheKey);
  }
  
  const result = await db.query(...);
  faqCache.set(cacheKey, result);
  
  setTimeout(() => faqCache.delete(cacheKey), TTL);
  return result;
}
```

**Rate Limiting:**
```javascript
// Implement per-workspace rate limits
const rateLimit = require('express-rate-limit');

const automationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per workspace
  keyGenerator: (req) => req.workspace.id,
  skip: (req) => req.workspace.premium, // Premium = unlimited
});

router.use(automationLimiter);
```

### 3. Message Processing Optimization

**Async Processing:**
```javascript
// Don't wait for webhook response
router.post('/webhooks/whatsapp', async (req, res) => {
  // Acknowledge immediately
  res.status(200).json({ success: true });
  
  // Process asynchronously
  setImmediate(() => {
    webhookHandler.handleIncomingMessage(webhookData)
      .catch(err => logger.error('Async processing failed:', err));
  });
});
```

**Queue System (Optional):**
```javascript
// For high-volume scenarios, use message queue
const Bull = require('bull');
const messageQueue = new Bull('whatsapp-messages');

// Producer
messageQueue.add({
  webhookData,
  timestamp: Date.now(),
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
});

// Consumer
messageQueue.process(async (job) => {
  return await webhookHandler.handleIncomingMessage(job.data.webhookData);
});
```

### 4. API Response Optimization

**Pagination:**
```javascript
// Always paginate large result sets
const limit = Math.min(req.query.limit || 50, 100);
const offset = req.query.offset || 0;

const [results] = await db.query(
  'SELECT * FROM table LIMIT ? OFFSET ?',
  [limit, offset]
);
```

**Field Selection:**
```javascript
// Only fetch needed fields
SELECT id, name, email, status 
FROM leads 
WHERE workspace_id = ?;  // ✅ Good - specific fields

SELECT * FROM leads WHERE workspace_id = ?;  // ❌ Bad - all fields
```

**Response Compression:**
```javascript
const compression = require('compression');
app.use(compression());
```

### 5. Caching Strategy

**Redis Caching (Optional):**
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache FAQ results
async function getFAQWithCache(query) {
  const cacheKey = `faq:${query}`;
  
  // Try cache
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch and cache
  const result = await db.query('SELECT * FROM faq_items WHERE ...');
  await client.setex(cacheKey, 3600, JSON.stringify(result));
  
  return result;
}
```

## Monitoring & Observability

### Key Metrics to Track

**System Metrics:**
- API response time (p50, p95, p99)
- Error rate
- CPU usage
- Memory usage
- Database connection pool utilization

**Business Metrics:**
- Messages processed per minute
- Workflow success rate
- Average workflow duration
- Escalation rate
- Lead capture rate

### Logging Configuration

```javascript
// Structured logging
logger.info('[Workflow] Executed lead_capture', {
  workspaceId,
  conversationId,
  duration: 245,
  success: true,
  timestamp: new Date().toISOString(),
});
```

### Alerting Thresholds

```javascript
// Alert if error rate > 5%
if (errorRate > 0.05) {
  alerting.notify('High error rate detected');
}

// Alert if response time p95 > 5 seconds
if (responseTimeP95 > 5000) {
  alerting.notify('Slow API response detected');
}

// Alert if escalation rate > 30%
if (escalationRate > 0.30) {
  alerting.notify('High escalation rate - check AI model');
}
```

## Scaling Strategy

### Horizontal Scaling

**Load Balancing:**
```
Internet → Load Balancer (nginx/HAProxy)
           ├→ API Server 1
           ├→ API Server 2
           └→ API Server 3
           ↓
        Shared Database
```

**Configuration:**
```nginx
upstream api_servers {
  least_conn;  # Load balance by least connections
  
  server api-1.internal:4000;
  server api-2.internal:4000;
  server api-3.internal:4000;
  
  keepalive 64;
}

server {
  listen 443 ssl http2;
  
  location /api/v1 {
    proxy_pass http://api_servers;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
  }
}
```

### Vertical Scaling

**Database:**
- Increase connection pool size: `connectionLimit: 50`
- Add read replicas for analytics queries
- Optimize slow queries (see logs)

**Application:**
- Increase Node.js heap: `NODE_MAX_OLD_SPACE_SIZE=4096`
- Use clustering: `cluster.fork()` for multi-core

**Infrastructure:**
- Increase server RAM
- Use SSD for database
- Dedicated machine for AI inference

## Disaster Recovery

### Backup Strategy

```bash
# Daily database backups
0 2 * * * mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME | \
           gzip > /backups/db-$(date +%Y%m%d).sql.gz

# Retention: Keep 30 days
find /backups -name "db-*.sql.gz" -mtime +30 -delete

# Store in S3
aws s3 sync /backups s3://backup-bucket/whatsapp-dashboard/
```

### Recovery Testing

```bash
# Test restoration monthly
1. Restore from backup to staging
2. Verify data integrity
3. Run smoke tests
4. Document recovery time
```

## Security Hardening

### Input Validation

```javascript
// Always validate and sanitize
const message = req.body.message?.trim().substring(0, 4096);
if (!message || message.length < 1) {
  return res.status(400).json({ error: 'Invalid message' });
}
```

### Rate Limiting

```javascript
// Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
  standardHeaders: true,
});

app.use('/api/', limiter);
```

### CORS & Security Headers

```javascript
const helmet = require('helmet');
const cors = require('cors');

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
}));
```

## Troubleshooting Common Issues

### High Memory Usage

```bash
# Check Node process memory
ps aux | grep node

# Analyze heap
node --inspect app.js
# Then open chrome://inspect

# Look for memory leaks:
# - Unclosed database connections
# - Event listener accumulation
# - Large cache that never evicts
```

### Slow Database Queries

```bash
# Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

# Check /var/log/mysql/slow.log
ANALYZE SELECT ... # shows execution plan

# Add missing indexes if needed
```

### High Error Rate

```javascript
// Check error logs for patterns
tail -f logs/whatsapp-dashboard.log | grep ERROR

// Common causes:
// 1. Database connection pool exhausted
// 2. Google AI API rate limit exceeded
// 3. WhatsApp API token expired
// 4. Webhook signature validation failure
```

## Performance Targets

| Metric | Target | Alert |
|--------|--------|-------|
| API Response Time (p95) | < 2s | > 5s |
| Message Processing Time | < 500ms | > 2s |
| Workflow Success Rate | > 95% | < 90% |
| Escalation Rate | < 20% | > 30% |
| Database Query (p95) | < 100ms | > 500ms |
| Error Rate | < 1% | > 5% |
| Availability | > 99.9% | < 99.5% |

## Continuous Improvement

### Weekly Reviews

1. Check error logs for patterns
2. Review slow query logs
3. Monitor API response times
4. Track workflow success rates
5. Review escalation trends

### Monthly Reviews

1. Capacity planning (growth rate)
2. Security audit
3. Database optimization
4. FAQ effectiveness review
5. Agent performance analysis

### Quarterly Reviews

1. Architecture review
2. Load testing
3. Disaster recovery drill
4. Security penetration test
5. Cost optimization

---

**Version:** 1.0
**Last Updated:** 2024
**Status:** Production Ready

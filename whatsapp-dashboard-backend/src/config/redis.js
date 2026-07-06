const Redis = require("ioredis");

// Point this at the SAME Redis instance your WhatsApp automation backend
// (session state machine + BullMQ) already uses — no need for a second instance.
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = redis;

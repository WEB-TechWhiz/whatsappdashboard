// const { Pool } = require("pg");
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  // Idle client errors — log loudly, don't crash the process on a transient DB blip
  console.error("Unexpected Postgres pool error:", err);
});

// module.exports = pool;
export default pool;

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Connected successfully!");
    console.log(result.rows[0]);
    await pool.end();
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(err.message);
  }
})();
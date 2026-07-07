const pool = require("./config/db");

/**
 * Database query wrapper
 * Usage: const [rows] = await db.query(sql, params);
 */
const db = {
  query: async (sql, params = []) => {
    try {
      const result = await pool.query(sql, params);
      return [result.rows, result];
    } catch (error) {
      console.error("[DB] Query error:", error.message, {
        sql: sql.substring(0, 100),
        params,
      });
      throw error;
    }
  },

  transaction: async (fn) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  end: async () => {
    await pool.end();
  },
};

module.exports = db;
